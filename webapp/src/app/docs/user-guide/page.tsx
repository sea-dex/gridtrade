'use client';

import {
  DocH1,
  DocH2,
  DocH3,
  DocP,
  DocStrong,
  DocUl,
  DocOl,
  DocLi,
  DocTable,
  DocCode,
  DocCodeBlock,
  DocBlockquote,
  DocHr,
} from '../_components/DocsProse';
import { DocsPageNav } from '../_components/DocsPageNav';

export default function UserGuidePage() {
  return (
    <div>
      <DocH1>User Guide</DocH1>
      <DocP>
        A complete guide to using GridEx for automated grid trading on supported EVM chains.
      </DocP>

      <DocHr />

      {/* ── What is Grid Trading? ── */}
      <DocH2 id="what-is-grid-trading">What is Grid Trading?</DocH2>
      <DocP>
        Grid trading is an automated strategy that places a series of buy and sell orders at
        predetermined price intervals (the &quot;grid&quot;) around a reference price. As the market
        oscillates, orders are continuously filled — buying low and selling high — generating profit
        from each completed cycle.
      </DocP>

      <DocH3>How It Works</DocH3>
      <DocOl>
        <DocLi>You define the lowest ask (sell) price — <DocStrong>Ask Price₀</DocStrong> — and the highest bid (buy) price — <DocStrong>Bid Price₀</DocStrong>.</DocLi>
        <DocLi>You set an <DocStrong>Ask Gap</DocStrong> and a <DocStrong>Bid Gap</DocStrong> independently, along with the number of ask orders and bid orders.</DocLi>
        <DocLi>Sell orders are placed upward from Ask Price₀ with the ask gap spacing; buy orders are placed downward from Bid Price₀ with the bid gap spacing.</DocLi>
        <DocLi>When a buy order fills, a corresponding sell order is created one level higher (and vice versa).</DocLi>
        <DocLi>Each completed buy-sell cycle captures the price difference as profit.</DocLi>
      </DocOl>

      <DocBlockquote>
        Grid trading works best in range-bound, volatile markets where prices move sideways rather
        than trending strongly in one direction.
      </DocBlockquote>

      <DocHr />

      {/* ── Getting Started ── */}
      <DocH2 id="getting-started">Getting Started</DocH2>
      <DocP>
        Follow these four steps to start grid trading on GridEx:
      </DocP>
      <DocOl>
        <DocLi>
          <DocStrong>Connect your wallet</DocStrong> — link a supported wallet to the app.
        </DocLi>
        <DocLi>
          <DocStrong>Select a trading pair</DocStrong> — choose the base and quote tokens you want to trade.
        </DocLi>
        <DocLi>
          <DocStrong>Configure your grid</DocStrong> — set prices, gaps, order counts, amounts, and strategy options.
        </DocLi>
        <DocLi>
          <DocStrong>Place the order</DocStrong> — review your parameters and submit the transaction on-chain.
        </DocLi>
      </DocOl>

      <DocHr />

      {/* ── Connecting Your Wallet ── */}
      <DocH2 id="connecting-your-wallet">Connecting Your Wallet</DocH2>
      <DocP>
        GridEx supports the following wallet providers:
      </DocP>
      <DocUl>
        <DocLi><DocStrong>MetaMask</DocStrong> — browser extension &amp; mobile app</DocLi>
        <DocLi><DocStrong>WalletConnect</DocStrong> — scan a QR code from any compatible mobile wallet</DocLi>
        <DocLi><DocStrong>Coinbase Wallet</DocStrong> — browser extension &amp; mobile app</DocLi>
      </DocUl>

      <DocH3>Supported Chains</DocH3>
      <DocTable
        headers={['Chain', 'Chain ID', 'Native Token']}
        rows={[
          ['Ethereum', '1', 'ETH'],
          ['BNB Chain', '56', 'BNB'],
          ['Base', '8453', 'ETH'],
          ['BSC Testnet', '97', 'tBNB'],
        ]}
      />
      <DocP>
        Click the <DocStrong>Connect Wallet</DocStrong> button in the top-right corner, select your
        provider, and approve the connection. You can switch chains at any time from the chain
        selector dropdown.
      </DocP>

      <DocHr />

      {/* ── Creating a Grid Order ── */}
      <DocH2 id="creating-a-grid-order">Creating a Grid Order</DocH2>
      <DocP>
        Navigate to the <DocStrong>Grid</DocStrong> page and fill in the order form. Below is a
        reference for every parameter:
      </DocP>

      <DocTable
        headers={['Parameter', 'Type', 'Description']}
        rows={[
          ['Ask Strategy', 'enum', 'Choose how ask-side prices progress: Linear uses a fixed gap, Geometry uses a multiplicative ratio.'],
          ['Bid Strategy', 'enum', 'Choose how bid-side prices progress: Linear uses a fixed gap, Geometry uses a multiplicative ratio.'],
          ['Ask Price₀', 'number', 'The lowest sell price — the starting price for ask orders. Higher ask orders are placed upward from this price using the ask gap.'],
          ['Bid Price₀', 'number', 'The highest buy price — the starting price for bid orders. Lower bid orders are placed downward from this price using the bid gap.'],
          ['Ask Gap', 'number', 'Price spacing between consecutive sell (ask) orders. Independent from the bid gap.'],
          ['Bid Gap', 'number', 'Price spacing between consecutive buy (bid) orders. Independent from the ask gap.'],
          ['Ask Order Count', 'integer', 'Number of sell orders to create, starting from Ask Price₀ upward.'],
          ['Bid Order Count', 'integer', 'Number of buy orders to create, starting from Bid Price₀ downward.'],
          ['Amount Per Grid', 'number', 'The base token amount allocated to each grid level.'],
          [
            'Fee Tier',
            'integer',
            'The fee denominator (e.g. 1,000,000). Lower values mean higher fees.',
          ],
          [
            'Compound',
            'boolean',
            'When enabled, profits are automatically re-invested into new grid orders.',
          ],
          [
            'Oneshot',
            'boolean',
            'When enabled, each order executes only once and is not replaced after filling.',
          ],
        ]}
      />

      <DocH3 id="grid-strategies">Grid Strategies</DocH3>
      <DocP>
        GridEx supports two pricing models for each side of the grid. You can use{' '}
        <DocStrong>Linear</DocStrong> or <DocStrong>Geometry</DocStrong> independently for asks and bids.
      </DocP>

      <DocTable
        headers={['Strategy', 'Pricing Rule', 'Best For', 'Key Input']}
        rows={[
          ['Linear', 'Each level moves by a fixed absolute gap.', 'Markets where you want evenly-spaced price bands.', 'Gap'],
          ['Geometry', 'Each level moves by a fixed percentage ratio.', 'Markets where percentage moves matter more than absolute price moves.', 'Ratio'],
        ]}
      />

      <DocH3>Linear Grid</DocH3>
      <DocP>
        A linear grid places each next order at a constant price difference from the previous one.
        If <DocCode>Ask Price₀ = 305</DocCode> and <DocCode>Ask Gap = 5</DocCode>, your ask
        ladder becomes <DocCode>305, 310, 315, 320...</DocCode>
      </DocP>
      <DocP>
        Use a linear grid when the trading range is relatively tight and you want the same nominal
        spacing between orders across the whole ladder.
      </DocP>

      <DocH3>Geometry Grid</DocH3>
      <DocP>
        A geometry grid places each next order by multiplying the previous level by a ratio instead
        of adding a fixed gap. If <DocCode>Ask Price₀ = 100</DocCode> and <DocCode>Ask Ratio = 1.02</DocCode>,
        your ask ladder becomes approximately <DocCode>100, 102, 104.04, 106.12...</DocCode>
      </DocP>
      <DocP>
        On the bid side, a ratio below <DocCode>1</DocCode> creates progressively lower prices.
        For example, <DocCode>Bid Price₀ = 100</DocCode> and <DocCode>Bid Ratio = 0.98</DocCode>
        gives <DocCode>100, 98, 96.04, 94.12...</DocCode>
      </DocP>
      <DocP>
        Use a geometry grid when you want each level to represent roughly the same percentage move,
        which is often more natural for volatile assets that trade across wide price ranges.
      </DocP>

      <DocH3>How to Choose Between Linear and Geometry</DocH3>
      <DocUl>
        <DocLi><DocStrong>Choose Linear</DocStrong> when you think in fixed price increments such as “every 5 USDT” or “every 100 points”.</DocLi>
        <DocLi><DocStrong>Choose Geometry</DocStrong> when you think in percentage increments such as “every 1%” or “every 2%”.</DocLi>
        <DocLi><DocStrong>Use Linear</DocStrong> for stablecoin pairs or tightly ranged assets where absolute spacing is predictable.</DocLi>
        <DocLi><DocStrong>Use Geometry</DocStrong> for high-priced or trend-sensitive assets where a constant percentage step stays meaningful across the range.</DocLi>
        <DocLi>You can mix strategies, for example <DocStrong>Geometry asks</DocStrong> with <DocStrong>Linear bids</DocStrong>, if that better matches your market view.</DocLi>
      </DocUl>

      <DocH3>Geometry Example</DocH3>
      <DocCodeBlock language="text">{`Pair:              ETH / USDT
Ask Strategy:      Geometry
Bid Strategy:      Geometry
Ask Price₀:        3100 USDT
Bid Price₀:        2900 USDT
Ask Ratio:         1.02
Bid Ratio:         0.98
Ask Order Count:   4
Bid Order Count:   4
Amount Per Grid:   0.2 ETH

Ask levels:        3100, 3162, 3225.24, 3289.74
Bid levels:        2900, 2842, 2785.16, 2729.46`}</DocCodeBlock>

      <DocBlockquote>
        Ratios should usually be close to <DocCode>1</DocCode>. Very large ask ratios or very small
        bid ratios will spread your grid aggressively and can reduce fill frequency.
      </DocBlockquote>

      <DocH3>Example Configuration</DocH3>
      <DocCodeBlock language="text">{`Pair:             WBNB / USDT
Ask Price₀:       305 USDT   (lowest sell price)
Bid Price₀:       295 USDT   (highest buy price)
Ask Gap:          5           (sell orders at 305, 310, 315, 320)
Bid Gap:          5           (buy orders at 295, 290, 285, 280)
Ask Order Count:  4
Bid Order Count:  4
Amount Per Grid:  0.5 WBNB
Fee Tier:         10000
Compound:         Yes
Oneshot:          No`}</DocCodeBlock>

      <DocP>
        After filling in the form, click <DocStrong>Place Order</DocStrong>. Your wallet will prompt
        you to approve the token allowance (if needed) and then confirm the transaction.
      </DocP>

      <DocHr />

      {/* ── Managing Your Grids ── */}
      <DocH2 id="managing-your-grids">Managing Your Grids</DocH2>
      <DocP>
        The <DocStrong>My Grids</DocStrong> tab shows all grid orders you own. The{' '}
        <DocStrong>All Grids</DocStrong> tab displays protocol-wide grids from all users.
      </DocP>

      <DocH3>Grid Status Badges</DocH3>
      <DocTable
        headers={['Status', 'Description']}
        rows={[
          ['Active', 'The grid is running and orders are being filled.'],
          ['Completed', 'All orders in the grid have been fully executed.'],
          ['Cancelled', 'The grid was manually cancelled by the owner.'],
        ]}
      />

      <DocH3>Actions</DocH3>
      <DocUl>
        <DocLi>
          <DocStrong>Expand Row</DocStrong> — click any grid row to see individual order details, fill
          history, and accumulated profits.
        </DocLi>
        <DocLi>
          <DocStrong>Withdraw Profits</DocStrong> — claim accumulated trading profits back to your
          wallet.
        </DocLi>
        <DocLi>
          <DocStrong>Cancel Grid</DocStrong> — stop all active orders and withdraw remaining funds.
          This action is irreversible.
        </DocLi>
      </DocUl>

      <DocHr />

      {/* ── Limit Orders ── */}
      <DocH2 id="limit-orders">Limit Orders</DocH2>
      <DocP>
        The <DocStrong>Limit</DocStrong> page lets you place a single buy or sell order at a specific
        price — similar to a limit order on a traditional exchange. This is useful when you want to
        enter or exit a position at an exact price without setting up a full grid.
      </DocP>

      <DocH3>How to Place a Limit Order</DocH3>
      <DocOl>
        <DocLi>Navigate to the <DocCode>/limit</DocCode> page.</DocLi>
        <DocLi>Select the trading pair and choose <DocStrong>Buy</DocStrong> or <DocStrong>Sell</DocStrong>.</DocLi>
        <DocLi>Enter your desired price and amount.</DocLi>
        <DocLi>Confirm the transaction in your wallet.</DocLi>
      </DocOl>

      <DocP>
        Limit orders are implemented as a single-order grid with <DocCode>oneshot</DocCode> enabled,
        so they execute once and do not repeat. A one-level geometry grid behaves the same as a
        one-level linear grid because there is only one price level.
      </DocP>

      <DocHr />

      {/* ── Understanding Fees ── */}
      <DocH2 id="understanding-fees">Understanding Fees</DocH2>
      <DocP>
        GridEx uses different fee models for <DocStrong>grid orders</DocStrong> and{' '}
        <DocStrong>limit orders</DocStrong>. The key distinction is whether the fee is chosen by
        the grid creator or fixed by the protocol.
      </DocP>

      <DocH3>Grid Order Fees</DocH3>
      <DocP>
        For grid orders, the maker chooses the fee rate when creating the grid. Fees are expressed
        against <DocCode>1,000,000</DocCode>. For example, a fee value of <DocCode>10000</DocCode>
        means a 1% trading fee.
      </DocP>
      <DocP>
        When a grid order is filled, the total trading fee is split between the protocol and the
        grid owner:
      </DocP>
      <DocUl>
        <DocLi><DocStrong>25%</DocStrong> of the fee is retained by the platform.</DocLi>
        <DocLi><DocStrong>75%</DocStrong> of the fee is earned by the grid order owner.</DocLi>
      </DocUl>

      <DocP>
        This means grid creators can choose a fee level that matches the pair’s volatility and
        liquidity, while still keeping most of the fee revenue generated by their grid.
      </DocP>

      <DocH3>Example Grid Fee Tiers</DocH3>
      <DocTable
        headers={['Fee Value', 'Fee Rate', 'Best For']}
        rows={[
          ['10', '0.001%', 'Stablecoin pairs with tight spreads'],
          ['50', '0.005%', 'Stablecoin pairs with tight spreads'],
          ['100', '0.01%', 'Stablecoin pairs with tight spreads'],
          ['1000', '0.1%', 'Major token pairs (e.g. ETH/USDT)'],
          ['10000', '1.0%', 'Volatile or low-liquidity pairs'],
        ]}
      />

      <DocH3>Limit Order Fees</DocH3>
      <DocP>
        Limit orders use a fixed protocol fee model instead of a user-selected fee tier. The
        platform charges the taker a flat <DocStrong>0.1%</DocStrong> fee on limit-order execution.
      </DocP>
      <DocP>
        In other words:
      </DocP>
      <DocUl>
        <DocLi><DocStrong>Grid Order</DocStrong>: fee is chosen by the grid creator, then split 25% to the platform and 75% to the grid owner.</DocLi>
        <DocLi><DocStrong>Limit Order</DocStrong>: the protocol charges takers a fixed 0.1% fee.</DocLi>
      </DocUl>

      <DocH3>Other Costs</DocH3>
      <DocUl>
        <DocLi>
          <DocStrong>Gas Fees</DocStrong> — each on-chain transaction (place, cancel, withdraw)
          requires gas. Gas costs vary by chain and network congestion.
        </DocLi>
        <DocLi>
          <DocStrong>Protocol Fees</DocStrong> — a small portion of trading fees is retained by the
          protocol to fund development and audits.
        </DocLi>
      </DocUl>

      <DocHr />

      {/* ── FAQ ── */}
      <DocH2 id="faq">FAQ</DocH2>

      <DocH3>Is grid trading risk-free?</DocH3>
      <DocP>
        No. Grid trading carries risks including impermanent loss if the price moves outside your
        grid range, smart-contract risk, and general market risk. Only trade with funds you can
        afford to lose.
      </DocP>

      <DocH3>What happens if the price moves outside my grid?</DocH3>
      <DocP>
        If the price moves above your highest ask order (Ask Price₀ + Ask Gap × (Ask Order Count − 1)),
        all your base tokens will have been sold for quote tokens. If the price drops below your
        lowest bid order (Bid Price₀ − Bid Gap × (Bid Order Count − 1)), all your quote tokens will
        have been used to buy base tokens. In both cases, no new orders are filled until the price
        re-enters the range.
      </DocP>

      <DocH3>Are my funds held by GridEx?</DocH3>
      <DocP>
        GridEx is a non-custodial, on-chain protocol. Your funds are held in the smart contract —
        not by any centralized party. You can withdraw or cancel at any time.
      </DocP>

      <DocH3>Which tokens can I trade?</DocH3>
      <DocP>
        You can trade any ERC-20 token pair that has been registered on the GridEx contract for the
        selected chain. Popular pairs are listed on the trading page.
      </DocP>

      <DocH3>How do I maximize profits?</DocH3>
      <DocP>
        Choose a pair that oscillates frequently within a predictable range. Use tighter gaps for
        more frequent trades, or wider gaps for larger profit per cycle. Enable{' '}
        <DocStrong>Compound</DocStrong> to reinvest profits automatically.
      </DocP>

      <DocHr />

      {/* ── Glossary ── */}
      <DocH2 id="glossary">Glossary</DocH2>
      <DocTable
        headers={['Term', 'Definition']}
        rows={[
          ['Grid', 'A set of buy and sell orders distributed across a price range.'],
          ['Ask (Ask Price₀)', 'A sell order. Ask Price₀ is the lowest sell price from which ask orders are placed upward.'],
          ['Bid (Bid Price₀)', 'A buy order. Bid Price₀ is the highest buy price from which bid orders are placed downward.'],
          ['Ask Gap / Bid Gap', 'The price difference between consecutive orders. Ask gap and bid gap are configured independently.'],
          [
            'Compound',
            'A mode where profits are automatically reinvested into new grid orders.',
          ],
          [
            'Oneshot',
            'A mode where each order executes only once and is not replaced after filling.',
          ],
          [
            'TVL (Total Value Locked)',
            'The total value of assets currently deposited in GridEx smart contracts.',
          ],
          [
            'APR (Annual Percentage Rate)',
            'The estimated annualized return rate of a grid strategy.',
          ],
          [
            'Fee Tier',
            'A denominator value that determines the trading fee rate (out of 1,000,000).',
          ],
          [
            'Pair',
            'A base/quote token combination on which grid or limit orders can be placed.',
          ],
          [
            'Fill',
            'An event where a taker matches and executes an existing maker order.',
          ],
        ]}
      />

      <DocsPageNav />
    </div>
  );
}
