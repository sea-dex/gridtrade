'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent } from '@/components/ui/Card';
import { FileText, AlertTriangle, Shield, Scale, Ban, RefreshCw, Globe, Mail } from 'lucide-react';

export default function TermsPage() {
  const { t } = useTranslation();

  const lastUpdated = 'February 14, 2026';

  return (
    <div className="p-5">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-(--accent)/10 rounded-xl">
              <FileText className="w-6 h-6 text-(--accent)" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-(--text-primary)">Terms of Service</h1>
              <p className="text-(--text-tertiary) text-xs mt-0.5">Last updated: {lastUpdated}</p>
            </div>
          </div>
          <p className="text-(--text-secondary) text-sm leading-relaxed">
            Please read these Terms of Service carefully before using the GridTrade protocol. By accessing or using the platform, you agree to be bound by these terms.
          </p>
        </div>

        <div className="space-y-5">
          {/* Agreement to Terms */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-(--accent)/10 rounded-lg mt-0.5 shrink-0">
                  <Scale className="w-4 h-4 text-(--accent)" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">1. Agreement to Terms</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>
                      By accessing or using the GridTrade protocol (&quot;Protocol&quot;), including the website, smart contracts, and related services (collectively, the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you must not use the Service.
                    </p>
                    <p>
                      The Service is provided by the GridTrade decentralized protocol. These Terms govern your use of the Protocol and its interfaces. The Protocol operates on the BNB Chain blockchain network and interacts with decentralized smart contracts.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eligibility */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#f59e0b]/10 rounded-lg mt-0.5 shrink-0">
                  <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">2. Eligibility</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>
                      You must be at least 18 years old or the age of majority in your jurisdiction to use the Service. By using the Service, you represent and warrant that you meet this eligibility requirement.
                    </p>
                    <p>
                      You are solely responsible for ensuring that your use of the Service complies with all laws, rules, and regulations applicable to you. Your access to the Service may be restricted in certain jurisdictions, and it is your responsibility to verify the legality of your participation.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description of Service */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-(--accent)/10 rounded-lg mt-0.5 shrink-0">
                  <Globe className="w-4 h-4 text-(--accent)" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">3. Description of Service</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>
                      GridTrade is a decentralized grid trading protocol that enables users to create and manage automated grid trading strategies on-chain. The Protocol allows users to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Create grid trading orders with customizable price ranges and grid counts</li>
                      <li>Place limit orders for token swaps</li>
                      <li>Monitor and manage active trading strategies</li>
                      <li>View performance analytics and leaderboards</li>
                    </ul>
                    <p>
                      The Protocol interfaces with smart contracts deployed on the BNB Chain. All trades are settled on-chain, and the Protocol does not custody user funds at any time.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risks */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#ef4444]/10 rounded-lg mt-0.5 shrink-0">
                  <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">4. Risks</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>
                      You acknowledge and accept the following risks associated with using the Service:
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 ml-2">
                      <li><strong className="text-(--text-primary)">Market Risk:</strong> Cryptocurrency markets are highly volatile. Grid trading strategies may result in losses, especially during strong directional price movements.</li>
                      <li><strong className="text-(--text-primary)">Smart Contract Risk:</strong> Despite security audits, smart contracts may contain vulnerabilities that could lead to loss of funds.</li>
                      <li><strong className="text-(--text-primary)">Blockchain Risk:</strong> Transactions on the blockchain are irreversible. Network congestion, forks, or technical failures may affect your ability to use the Service.</li>
                      <li><strong className="text-(--text-primary)">Impermanent Loss:</strong> Grid trading may expose you to impermanent loss similar to liquidity provision in automated market makers.</li>
                      <li><strong className="text-(--text-primary)">Regulatory Risk:</strong> Changes in laws and regulations may adversely affect the Service or your ability to use it.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prohibited Activities */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#ef4444]/10 rounded-lg mt-0.5 shrink-0">
                  <Ban className="w-4 h-4 text-[#ef4444]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">5. Prohibited Activities</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>You agree not to engage in any of the following activities:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Using the Service for money laundering, terrorist financing, or other illegal activities</li>
                      <li>Attempting to exploit, hack, or disrupt the smart contracts or infrastructure</li>
                      <li>Market manipulation, wash trading, or any form of deceptive trading practices</li>
                      <li>Using automated bots or scripts to interact with the Service in a manner that degrades performance for other users</li>
                      <li>Circumventing any access restrictions or security measures</li>
                      <li>Using the Service from jurisdictions where cryptocurrency trading is prohibited</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fees */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#a855f7]/10 rounded-lg mt-0.5 shrink-0">
                  <RefreshCw className="w-4 h-4 text-[#a855f7]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">6. Fees</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>
                      The Protocol charges fees for certain services, including but not limited to trading fees and grid creation fees. Fees are transparently defined in the smart contracts and may be updated through governance processes.
                    </p>
                    <p>
                      In addition to Protocol fees, you are responsible for paying all blockchain network (gas) fees associated with your transactions. These fees are paid directly to network validators and are outside the control of the Protocol.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-(--accent)/10 rounded-lg mt-0.5 shrink-0">
                  <Shield className="w-4 h-4 text-(--accent)" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">7. Intellectual Property</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>
                      The GridTrade name, logo, and branding are proprietary. The Protocol&apos;s smart contract source code is open-source and available under the applicable open-source license on GitHub.
                    </p>
                    <p>
                      You may not use the GridTrade brand or trademarks without prior written consent, except as necessary for referencing the Protocol in a factual, non-misleading manner.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer of Warranties */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#f59e0b]/10 rounded-lg mt-0.5 shrink-0">
                  <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">8. Disclaimer of Warranties</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>
                      THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                    </p>
                    <p>
                      We do not guarantee that the Service will be uninterrupted, error-free, or free of harmful components. You use the Service at your own risk.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-(--accent)/10 rounded-lg mt-0.5 shrink-0">
                  <Scale className="w-4 h-4 text-(--accent)" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">9. Limitation of Liability</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>
                      TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL GRIDTRADE, ITS CONTRIBUTORS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.
                    </p>
                    <p>
                      This limitation applies regardless of whether damages are based on warranty, contract, tort, statute, or any other legal theory, and whether or not we have been advised of the possibility of such damages.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#a855f7]/10 rounded-lg mt-0.5 shrink-0">
                  <RefreshCw className="w-4 h-4 text-[#a855f7]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">10. Changes to Terms</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>
                      We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting the revised Terms on the website. Your continued use of the Service after any changes constitutes acceptance of the new Terms.
                    </p>
                    <p>
                      We encourage you to review these Terms periodically for any updates.
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
                  <h2 className="text-base font-semibold text-(--text-primary) mb-2">11. Contact</h2>
                  <div className="space-y-2 text-[13px] text-(--text-secondary) leading-relaxed">
                    <p>
                      If you have any questions about these Terms, please contact us at{' '}
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
