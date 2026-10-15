import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPartnersForPath } from '@/config/affiliates';

export function RecommendedTools({ currentPath }: { currentPath: string }) {
  const partners = getPartnersForPath(currentPath);
  if (partners.length === 0) return null;

  return (
    <section aria-label="Tools we like" className="space-y-3 text-muted-foreground">
      <h2 className="text-base font-medium">Tools we like</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {partners.map((partner) => (
          <Card key={partner.name} className="flex flex-col items-start gap-3 bg-muted/10 p-4">
            <h3 className="text-sm font-medium text-foreground">{partner.name}</h3>
            <p className="flex-1 text-sm text-muted-foreground">{partner.blurb}</p>
            <Button asChild variant="outline" size="sm">
              <a href={partner.url} target="_blank" rel="sponsored noopener">Learn more</a>
            </Button>
          </Card>
        ))}
      </div>
      <div className="space-y-1 text-xs leading-relaxed">
        <p>We may earn a commission if you sign up through this link, at no cost to you.</p>
        <p>
          Not financial advice — see our{' '}
          <Link to="/disclaimer" className="underline underline-offset-2 hover:text-foreground">disclaimer</Link>.
        </p>
      </div>
    </section>
  );
}