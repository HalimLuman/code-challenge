export const metadata = { title: 'Terms of Service — Interest Matcher' }

const TERMS_VERSION = process.env.TERMS_VERSION ?? '2026-04'

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="text-sm text-gray-500">
        Effective date: April 2026 &mdash; Version {TERMS_VERSION}
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using Interest Matcher (&ldquo;the Service&rdquo;), you agree to be bound
        by these Terms of Service. If you do not agree, do not use the Service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        Interest Matcher is a platform that helps users discover other people who share their
        interests. Users can create accounts, add interests, and connect with like-minded people.
      </p>

      <h2>3. Eligibility</h2>
      <p>
        You must be at least 16 years old (or 18 in jurisdictions requiring higher minimum age for
        digital services) to use the Service. By registering, you represent that you meet this
        requirement.
      </p>

      <h2>4. User Accounts</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials. You
        must provide accurate and complete information when registering. Notify us immediately if
        you suspect unauthorised access to your account.
      </p>

      <h2>5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Post content that is harmful, abusive, harassing, or illegal.</li>
        <li>Spam other users or send unsolicited messages.</li>
        <li>Impersonate any person or entity.</li>
        <li>Attempt to reverse-engineer or compromise the Service.</li>
        <li>Use automated tools to scrape or abuse the Service.</li>
      </ul>

      <h2>6. Interest Data</h2>
      <p>
        Interest data you provide is stored and used solely to compute interest matches between
        users. We do not sell your interest data or use it for advertising. Anonymous interest
        submissions are retained for up to 90 days.
      </p>

      <h2>7. Public API</h2>
      <p>
        The public interest submission API is provided for legitimate integrations only. Automated
        abuse or spam submissions will result in IP-level rate limiting and potential banning.
      </p>

      <h2>8. Intellectual Property</h2>
      <p>
        All content and software comprising the Service is owned by Interest Matcher or its
        licensors. You retain ownership of content you post; by posting, you grant us a limited
        licence to store and display it within the Service.
      </p>

      <h2>9. Disclaimers and Limitation of Liability</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum
        extent permitted by law, Interest Matcher shall not be liable for indirect, incidental, or
        consequential damages arising from your use of the Service.
      </p>

      <h2>10. Termination</h2>
      <p>
        We may suspend or terminate accounts that violate these Terms. You may delete your account
        at any time from the Account settings page.
      </p>

      <h2>11. Changes to Terms</h2>
      <p>
        We may update these Terms from time to time. Significant changes will be communicated via
        email or an in-app notice. Continued use after notice constitutes acceptance.
      </p>

      <h2>12. Governing Law</h2>
      <p>
        These Terms are governed by the laws of England and Wales. Disputes shall be resolved
        through good-faith negotiation, then binding arbitration if necessary.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these Terms? Email us at{' '}
        <a href="mailto:legal@interestmatcher.app">legal@interestmatcher.app</a>.
      </p>
    </>
  )
}
