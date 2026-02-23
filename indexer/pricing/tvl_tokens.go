package pricing

import "strings"

// TokenType classifies a token for TVL calculation purposes.
type TokenType int

const (
	// TokenTypeUnknown is a token not relevant for TVL calculation.
	TokenTypeUnknown TokenType = iota
	// TokenTypeStablecoin is a stablecoin (USDT, USDC, DAI) valued at $1.
	TokenTypeStablecoin
	// TokenTypeWrappedNative is a wrapped native token (WBNB, WETH) valued at Binance spot price.
	TokenTypeWrappedNative
)

// TVLTokenInfo holds classification and pricing metadata for a token.
type TVLTokenInfo struct {
	Type     TokenType
	Decimals int
}

// ChainNativeSymbol maps chain IDs to their native currency's Binance trading symbol.
// Used to construct the Binance pair symbol (e.g., "BNBUSDT", "ETHUSDT").
var ChainNativeSymbol = map[int64]string{
	1:    "ETHUSDT", // Ethereum mainnet
	56:   "BNBUSDT", // BSC mainnet
	97:   "BNBUSDT", // BSC testnet (use BNB price)
	8453: "ETHUSDT", // Base (uses ETH)
}

// tvlTokenRegistry maps chainID -> lowercase token address -> TVLTokenInfo.
// Only stablecoins and wrapped native tokens are included.
var tvlTokenRegistry = map[int64]map[string]TVLTokenInfo{
	// BSC Testnet (chain 97)
	97: {
		"0x64544969ed7ebf5f083679233325356ebe738930": {Type: TokenTypeStablecoin, Decimals: 18},    // USDC
		"0x337610d27c682e347c9cd60bd4b3b107c9d34ddd": {Type: TokenTypeStablecoin, Decimals: 18},    // USDT
		"0xae13d989dac2f0debff460ac112a837c89baa7cd": {Type: TokenTypeWrappedNative, Decimals: 18}, // WBNB
	},
	// BSC Mainnet (chain 56)
	56: {
		"0x55d398326f99059ff775485246999027b3197955": {Type: TokenTypeStablecoin, Decimals: 18},    // USDT
		"0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": {Type: TokenTypeStablecoin, Decimals: 18},    // USDC
		"0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c": {Type: TokenTypeWrappedNative, Decimals: 18}, // WBNB
	},
	// Ethereum Mainnet (chain 1)
	1: {
		"0xdac17f958d2ee523a2206206994597c13d831ec7": {Type: TokenTypeStablecoin, Decimals: 6},     // USDT
		"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": {Type: TokenTypeStablecoin, Decimals: 6},     // USDC
		"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": {Type: TokenTypeWrappedNative, Decimals: 18}, // WETH
	},
	// Base (chain 8453)
	8453: {
		"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": {Type: TokenTypeStablecoin, Decimals: 6},     // USDC
		"0x50c5725949a6f0c72e6c4a641f24049a917db0cb": {Type: TokenTypeStablecoin, Decimals: 18},    // DAI
		"0x4200000000000000000000000000000000000006": {Type: TokenTypeWrappedNative, Decimals: 18}, // WETH
	},
}

// LookupTVLToken returns the TVL token info for a given chain and token address.
// Returns (info, true) if the token is a stablecoin or wrapped native token,
// or (zero, false) if the token is not relevant for TVL calculation.
func LookupTVLToken(chainID int64, tokenAddress string) (TVLTokenInfo, bool) {
	chainTokens, ok := tvlTokenRegistry[chainID]
	if !ok {
		return TVLTokenInfo{}, false
	}
	info, ok := chainTokens[strings.ToLower(tokenAddress)]
	return info, ok
}
