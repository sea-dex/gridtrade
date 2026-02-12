// Package rpc provides a rate-limited wrapper around go-ethereum's ethclient.
package rpc

import (
	"context"
	"math/big"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"golang.org/x/time/rate"
)

// RateLimitedClient wraps an ethclient.Client with a token-bucket rate limiter
// to control the maximum number of RPC requests per second.
type RateLimitedClient struct {
	client  *ethclient.Client
	limiter *rate.Limiter
}

// NewRateLimitedClient creates a new rate-limited wrapper around the given
// ethclient.Client. The tpm parameter specifies the maximum requests per minute.
// If tpm <= 0, no rate limiting is applied (the limiter allows unlimited throughput).
func NewRateLimitedClient(client *ethclient.Client, tpm int) *RateLimitedClient {
	var limiter *rate.Limiter
	if tpm <= 0 {
		limiter = rate.NewLimiter(rate.Inf, 0)
	} else {
		// Convert requests-per-minute to requests-per-second for the limiter
		rps := float64(tpm) / 60.0
		// Allow a burst of up to max(1, tpm/10) to handle short spikes
		burst := max(tpm/10, 1)
		limiter = rate.NewLimiter(rate.Limit(rps), burst)
	}
	return &RateLimitedClient{
		client:  client,
		limiter: limiter,
	}
}

// wait blocks until the rate limiter allows one more request, or ctx is cancelled.
func (r *RateLimitedClient) wait(ctx context.Context) error {
	return r.limiter.Wait(ctx)
}

// BlockNumber returns the most recent block number.
// This call IS rate-limited because many RPC providers (e.g. Tatum) count
// all requests — including eth_blockNumber — toward their rate limit.
func (r *RateLimitedClient) BlockNumber(ctx context.Context) (uint64, error) {
	if err := r.wait(ctx); err != nil {
		return 0, err
	}
	return r.client.BlockNumber(ctx)
}

// FilterLogs executes a filter query.
func (r *RateLimitedClient) FilterLogs(ctx context.Context, q ethereum.FilterQuery) ([]types.Log, error) {
	if err := r.wait(ctx); err != nil {
		return nil, err
	}
	return r.client.FilterLogs(ctx, q)
}

// BlockByNumber returns a block by its number.
func (r *RateLimitedClient) BlockByNumber(ctx context.Context, number *big.Int) (*types.Block, error) {
	if err := r.wait(ctx); err != nil {
		return nil, err
	}
	return r.client.BlockByNumber(ctx, number)
}

// TransactionReceipt returns the receipt of a transaction by transaction hash.
func (r *RateLimitedClient) TransactionReceipt(ctx context.Context, txHash common.Hash) (*types.Receipt, error) {
	if err := r.wait(ctx); err != nil {
		return nil, err
	}
	return r.client.TransactionReceipt(ctx, txHash)
}

// CallContract executes a message call transaction, which is directly executed
// in the VM of the node, but never mined into the blockchain.
func (r *RateLimitedClient) CallContract(ctx context.Context, msg ethereum.CallMsg, blockNumber *big.Int) ([]byte, error) {
	if err := r.wait(ctx); err != nil {
		return nil, err
	}
	return r.client.CallContract(ctx, msg, blockNumber)
}

// Close closes the underlying ethclient connection.
func (r *RateLimitedClient) Close() {
	r.client.Close()
}
