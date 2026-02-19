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
  DocLink,
} from '../_components/DocsProse';
import { DocsPageNav } from '../_components/DocsPageNav';

const CONTRACT_ADDRESSES = [
  {
    name: 'AdminFacet',
    address: '0xe65587895ad87dd67a36ffd80551fecd088e4b41',
    description: 'Administrative functions for protocol governance and configuration.',
  },
  {
    name: 'TradeFacet',
    address: '0xdf56923d7fe9fc431d2182d2a53f9fca6d3bcadc',
    description: 'Core trading logic for creating and executing grid orders.',
  },
  {
    name: 'CancelFacet',
    address: '0x3533135ab7a9ae91a626e1aff8a8ae5205ab6664',
    description: 'Handles grid order cancellation and fund withdrawal.',
  },
  {
    name: 'ViewFacet',
    address: '0xcc4d49cd07437f1c812a0d701f5069ea569b9b60',
    description: 'Read-only functions for querying grid and order state.',
  },
  {
    name: 'GridExRouter',
    address: '0xb2efe2c5291c5fc8189eced4d1aee6069c7fbc5e',
    description: 'Main entry point (Diamond proxy) that routes calls to the appropriate facet.',
  },
  {
    name: 'Vault',
    address: '0x346482688ecce24433e3af57cb7e63d3ab617284',
    description: 'Holds user funds and manages token deposits / withdrawals.',
  },
  {
    name: 'Linear',
    address: '0xa7a92fdbfeac632c45f4aad466e0ae0a430a8ddd',
    description: 'Linear grid strategy contract for evenly-spaced price levels.',
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
