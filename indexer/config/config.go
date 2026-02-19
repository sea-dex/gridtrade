package config

import (
	"fmt"
	"os"
	"regexp"

	"gopkg.in/yaml.v3"
)

// Config is the top-level configuration.
type Config struct {
	Chains   []ChainConfig `yaml:"chains"`
	Database DBConfig      `yaml:"database"`
	Kafka    KafkaConfig   `yaml:"kafka"`
	Log      LogConfig     `yaml:"log"`
	OKX      OKXConfig     `yaml:"okx"`
}

// ChainConfig describes one EVM chain to index.
type ChainConfig struct {
	Name                  string `yaml:"name"`
	ChainID               int64  `yaml:"chain_id"`
	RPCURL                string `yaml:"rpc_url"`
	GridExAddress         string `yaml:"gridex_address"`
	LinearStrategyAddress string `yaml:"linear_strategy_address"` // Linear strategy contract address
	StartBlock            uint64 `yaml:"start_block"`
	BlockBatchSize        uint64 `yaml:"block_batch_size"` // how many blocks per eth_getLogs call
	PollInterval          int    `yaml:"poll_interval_ms"` // milliseconds between polls
	Confirmations         uint64 `yaml:"confirmations"`    // blocks to wait for finality
	RPCTPM                int    `yaml:"rpc_tpm"`          // max RPC requests per minute (0 = unlimited)
}

// OKXConfig holds OKX DEX API authentication config.
type OKXConfig struct {
	APIKey     string `yaml:"api_key"`
	SecretKey  string `yaml:"secret_key"`
	Passphrase string `yaml:"passphrase"`
}

// DBConfig holds PostgreSQL connection parameters.
type DBConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
	DBName   string `yaml:"dbname"`
	SSLMode  string `yaml:"sslmode"`
}

// DSN returns a PostgreSQL connection string.
func (d DBConfig) DSN() string {
	sslmode := d.SSLMode
	if sslmode == "" {
		sslmode = "disable"
	}
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=%s",
		d.User, d.Password, d.Host, d.Port, d.DBName, sslmode,
	)
}

// KafkaConfig holds Kafka producer settings.
type KafkaConfig struct {
	Brokers []string `yaml:"brokers"`
	Topic   string   `yaml:"topic"`
}

// LogConfig holds logging settings.
type LogConfig struct {
	Level string `yaml:"level"` // debug, info, warn, error
}

// expandEnv expands environment variables in a string, supporting
// both ${VAR} and ${VAR:-default} syntax (the latter is not supported
// by os.ExpandEnv).
func expandEnv(s string) string {
	// Match ${VAR:-default} or ${VAR}
	re := regexp.MustCompile(`\$\{([^}]+)\}`)
	return re.ReplaceAllStringFunc(s, func(match string) string {
		// Strip ${ and }
		inner := match[2 : len(match)-1]

		// Check for :- separator (default value syntax)
		for i := 0; i < len(inner)-1; i++ {
			if inner[i] == ':' && inner[i+1] == '-' {
				varName := inner[:i]
				defaultVal := inner[i+2:]
				if val, ok := os.LookupEnv(varName); ok {
					return val
				}
				return defaultVal
			}
		}

		// No default — plain ${VAR}
		if val, ok := os.LookupEnv(inner); ok {
			return val
		}
		return ""
	})
}

// Load reads a YAML config file and returns a Config.
func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config file %s: %w", path, err)
	}

	// Expand environment variables in the YAML content (supports ${VAR:-default})
	expanded := expandEnv(string(data))

	cfg := &Config{}
	if err := yaml.Unmarshal([]byte(expanded), cfg); err != nil {
		return nil, fmt.Errorf("parse config file %s: %w", path, err)
	}

	// Apply defaults
	for i := range cfg.Chains {
		if cfg.Chains[i].BlockBatchSize == 0 {
			cfg.Chains[i].BlockBatchSize = 100
		}
		if cfg.Chains[i].PollInterval == 0 {
			cfg.Chains[i].PollInterval = 2000
		}
		if cfg.Chains[i].Confirmations == 0 {
			cfg.Chains[i].Confirmations = 3
		}
	}

	if cfg.Database.Port == 0 {
		cfg.Database.Port = 5432
	}
	if cfg.Database.SSLMode == "" {
		cfg.Database.SSLMode = "disable"
	}
	if cfg.Log.Level == "" {
		cfg.Log.Level = "info"
	}

	return cfg, nil
}
