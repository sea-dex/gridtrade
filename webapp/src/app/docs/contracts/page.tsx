'use client';

import {
  DocH1,
  DocH2,
  DocH3,
  DocP,
  DocStrong,
  DocTable,
  DocCode,
  DocBlockquote,
  DocHr,
} from '../_components/DocsProse';
import { DocsPageNav } from '../_components/DocsPageNav';

const CONTRACT_ADDRESSES = [
  {
    name: 'Vault',
    address: '0x5a93dbc8BfB3cA53cD1A3aAfdcc84aFBF5276CC8',
    description: 'Holds user funds and manages token deposits / withdrawals.',
  },
  {
    name: 'Timelock',
    address: '0x0AFF660E90C8b884515a55A776b94D3464430Fe6',
    description: 'Timelock controller for governance actions and delayed execution.',
  },
  {
    name: 'AdminFacet',
    address: '0xEC5b5122C717191a3785508cDD8E3D23c217AE2A',
    description: 'Administrative functions for protocol governance and configuration.',
  },
  {
    name: 'TradeFacet',
    address: '0x9D605177908D9ba6CAC6F817E7AB007C1A3Ced48',
    description: 'Core trading logic for creating and executing grid orders.',
  },
  {
    name: 'CancelFacet',
    address: '0x00065F12989ae6F0A8B402B5060A98f0C2ED6157',
    description: 'Handles grid order cancellation and fund withdrawal.',
  },
  {
    name: 'ViewFacet',
    address: '0x30C141dD5C64d7F21b7aE22f9803e209368E4899',
    description: 'Read-only functions for querying grid and order state.',
  },
  {
    name: 'Router',
    address: '0xa0F2a4b56fbA7F98332D39fB18f4073bB2b78dd9',
    description: 'Main entry point (Diamond proxy) that routes calls to the appropriate facet.',
  },
  {
    name: 'Linear',
    address: '0xFce4A9fE4764101259E154C7E4Ebce90763A9085',
    description: 'Linear grid strategy contract for evenly-spaced price levels.',
  },
  {
    name: 'Geometry',
    address: '0x75320716bF2Bbfb27F2e0F1cC3b2dDc7a9Da626f',
    description: 'Geometry grid strategy contract for ratio-based price progression.',
  },
];

const SUPPORTED_CHAINS = [
  { name: 'Ethereum', chainId: 1, explorer: 'https://etherscan.io/address/' },
  { name: 'BNB Chain', chainId: 56, explorer: 'https://bscscan.com/address/' },
  { name: 'Base', chainId: 8453, explorer: 'https://basescan.org/address/' },
  { name: 'BSC Testnet', chainId: 97, explorer: 'https://testnet.bscscan.com/address/' },
];

export default function ContractsPage() {
  return (
    <div>
      <DocH1>Contract Addresses</DocH1>
      <DocP>
        GridEx is deployed using the{' '}
        <DocStrong>Diamond pattern (EIP-2535)</DocStrong>, where a single proxy
        contract (<DocCode>GridExRouter</DocCode>) delegates calls to multiple
        facet contracts. All contracts share the <DocStrong>same addresses</DocStrong>{' '}
        across every supported chain.
      </DocP>

      <DocBlockquote>
        All contract addresses are identical on Ethereum, BNB Chain, Base, and BSC Testnet.
      </DocBlockquote>

      <DocHr />

      {/* ── Contract Table ── */}
      <DocH2 id="addresses">Deployed Contracts</DocH2>
      <DocTable
        headers={['Contract', 'Address', 'Description']}
        rows={CONTRACT_ADDRESSES.map((c) => [
          c.name,
          c.address,
          c.description,
        ])}
      />

      <DocHr />

      {/* ── Supported Chains ── */}
      <DocH2 id="supported-chains">Supported Chains</DocH2>
      <DocP>
        The contracts are deployed at the same addresses on all supported chains:
      </DocP>
      <DocTable
        headers={['Chain', 'Chain ID', 'Block Explorer']}
        rows={SUPPORTED_CHAINS.map((chain) => [
          chain.name,
          String(chain.chainId),
          chain.explorer.replace(/\/address\/$/, ''),
        ])}
      />

      <DocHr />

      {/* ── Explorer Links ── */}
      <DocH2 id="explorer-links">Explorer Links</DocH2>
      <DocP>
        Use the links below to verify each contract on the block explorer of your preferred chain.
      </DocP>

      {SUPPORTED_CHAINS.map((chain) => (
        <div key={chain.chainId} className="mb-6">
          <DocH3>{chain.name} (Chain ID: {chain.chainId})</DocH3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse mb-4">
              <thead>
                <tr className="border-b border-(--border-subtle)">
                  <th className="text-left py-2 pr-4 text-(--text-tertiary) font-medium">Contract</th>
                  <th className="text-left py-2 text-(--text-tertiary) font-medium">Explorer Link</th>
                </tr>
              </thead>
              <tbody>
                {CONTRACT_ADDRESSES.map((contract) => (
                  <tr key={contract.name} className="border-b border-(--border-subtle)">
                    <td className="py-2 pr-4 text-(--text-primary) font-medium">{contract.name}</td>
                    <td className="py-2">
                      <a
                        href={`${chain.explorer}${contract.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-(--accent) hover:text-(--accent-muted) underline underline-offset-2 transition-colors font-mono text-xs break-all"
                      >
                        {contract.address}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <DocHr />

      {/* ── Architecture ── */}
      <DocH2 id="architecture">Architecture</DocH2>
      <DocP>
        GridEx uses the <DocStrong>Diamond Standard (EIP-2535)</DocStrong> to organise its
        smart contracts. The <DocCode>GridExRouter</DocCode> acts as the single entry point
        and delegates calls to the appropriate facet based on the function selector:
      </DocP>
      <DocTable
        headers={['Facet', 'Responsibility']}
        rows={[
          ['AdminFacet', 'Protocol configuration, pair management, fee settings'],
          ['TradeFacet', 'Grid creation, order placement, trade execution'],
          ['CancelFacet', 'Grid cancellation, profit withdrawal, fund recovery'],
          ['ViewFacet', 'Read-only queries for grids, orders, pairs, and balances'],
        ]}
      />
      <DocP>
        The <DocCode>Vault</DocCode> contract holds all deposited tokens and is accessed
        internally by the facets. The <DocCode>Linear</DocCode> contract implements the
        linear grid strategy, computing evenly-spaced price levels for grid orders.
      </DocP>

      {/* Previous / Next */}
      <DocsPageNav />
    </div>
  );
}
