import { Link } from 'react-router-dom';
import { LegalPage } from '@/components/layout/LegalPage';

const posts = [
  {
    to: '/blog/covered-call-calculator-guide',
    title: 'Covered Call Calculator Guide',
    excerpt: 'How the Covered Call Calculator works out premium income, breakeven, max profit and annualized return for the wheel strategy, plus the Trading Toolkit risk tools.',
  },
  {
    to: '/blog/real-estate-car-finance-guide',
    title: 'Real Estate & Car Loan Calculator Guide',
    excerpt: 'Model rental cash flow and ROI, and see the true cost and total interest of a car loan before you commit to a big financial decision.',
  },
];

export default function BlogIndex() {
  return (
    <LegalPage title="Profit Pathfinder Blog" showUpdated={false}>
      <p>Guides and walkthroughs for our free calculators.</p>
      {posts.map((p) => (
        <article key={p.to}>
          <h2><Link to={p.to}>{p.title}</Link></h2>
          <p>{p.excerpt}</p>
        </article>
      ))}
    </LegalPage>
  );
}
