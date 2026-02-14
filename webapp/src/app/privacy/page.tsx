'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent } from '@/components/ui/Card';
import { Shield, Eye, Database, Lock, Globe, UserCheck, Clock, Mail } from 'lucide-react';

export default function PrivacyPage() {
  const { t } = useTranslation();

  const lastUpdated = 'February 14, 2026';

  return (
    <div className="p-5">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-(--accent)/10 rounded-xl">
              <Shield className="w-6 h-6 text-(--accent)" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-(--text-primary)">Privacy Policy</h1>
              <p className="text-(--text-tertiary) text-xs mt-0.5">Last updated: {lastUpdated}</p>
            </div>
          </div>
          <p className="text-(--text-secondary) text-sm leading-relaxed">
            This Privacy Policy describes how GridTrade collects, uses, and protects information when you use our decentralized trading protocol. We are committed to protecting your privacy and being transparent about our data practices.
          </p>
        </div>

        <div className="space-y-5">
          {/* Overview */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-(--accent)/10 rounded-lg mt-0.5 shrink-0">
                  <Eye className="w-4 h-4 text-(--accent)" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">1. Overview</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>
                      GridTrade is a decentralized protocol that prioritizes user privacy. As a decentralized application (dApp), we operate differently from traditional web services. We do not require user registration, and we do not store personal information on centralized servers.
                    </p>
                    <p>
                      Your interactions with the Protocol&apos;s smart contracts are recorded on the public BNB Chain blockchain. These transactions are publicly visible by nature of blockchain technology and are not controlled by us.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#a855f7]/10 rounded-lg mt-0.5 shrink-0">
                  <Database className="w-4 h-4 text-[#a855f7]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">2. Information We Collect</h2>
                  <div className="space-y-3 text-[13px] text-(--text-secondary) leading-relaxed">
                    <div>
                      <h3 className="text-sm font-medium text-(--text-primary) mb-1">2.1 Information You Provide</h3>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong className="text-(--text-primary)">Wallet Address:</strong> When you connect your wallet to interact with the Protocol, your public wallet address is accessible to the application.</li>
                        <li><strong className="text-(--text-primary)">Transaction Data:</strong> Any transactions you submit through the Protocol are recorded on the blockchain and are publicly available.</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-(--text-primary) mb-1">2.2 Information Collected Automatically</h3>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong className="text-(--text-primary)">Usage Data:</strong> We may collect anonymous usage analytics such as page views, feature usage, and general interaction patterns to improve the Service.</li>
                        <li><strong className="text-(--text-primary)">Device Information:</strong> Basic device and browser information may be collected for compatibility and debugging purposes.</li>
                        <li><strong className="text-(--text-primary)">IP Address:</strong> Your IP address may be temporarily processed by our servers but is not stored or linked to your wallet address.</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-(--text-primary) mb-1">2.3 Information We Do NOT Collect</h3>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Personal identification documents or KYC information</li>
                        <li>Email addresses (unless voluntarily provided for contact purposes)</li>
                        <li>Private keys or seed phrases</li>
                        <li>Off-chain financial information</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-(--accent)/10 rounded-lg mt-0.5 shrink-0">
                  <Globe className="w-4 h-4 text-(--accent)" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">3. How We Use Information</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>The limited information we collect is used for the following purposes:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong className="text-(--text-primary)">Protocol Operation:</strong> To facilitate your interactions with the smart contracts and display relevant data (e.g., your grid orders, balances).</li>
                      <li><strong className="text-(--text-primary)">Service Improvement:</strong> Anonymous analytics help us understand how users interact with the interface and identify areas for improvement.</li>
                      <li><strong className="text-(--text-primary)">Security:</strong> To detect and prevent potential security threats, fraud, or abuse of the Service.</li>
                      <li><strong className="text-(--text-primary)">Leaderboard & Analytics:</strong> Public blockchain data (wallet addresses and trading activity) may be aggregated and displayed on leaderboards and analytics dashboards.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Data */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#f59e0b]/10 rounded-lg mt-0.5 shrink-0">
                  <Lock className="w-4 h-4 text-[#f59e0b]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">4. Blockchain Data & Public Transactions</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>
                      Please be aware that blockchain transactions are inherently public and transparent. When you interact with the GridTrade smart contracts:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Your wallet address and transaction details are permanently recorded on the blockchain</li>
                      <li>This data is publicly accessible through blockchain explorers (e.g., BscScan)</li>
                      <li>We have no ability to modify, delete, or hide blockchain data</li>
                      <li>Your trading activity, including grid orders, profits, and losses, can be viewed by anyone</li>
                    </ul>
                    <p>
                      We recommend using wallet addresses that are not linked to your real-world identity if privacy is a concern.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-(--accent)/10 rounded-lg mt-0.5 shrink-0">
                  <Shield className="w-4 h-4 text-(--accent)" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">5. Data Security</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>
                      We implement appropriate technical and organizational measures to protect the limited data we process:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Encrypted communications (HTTPS) for all web traffic</li>
                      <li>No centralized storage of sensitive user data</li>
                      <li>Regular security audits of smart contracts and infrastructure</li>
                      <li>Minimal data collection principle — we only process what is necessary</li>
                    </ul>
                    <p>
                      However, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Services */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#a855f7]/10 rounded-lg mt-0.5 shrink-0">
                  <Globe className="w-4 h-4 text-[#a855f7]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">6. Third-Party Services</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>
                      The Service may interact with or link to third-party services, including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong className="text-(--text-primary)">Wallet Providers:</strong> (e.g., MetaMask, WalletConnect) — These services have their own privacy policies governing how they handle your data.</li>
                      <li><strong className="text-(--text-primary)">Blockchain Networks:</strong> (BNB Chain) — Transaction data is subject to the network&apos;s inherent transparency.</li>
                      <li><strong className="text-(--text-primary)">Analytics Services:</strong> We may use privacy-respecting analytics tools to understand usage patterns without tracking individual users.</li>
                      <li><strong className="text-(--text-primary)">RPC Providers:</strong> API calls to blockchain nodes may be routed through third-party RPC providers who may log request metadata.</li>
                    </ul>
                    <p>
                      We encourage you to review the privacy policies of any third-party services you interact with.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-(--accent)/10 rounded-lg mt-0.5 shrink-0">
                  <UserCheck className="w-4 h-4 text-(--accent)" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">7. Your Rights</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>
                      Since we collect minimal personal data, many traditional data rights (access, correction, deletion) have limited applicability. However:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>You can disconnect your wallet at any time to stop data association with your session</li>
                      <li>You can clear your browser&apos;s local storage to remove any cached preferences</li>
                      <li>You can use privacy tools (VPN, Tor) to minimize metadata exposure</li>
                      <li>You can contact us to request information about any data we may have associated with your wallet address</li>
                    </ul>
                    <p>
                      Note that blockchain data cannot be deleted or modified as it is immutably recorded on the network.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cookies & Local Storage */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#f59e0b]/10 rounded-lg mt-0.5 shrink-0">
                  <Database className="w-4 h-4 text-[#f59e0b]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">8. Cookies & Local Storage</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>
                      The GridTrade interface may use browser local storage to save your preferences, such as:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Language preferences</li>
                      <li>Theme settings</li>
                      <li>Last connected wallet information (public address only)</li>
                      <li>UI state preferences</li>
                    </ul>
                    <p>
                      We do not use third-party tracking cookies. You can clear local storage at any time through your browser settings.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#a855f7]/10 rounded-lg mt-0.5 shrink-0">
                  <Clock className="w-4 h-4 text-[#a855f7]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">9. Changes to This Policy</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>
                      We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. Any changes will be posted on this page with an updated &quot;Last updated&quot; date.
                    </p>
                    <p>
                      We encourage you to review this Privacy Policy periodically. Your continued use of the Service after any changes constitutes acceptance of the updated policy.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-(--accent)/10 rounded-lg mt-0.5 shrink-0">
                  <Mail className="w-4 h-4 text-(--accent)" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">10. Contact Us</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>
                      If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at{' '}
                      <a
                        href="mailto:contact@gridtrade.io"
                        className="text-(--accent) hover:underline"
                      >
                        contact@gridtrade.io
                      </a>.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
