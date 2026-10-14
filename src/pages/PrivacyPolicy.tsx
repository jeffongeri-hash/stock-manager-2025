import { Link } from 'react-router-dom';
import { LegalPage, Ext } from '@/components/layout/LegalPage';

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>This Privacy Policy explains how Profit Pathfinder ("we", "us") collects, uses, and shares information when you use profitpathfinder.online (the "Site").</p>

      <h2>Information we collect</h2>
      <ul>
        <li><strong>Account data:</strong> email address and authentication details when you create an account.</li>
        <li><strong>Data you enter:</strong> calculator inputs, saved scenarios, watchlists, and other data you choose to save.</li>
        <li><strong>Contact submissions:</strong> name, email, and message when you use our contact form.</li>
        <li><strong>Usage and device data:</strong> IP address, browser type, pages visited, and similar technical information collected automatically.</li>
        <li><strong>Payment data:</strong> handled by Stripe (see below). We never see or store full card numbers.</li>
      </ul>

      <h2>Cookies and similar technologies</h2>
      <p>We and our partners use cookies, local storage, and similar technologies to keep you signed in, remember preferences, measure usage, and serve and measure advertising. You can control cookies through your browser settings; disabling them may affect some features.</p>

      <h2>Advertising and Google AdSense</h2>
      <p>We use Google AdSense to show ads. Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website and other websites.</p>
      <p>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the Internet.</p>
      <p>You may opt out of personalized advertising by visiting <Ext href="https://www.google.com/settings/ads">Google Ads Settings</Ext>. You can also opt out of some third-party vendors' use of cookies for personalized advertising at <Ext href="https://www.aboutads.info/choices">www.aboutads.info/choices</Ext> or, in Europe, <Ext href="https://youronlinechoices.eu">youronlinechoices.eu</Ext>.</p>
      <p>Learn more about how Google uses data in <Ext href="https://policies.google.com/technologies/ads">How Google uses cookies in advertising</Ext>.</p>

      <h2>Google Analytics 4</h2>
      <p>We may use Google Analytics 4 to understand how visitors use the Site. Google Analytics collects information such as pages visited and device data using cookies. You can opt out with the <Ext href="https://tools.google.com/dlpage/gaoptout">Google Analytics Opt-out Browser Add-on</Ext>.</p>

      <h2>Payments (Stripe)</h2>
      <p>Subscriptions are processed by Stripe. Card details are sent directly to Stripe; we do not store card numbers. See the <Ext href="https://stripe.com/privacy">Stripe Privacy Policy</Ext>.</p>

      <h2>Authentication and data storage (Supabase)</h2>
      <p>We use Supabase to provide sign-in and to store account and saved data on secure servers. See the <Ext href="https://supabase.com/privacy">Supabase Privacy Policy</Ext>.</p>

      <h2>Consent for EEA and UK users</h2>
      <p>Visitors from the European Economic Area and the United Kingdom are shown a consent message powered by Google's consent management platform (Funding Choices). Personalized ads and non-essential cookies are used only in line with your choices, which you can change at any time.</p>

      <h2>Data retention</h2>
      <p>We keep account data while your account is active and delete or anonymize it within a reasonable period after you request deletion, unless we must keep it for legal, tax, or security reasons. Contact messages are kept only as long as needed to respond.</p>

      <h2>Your rights (GDPR and CCPA)</h2>
      <p>Depending on where you live, you may have the right to access, correct, delete, or export your personal data, object to or restrict processing, withdraw consent, and opt out of the "sale" or "sharing" of personal information. We do not sell personal information. To exercise these rights, use our <Link to="/contact">contact form</Link>. We will not discriminate against you for exercising your rights.</p>

      <h2>Children's privacy</h2>
      <p>The Site is not directed to children under 13 (or under 16 in the EEA/UK), and we do not knowingly collect their personal data. If you believe a child has provided us data, contact us and we will delete it.</p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy from time to time. Changes are posted on this page with a new "Last updated" date.</p>

      <h2>Contact</h2>
      <p>Questions? Reach us through our <Link to="/contact">contact page</Link>.</p>
    </LegalPage>
  );
}
