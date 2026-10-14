import { Link } from 'react-router-dom';
import { LegalPage, Ext } from '@/components/layout/LegalPage';

export default function Terms() {
  return (
    <LegalPage title="Terms of Service">
      <p>By accessing or using Profit Pathfinder (the "Site"), you agree to these Terms. If you do not agree, do not use the Site.</p>

      <h2>Use of the site</h2>
      <p>You may use the Site for lawful, personal, non-commercial purposes. You agree not to misuse the Site, interfere with its operation, scrape it at scale, or attempt to access it in unauthorized ways.</p>

      <h2>Accounts</h2>
      <p>You are responsible for keeping your login credentials secure and for activity under your account. Provide accurate information and notify us of any unauthorized use. We may suspend accounts that violate these Terms.</p>

      <h2>Subscriptions and payments</h2>
      <p>Paid plans are billed through Stripe on a recurring basis until cancelled. Prices are shown on the <Link to="/pricing">pricing page</Link>. You can cancel at any time; access continues until the end of the current billing period. Payments are subject to the <Ext href="https://stripe.com/legal/ssa">Stripe terms</Ext>. Except where required by law, fees are non-refundable.</p>

      <h2>Not financial advice</h2>
      <p>All content and tools are for educational purposes only. See our <Link to="/disclaimer">Disclaimer</Link>.</p>

      <h2>No warranties</h2>
      <p>The Site is provided "as is" and "as available" without warranties of any kind, express or implied, including accuracy, fitness for a particular purpose, and non-infringement. Market data and calculations may be delayed, incomplete, or wrong.</p>

      <h2>Limitation of liability</h2>
      <p>To the fullest extent permitted by law, Profit Pathfinder is not liable for any indirect, incidental, special, consequential, or punitive damages, or for any losses (including investment losses) arising from your use of the Site. Our total liability is limited to the amount you paid us in the 12 months before the claim.</p>

      <h2>Changes</h2>
      <p>We may update these Terms. Continued use after changes means you accept the updated Terms.</p>

      <h2>Governing law</h2>
      <p>These Terms are governed by the laws of [Governing jurisdiction — to be specified], without regard to conflict-of-law rules.</p>

      <h2>Contact</h2>
      <p>Questions about these Terms? Use our <Link to="/contact">contact page</Link>.</p>
    </LegalPage>
  );
}
