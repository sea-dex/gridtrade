export interface NavSection {
  id: string;
  title: string;
}

export interface NavPage {
  href: string;
  title: string;
  description: string;
  sections: NavSection[];
}

export const docsNavigation: NavPage[] = [
  {
    href: '/docs',
    title: 'Overview',
    description: 'Introduction to GridEx documentation',
    sections: [
      { id: 'getting-started', title: 'Getting Started' },
      { id: 'grid-trading', title: 'Grid Trading Guide' },
      { id: 'api-docs', title: 'API Documentation' },
      { id: 'faq', title: 'FAQ' },
      { id: 'resources', title: 'External Resources' },
    ],
  },
  {
    href: '/docs/user-guide',
    title: 'User Guide',
    description: 'Complete guide to using GridEx',
    sections: [
      { id: 'what-is-grid-trading', title: 'What is Grid Trading?' },
      { id: 'getting-started', title: 'Getting Started' },
      { id: 'connecting-your-wallet', title: 'Connecting Your Wallet' },
      { id: 'creating-a-grid-order', title: 'Creating a Grid Order' },
      { id: 'managing-your-grids', title: 'Managing Your Grids' },
      { id: 'limit-orders', title: 'Limit Orders' },
      { id: 'understanding-fees', title: 'Understanding Fees' },
      { id: 'faq', title: 'FAQ' },
      { id: 'glossary', title: 'Glossary' },
    ],
  },
  {
    href: '/docs/contracts',
    title: 'Contract Addresses',
    description: 'Deployed smart contract addresses',
    sections: [
      { id: 'addresses', title: 'Deployed Contracts' },
      { id: 'supported-chains', title: 'Supported Chains' },
      { id: 'explorer-links', title: 'Explorer Links' },
      { id: 'architecture', title: 'Architecture' },
    ],
  },
  {
    href: '/docs/api',
    title: 'API Reference',
    description: 'REST API documentation',
    sections: [
      { id: 'overview', title: 'Overview' },
      { id: 'authentication', title: 'Authentication' },
      { id: 'common-parameters', title: 'Common Parameters' },
      { id: 'grids', title: 'Grids' },
      { id: 'orders', title: 'Orders' },
      { id: 'statistics', title: 'Statistics' },
      { id: 'leaderboard', title: 'Leaderboard' },
      { id: 'error-responses', title: 'Error Responses' },
      { id: 'rate-limiting', title: 'Rate Limiting' },
    ],
  },
];
