import { Link } from 'react-router-dom';
import { LegalPage } from '@/components/layout/LegalPage';

export default function About() {
  return (
    <LegalPage title="About Profit Pathfinder" showUpdated={false}>
      <p>Profit Pathfinder is a free collection of personal finance calculators and guides for people working toward financial independence.</p>

      <h2>What you'll find here</h2>
      <ul>
        <li><strong>FIRE and Coast FIRE:</strong> the <Link to="/coast-fire-tracker">Coast FIRE Tracker</Link>, <Link to="/coast-fire-calculator">Coast FIRE Calculator</Link>, <Link to="/early-retirement-calculator">Early Retirement Calculator</Link>, and the <Link to="/fire-for-beginners">FIRE for Beginners</Link> guide.</li>
        <li><strong>Dividends:</strong> the <Link to="/dividend-tracker">Dividend Tracker</Link> and <Link to="/monthly-dividend-calculator">Monthly Dividend Calculator</Link>.</li>
        <li><strong>Options and trading:</strong> the <Link to="/covered-call-calculator">Covered Call Calculator</Link>, <Link to="/trading-toolkit">Trading Toolkit</Link>, and <Link to="/options-guide">Options Guide</Link>.</li>
        <li><strong>Real estate and car finance:</strong> <Link to="/real-estate">real estate</Link> and <Link to="/car-finance">car finance</Link> calculators.</li>
      </ul>

      <h2>Our approach</h2>
      <p>We build tools that are clear, fast, and work on any device. Most tools are free and need no account. Everything here is educational — see our <Link to="/disclaimer">Disclaimer</Link>.</p>

      <p>Have feedback or ideas? <Link to="/contact">Get in touch</Link>.</p>
    </LegalPage>
  );
}
