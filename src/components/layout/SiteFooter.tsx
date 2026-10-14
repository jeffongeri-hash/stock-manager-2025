import { Link } from 'react-router-dom';

const links = [
  { to: '/blog/covered-call-calculator-guide', label: 'Blog' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/disclaimer', label: 'Disclaimer' },
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border mt-8 px-4 py-6 text-sm text-muted-foreground">
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} Profit Pathfinder. Educational tools only — not financial advice.</p>
        <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-foreground transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
