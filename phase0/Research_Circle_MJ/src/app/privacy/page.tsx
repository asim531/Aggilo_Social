import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-husl-surface dark:bg-[#0b0d0f] text-husl-ink dark:text-stone-200">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-husl-muted dark:text-stone-400 mb-10">
          Effective Date: June 4, 2026
        </p>

        <section className="space-y-8 text-sm leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold mb-2">1. Introduction</h2>
            <p>
              Aggilo (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting
              your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
              your personal data when you use the Aggilo platform (&ldquo;the Platform&rdquo;). This policy
              is drafted in compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act),
              the Information Technology Act, 2000, and the Information Technology (Reasonable Security
              Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 of India.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">2. Data We Collect</h2>
            <p className="mb-2">We collect the following categories of personal data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Data:</strong> Email address, nickname, gender, birth year, country, and city (optional) provided during registration.</li>
              <li><strong>Institutional Data:</strong> Your declared institutional affiliation within a cluster.</li>
              <li><strong>Content Data:</strong> Posts, comments, topic tags, uploaded documents, and any other content you voluntarily share on the Platform.</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent, and interaction patterns. This is collected through analytics tools (Google Analytics, Microsoft Clarity) to improve the Platform.</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, and operating system, collected automatically when you access the Platform.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">3. How We Use Your Data</h2>
            <p className="mb-2">We use your personal data for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>To create and maintain your account and profile.</li>
              <li>To display your posts and profile information to other members of your cluster.</li>
              <li>To enable AI-powered features (topic suggestions, content summaries, agent interactions) that enhance collaboration.</li>
              <li>To send you magic link sign-in emails and essential service communications.</li>
              <li>To analyze usage patterns and improve the Platform&apos;s functionality and user experience.</li>
              <li>To comply with legal obligations and enforce our Terms of Service.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">4. Legal Basis for Processing</h2>
            <p>
              We process your personal data based on your consent (provided at registration and
              configurable in your settings), our legitimate interest in operating and improving
              the Platform, and compliance with legal obligations under Indian law. You may withdraw
              consent at any time, though this may limit your ability to use certain features.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">5. Data Sharing and Disclosure</h2>
            <p className="mb-2">We do not sell your personal data. We may share data in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Within Your Cluster:</strong> Your nickname, profile information, and posts are visible to other members of clusters you join.</li>
              <li><strong>Service Providers:</strong> We use Supabase (database and authentication hosting), Vercel (application hosting), Google Analytics, and Microsoft Clarity. These providers process data on our behalf under contractual safeguards.</li>
              <li><strong>Legal Compliance:</strong> We may disclose data if required by law, court order, or governmental authority in India.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger or acquisition, your data may be transferred as a business asset with appropriate notice.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">6. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. Posts and contributions
              to cluster discussions may remain visible after account deletion to preserve the integrity
              of collaborative conversations, but will be disassociated from your personal identity.
              Usage analytics data is retained for a maximum of 26 months. We periodically review and
              delete data that is no longer needed.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">7. Data Security</h2>
            <p>
              We implement reasonable security practices and procedures as required under Section 43A
              of the Information Technology Act, 2000 and the SPDI Rules, 2011. This includes encryption
              in transit (TLS), encrypted storage, access controls, and regular security assessments.
              Our infrastructure is hosted on Supabase and Vercel, which maintain industry-standard
              security certifications. However, no method of electronic storage or transmission is
              100% secure, and we cannot guarantee absolute security.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">8. Your Rights</h2>
            <p className="mb-2">Under the DPDP Act, 2023 and applicable Indian data protection laws, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Access and Confirmation:</strong> Request a summary of personal data we hold about you.</li>
              <li><strong>Correction and Erasure:</strong> Request correction of inaccurate data or deletion of your data.</li>
              <li><strong>Grievance Redressal:</strong> File a complaint regarding our data processing practices.</li>
              <li><strong>Nominate:</strong> Designate an individual to exercise your rights in the event of your death or incapacity.</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact our Grievance Officer at the address below.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">9. Cookies and Tracking</h2>
            <p>
              The Platform uses essential cookies for authentication and session management.
              Analytics cookies (Google Analytics, Microsoft Clarity) help us understand how
              the Platform is used. Microsoft Clarity may record session interactions including
              mouse movements, clicks, and scroll behavior for UX improvement. Content within
              private AI chat panels is masked from Clarity recordings. You can manage cookie
              preferences through your browser settings.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">10. Children&apos;s Privacy</h2>
            <p>
              The Platform is not intended for individuals under the age of 18. We do not knowingly
              collect personal data from children. If we become aware that a child has provided us
              with personal data, we will take steps to delete it promptly.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">11. Cross-Border Data Transfers</h2>
            <p>
              Your data may be stored and processed on servers located outside India, including
              through our service providers Supabase (AWS, United States) and Vercel (global edge
              network). We ensure that such transfers are subject to appropriate safeguards and
              comply with applicable Indian data protection requirements.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. Material changes will be communicated
              via email or a notice on the Platform. The &ldquo;Effective Date&rdquo; at the top
              indicates when the latest revisions took effect.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">13. Grievance Officer</h2>
            <p>
              In accordance with the Information Technology Act, 2000 and the DPDP Act, 2023, you
              may contact our Grievance Officer for any privacy-related concerns:
            </p>
            <div className="mt-2 p-4 rounded-lg bg-stone-50 dark:bg-[#14161a] border border-stone-200 dark:border-stone-700">
              <p><strong>Name:</strong> Grievance Officer, Aggilo</p>
              <p><strong>Email:</strong>{" "}
                <a href="mailto:privacy@aggilo.in" className="text-husl-clio underline">
                  privacy@aggilo.in
                </a>
              </p>
              <p><strong>Response Time:</strong> We will acknowledge your complaint within 24 hours
              and resolve it within 15 days as required under Indian law.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
