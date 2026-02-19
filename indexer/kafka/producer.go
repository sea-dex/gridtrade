package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net"
	"time"

	kafkago "github.com/segmentio/kafka-go"
)

const (
	// topicVerifyRetries is the number of times to check that a newly created
	// topic is visible on the broker before giving up.
	topicVerifyRetries = 10
	// topicVerifyInterval is the delay between verification attempts.
	topicVerifyInterval = 1 * time.Second
)

// EventType identifies the type of event in a Kafka message.
type EventType string

const (
	EventPairCreated     EventType = "pair_created"
	EventGridCreated     EventType = "grid_created"
	EventOrderCreated    EventType = "order_created"
	EventOrderFilled     EventType = "order_filled"
	EventOrderCancelled  EventType = "order_cancelled"
	EventGridCancelled   EventType = "grid_cancelled"
	EventGridFeeChanged  EventType = "grid_fee_changed"
	EventProfitWithdrawn EventType = "profit_withdrawn"
)

// Message is the envelope for all Kafka messages.
type Message struct {
	EventType   EventType   `json:"event_type"`
	ChainID     int64       `json:"chain_id"`
	BlockNumber uint64      `json:"block_number"`
	TxHash      string      `json:"tx_hash"`
	LogIndex    uint        `json:"log_index"`
	Timestamp   int64       `json:"timestamp"`
	Data        interface{} `json:"data"`
}

// PairCreatedData is the data payload for pair_created events.
type PairCreatedData struct {
	PairID       int    `json:"pair_id"`
	BaseAddress  string `json:"base_address"`
	QuoteAddress string `json:"quote_address"`
	BaseSymbol   string `json:"base_symbol"`
	QuoteSymbol  string `json:"quote_symbol"`
}

// GridCreatedData is the data payload for grid_created events.
type GridCreatedData struct {
	GridID             int64  `json:"grid_id"`
	Owner              string `json:"owner"`
	PairID             int    `json:"pair_id"`
	BaseToken          string `json:"base_token"`
	QuoteToken         string `json:"quote_token"`
	AskOrderCount      int    `json:"ask_order_count"`
	BidOrderCount      int    `json:"bid_order_count"`
	InitialBaseAmount  string `json:"initial_base_amount"`
	InitialQuoteAmount string `json:"initial_quote_amount"`
	Fee                int    `json:"fee"`
	Compound           bool   `json:"compound"`
	Oneshot            bool   `json:"oneshot"`
	AskPrice0          string `json:"ask_price0,omitempty"`
	AskGap             string `json:"ask_gap,omitempty"`
	BidPrice0          string `json:"bid_price0,omitempty"`
	BidGap             string `json:"bid_gap,omitempty"`
}

// OrderCreatedData is the data payload for order_created events.
type OrderCreatedData struct {
	OrderID            string `json:"order_id"`
	GridID             int64  `json:"grid_id"`
	PairID             int    `json:"pair_id"`
	IsAsk              bool   `json:"is_ask"`
	Amount             string `json:"amount"`
	RevAmount          string `json:"rev_amount"`
	Price              string `json:"price"`
	RevPrice           string `json:"rev_price"`
	InitialBaseAmount  string `json:"initial_base_amount"`
	InitialQuoteAmount string `json:"initial_quote_amount"`
}

// OrderFilledData is the data payload for order_filled events.
type OrderFilledData struct {
	OrderID     string `json:"order_id"`
	GridID      int64  `json:"grid_id"`
	Taker       string `json:"taker"`
	BaseAmt     string `json:"base_amt"`
	QuoteVol    string `json:"quote_vol"`
	OrderAmt    string `json:"order_amt"`
	OrderRevAmt string `json:"order_rev_amt"`
	IsAsk       bool   `json:"is_ask"`
}

// OrderCancelledData is the data payload for order_cancelled events.
type OrderCancelledData struct {
	OrderID string `json:"order_id"`
	GridID  int64  `json:"grid_id"`
	Owner   string `json:"owner"`
}

// GridCancelledData is the data payload for grid_cancelled events.
type GridCancelledData struct {
	GridID int64  `json:"grid_id"`
	Owner  string `json:"owner"`
}

// GridFeeChangedData is the data payload for grid_fee_changed events.
type GridFeeChangedData struct {
	GridID int64 `json:"grid_id"`
	Fee    int   `json:"fee"`
}

// ProfitWithdrawnData is the data payload for profit_withdrawn events.
type ProfitWithdrawnData struct {
	GridID int64  `json:"grid_id"`
	Quote  string `json:"quote"`
	To     string `json:"to"`
	Amount string `json:"amount"`
}

// Producer sends messages to Kafka.
type Producer struct {
	writer *kafkago.Writer
	logger *slog.Logger
}

// NewProducer creates a new Kafka producer.
// It will attempt to auto-create the topic if it does not exist.
func NewProducer(brokers []string, topic string, logger *slog.Logger) *Producer {
	w := &kafkago.Writer{
		Addr:                   kafkago.TCP(brokers...),
		Topic:                  topic,
		Balancer:               &kafkago.LeastBytes{},
		BatchTimeout:           10 * time.Millisecond,
		RequiredAcks:           kafkago.RequireAll,
		AllowAutoTopicCreation: true,
	}
	return &Producer{
		writer: w,
		logger: logger,
	}
}

// EnsureTopic creates the Kafka topic if it does not already exist and verifies
// that it is visible on the broker before returning. This should be called at
// startup to surface configuration errors early.
func EnsureTopic(brokers []string, topic string, numPartitions int, replicationFactor int) error {
	if numPartitions <= 0 {
		numPartitions = 1
	}
	if replicationFactor <= 0 {
		replicationFactor = 1
	}

	// Check if the topic already exists before attempting creation.
	if topicExists(brokers, topic) {
		return nil
	}

	// Connect to any broker to discover the controller
	conn, err := kafkago.Dial("tcp", brokers[0])
	if err != nil {
		return fmt.Errorf("dial kafka broker %s: %w", brokers[0], err)
	}
	defer conn.Close()

	controller, err := conn.Controller()
	if err != nil {
		return fmt.Errorf("get kafka controller: %w", err)
	}

	controllerConn, err := kafkago.Dial("tcp", net.JoinHostPort(controller.Host, fmt.Sprintf("%d", controller.Port)))
	if err != nil {
		return fmt.Errorf("dial kafka controller %s:%d: %w", controller.Host, controller.Port, err)
	}
	defer controllerConn.Close()

	err = controllerConn.CreateTopics(kafkago.TopicConfig{
		Topic:             topic,
		NumPartitions:     numPartitions,
		ReplicationFactor: replicationFactor,
	})
	if err != nil {
		return fmt.Errorf("create kafka topic %q: %w", topic, err)
	}

	// Wait for the topic to become visible on the broker. Topic creation is
	// asynchronous on some Kafka deployments, so we poll until the metadata
	// reflects the new topic.
	for range topicVerifyRetries {
		time.Sleep(topicVerifyInterval)
		if topicExists(brokers, topic) {
			return nil
		}
	}

	return fmt.Errorf("kafka topic %q was created but not visible after %d verification attempts", topic, topicVerifyRetries)
}

// topicExists checks whether the given topic is present in the broker metadata.
func topicExists(brokers []string, topic string) bool {
	conn, err := kafkago.Dial("tcp", brokers[0])
	if err != nil {
		return false
	}
	defer conn.Close()

	partitions, err := conn.ReadPartitions(topic)
	if err != nil {
		return false
	}
	return len(partitions) > 0
}

// Send sends a single message to Kafka.
func (p *Producer) Send(ctx context.Context, msg *Message) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("marshal kafka message: %w", err)
	}

	// Use chainID + eventType as key for ordering
	key := fmt.Sprintf("%d:%s", msg.ChainID, msg.EventType)

	err = p.writer.WriteMessages(ctx, kafkago.Message{
		Key:   []byte(key),
		Value: data,
	})
	if err != nil {
		return fmt.Errorf("write kafka message: %w", err)
	}

	p.logger.Debug("kafka message sent",
		"event_type", msg.EventType,
		"chain_id", msg.ChainID,
		"block", msg.BlockNumber,
	)
	return nil
}

// SendBatch sends multiple messages to Kafka in a batch.
func (p *Producer) SendBatch(ctx context.Context, msgs []*Message) error {
	if len(msgs) == 0 {
		return nil
	}

	kafkaMsgs := make([]kafkago.Message, 0, len(msgs))
	for _, msg := range msgs {
		data, err := json.Marshal(msg)
		if err != nil {
			return fmt.Errorf("marshal kafka message: %w", err)
		}
		key := fmt.Sprintf("%d:%s", msg.ChainID, msg.EventType)
		kafkaMsgs = append(kafkaMsgs, kafkago.Message{
			Key:   []byte(key),
			Value: data,
		})
	}

	err := p.writer.WriteMessages(ctx, kafkaMsgs...)
	if err != nil {
		return fmt.Errorf("write kafka batch: %w", err)
	}

	p.logger.Debug("kafka batch sent", "count", len(msgs))
	return nil
}

// LastOffset returns the last offset of the Kafka topic.
// This can be used by the indexer to track the latest offset for tradebot synchronization.
func (p *Producer) LastOffset(brokers []string, topic string) (int64, error) {
	// Connect to any broker
	conn, err := kafkago.Dial("tcp", brokers[0])
	if err != nil {
		return 0, fmt.Errorf("dial kafka broker %s: %w", brokers[0], err)
	}
	defer conn.Close()

	// Get the partition info for partition 0 (we use single partition)
	partitions, err := conn.ReadPartitions(topic)
	if err != nil {
		return 0, fmt.Errorf("read partitions for topic %s: %w", topic, err)
	}
	if len(partitions) == 0 {
		return 0, nil // No partitions means no messages yet
	}

	// Connect to the leader for partition 0
	partition := partitions[0]
	leaderAddr := net.JoinHostPort(partition.Leader.Host, fmt.Sprintf("%d", partition.Leader.Port))
	leaderConn, err := kafkago.DialLeader(context.Background(), "tcp", leaderAddr, topic, partition.ID)
	if err != nil {
		return 0, fmt.Errorf("dial leader for topic %s partition %d: %w", topic, partition.ID, err)
	}
	defer leaderConn.Close()

	// Read the last offset
	lastOffset, err := leaderConn.ReadLastOffset()
	if err != nil {
		return 0, fmt.Errorf("read last offset: %w", err)
	}

	return lastOffset, nil
}

// Close closes the Kafka producer.
func (p *Producer) Close() error {
	return p.writer.Close()
}
