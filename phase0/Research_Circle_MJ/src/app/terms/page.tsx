import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-husl-surface dark:bg-[#0b0d0f] text-husl-ink dark:text-stone-200">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-husl-muted dark:text-stone-400 mb-10">
          Effective Date: June 4, 2026
        </p>

        <section className="space-y-8 text-sm leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Aggilo (&ldquo;the Platform&rdquo;), including any cluster, research circle,
              or community space hosted on the Platform, you agree to be bound by these Terms of Service.
              If you do not agree, do not use the Platform.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">2. Eligibility</h2>
            <p>
              You must be at least 18 years of age to create an account. By registering, you represent
              that you meet this requirement. Certain clusters may require institutional affiliation;
              you agree to provide truthful information about your affiliation when prompted.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">3. Account Registration</h2>
            <p>
              You may register using a magic link sent to your email address. You are responsible for
              maintaining the security of your email account. You agree to provide accurate and complete
              profile information and to update it as necessary. Each account is for a single individual;
              shared accounts are not permitted.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">4. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Post content that is unlawful, defamatory, harassing, threatening, or invasive of another&apos;s privacy.</li>
              <li>Impersonate any person or entity, or falsely state your affiliation.</li>
              <li>Upload viruses, malware, or any malicious code.</li>
              <li>Use the Platform for spam, unsolicited advertising, or commercial solicitation outside designated spaces.</li>
              <li>Violate any applicable laws, including the Information Technology Act, 2000 of India.</li>
              <li>Scrape, data-mine, or systematically extract content from the Platform without written permission.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">5. Content and Intellectual Property</h2>
            <p>
              You retain ownership of the content you post. By posting, you grant Aggilo a worldwide,
              non-exclusive, royalty-free license to display, distribute, and reproduce your content
              solely within the Platform for the purpose of operating and improving the service.
              You represent that you have the right to share any content you post and that it does
              not infringe third-party intellectual property rights.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">6. AI Agents and Automated Features</h2>
            <p>
              The Platform includes AI-powered agents (such as Clio and Sage) that may interact with
              your content to provide summaries, topic suggestions, and other assistive features.
              These agents operate on content you have posted publicly within your cluster. By using
              the Platform, you consent to your public posts being processed by these agents for the
              purpose of enhancing the collaborative experience. Private messages and direct
              communications are not processed by AI agents unless explicitly invoked by you.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">7. Privacy</h2>
            <p>
              Your use of the Platform is also governed by our Privacy Policy, which explains how
              we collect, use, and protect your personal data in compliance with the Digital Personal
              Data Protection Act, 2023 of India and the Information Technology (Reasonable Security
              Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">8. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at our discretion if you
              violate these Terms. You may delete your account at any time by contacting us.
              Upon termination, your public posts may remain visible if they form part of ongoing
              discussions; personal profile data will be removed in accordance with our Privacy Policy.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">9. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided &ldquo;as is&rdquo; without warranties of any kind, express or
              implied. We do not guarantee uninterrupted access or error-free operation. Research
              content shared on the Platform represents the views of individual users and not of Aggilo.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">10. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Aggilo shall not be liable for any indirect,
              incidental, special, or consequential damages arising from your use of the Platform.
              Our total liability for any claim shall not exceed the amount you have paid us, if any,
              in the twelve months preceding the claim.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">11. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms are governed by the laws of India. Any dispute arising out of or relating
              to these Terms shall be subject to the exclusive jurisdiction of the courts in
              New Delhi, India. Parties shall first attempt to resolve disputes through good-faith
              negotiation before resorting to litigation.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">12. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Material changes will be communicated
              via email or through a notice on the Platform. Continued use after changes take effect
              constitutes acceptance of the revised Terms.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">13. Contact</h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <a href="mailto:legal@aggilo.in" className="text-husl-clio underline">
                legal@aggilo.in
              </a>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
