export const metadata = { title: 'Privacy Policy — Interest Matcher' }

const PRIVACY_VERSION = process.env.PRIVACY_VERSION ?? '2026-04'

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-sm text-gray-500">
        Effective date: April 2026 &mdash; Version {PRIVACY_VERSION}
      </p>

      <h2>1. Data Controller</h2>
      <p>
        Interest Matcher operates as the data controller for personal data collected through this
        Service. Contact: <a href="mailto:privacy@interestmatcher.app">privacy@interestmatcher.app</a>.
      </p>

      <h2>2. What Personal Data We Collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> email address, username, and password hash (managed
          securely by Supabase Auth).
        </li>
        <li>
          <strong>Profile data:</strong> bio, location, website URL, and avatar image (optional).
        </li>
        <li>
          <strong>Interest data:</strong> interest names you add, linked to your account.
        </li>
        <li>
          <strong>Anonymous submissions:</strong> interest name, optional metadata, and IP address.
        </li>
        <li>
          <strong>Usage data:</strong> session tokens and timestamps for security purposes.
        </li>
      </ul>

      <h2>3. How We Use Your Data</h2>
      <ul>
        <li>To authenticate you and manage your account.</li>
        <li>
          To compute interest matches using set intersection — no ML model, no third-party
          profiling.
        </li>
        <li>To send transactional emails (connection requests, password resets).</li>
        <li>To improve the Service through aggregated, anonymised analytics.</li>
      </ul>

      <h2>4. Legal Basis for Processing (GDPR Article 6)</h2>
      <ul>
        <li>
          <strong>Contract performance:</strong> authentication, account management, and core
          features.
        </li>
        <li>
          <strong>Legitimate interest:</strong> security, fraud prevention, and abuse detection.
        </li>
        <li>
          <strong>Consent:</strong> marketing emails (not currently sent; placeholder for future
          use).
        </li>
      </ul>

      <h2>5. Data Retention</h2>
      <ul>
        <li>Active accounts: retained while your account exists.</li>
        <li>
          Deleted accounts: hard-deleted within 30 days; backups purged within 90 days.
        </li>
        <li>Anonymous interest submissions: retained for 90 days, then deleted.</li>
      </ul>

      <h2>6. Data Sharing and Third Parties</h2>
      <ul>
        <li>
          <strong>Supabase:</strong> data processor for database and authentication (EU-hosted
          option available).
        </li>
        <li>
          <strong>Vercel:</strong> hosting provider; data is in transit only, not stored.
        </li>
        <li>
          <strong>Resend:</strong> transactional email; only your email address is shared.
        </li>
      </ul>
      <p>We do not sell your personal data.</p>

      <h2>7. International Transfers</h2>
      <p>
        Data may be processed outside the EEA by Supabase and Vercel. Both provide appropriate
        safeguards under the EU Standard Contractual Clauses.
      </p>

      <h2>8. Your Rights (GDPR Articles 15–22)</h2>
      <ul>
        <li>
          <strong>Access:</strong> request a copy of your data at{' '}
          <code>GET /api/data-export</code>.
        </li>
        <li>
          <strong>Rectification:</strong> update your profile in Settings.
        </li>
        <li>
          <strong>Erasure:</strong> delete your account in Settings &rarr; Account.
        </li>
        <li>
          <strong>Portability:</strong> download your data as JSON via the export endpoint.
        </li>
        <li>
          <strong>Object / Restrict:</strong> contact us at{' '}
          <a href="mailto:privacy@interestmatcher.app">privacy@interestmatcher.app</a>.
        </li>
      </ul>

      <h2>9. Cookie Policy</h2>
      <p>
        We use session cookies strictly necessary for authentication. We do not use advertising or
        analytics cookies. You will be notified of cookie usage on your first visit.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We will notify you of material changes by email or in-app notice at least 30 days before
        they take effect.
      </p>

      <h2>11. Contact &amp; Complaints</h2>
      <p>
        To exercise your rights or lodge a complaint, email{' '}
        <a href="mailto:privacy@interestmatcher.app">privacy@interestmatcher.app</a>. You also
        have the right to lodge a complaint with your national data protection authority.
      </p>
    </>
  )
}
