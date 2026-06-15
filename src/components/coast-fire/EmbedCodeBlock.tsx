import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { siteConfig } from '@/lib/seo-config';
import { Check, Copy } from 'lucide-react';

/**
 * Generates a ready-to-paste iframe snippet for the public Coast FIRE Tracker
 * embed at /embed/coast-fire-tracker.html. Users can tweak width/height and
 * copy the snippet to drop into any blog/CMS.
 */
export function EmbedCodeBlock() {
  const [width, setWidth] = useState('100%');
  const [height, setHeight] = useState('640');
  const [copied, setCopied] = useState(false);

  const src = `${siteConfig.url}/embed/coast-fire-tracker.html`;
  const snippet = useMemo(
    () =>
      `<iframe src="${src}" width="${width}" height="${height}" style="border:0;max-width:100%;" loading="lazy" title="Coast FIRE Tracker by Profit Pathfinder"></iframe>
<p style="font:12px/1.4 sans-serif;color:#6b7280;margin-top:4px;">Powered by <a href="https://profitpathfinder.online/coast-fire-tracker" target="_blank" rel="noopener">Coast FIRE Tracker</a> from Profit Pathfinder.</p>`,
    [src, width, height],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  return (
    <Card className="p-5 sm:p-6 border-primary/20 bg-muted/20">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-4">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">Width</Label>
          <Input value={width} onChange={(e) => setWidth(e.target.value)} className="mt-1 font-mono" />
        </div>
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">Height (px)</Label>
          <Input value={height} onChange={(e) => setHeight(e.target.value)} className="mt-1 font-mono" />
        </div>
        <Button onClick={copy} className="sm:w-40">
          {copied ? <><Check className="h-4 w-4 mr-2" />Copied</> : <><Copy className="h-4 w-4 mr-2" />Copy embed</>}
        </Button>
      </div>
      <pre className="text-xs font-mono bg-background/60 border border-border-soft rounded-md p-3 overflow-auto whitespace-pre-wrap break-all">
{snippet}
      </pre>
      <div className="mt-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Live preview</div>
        <div className="rounded-lg overflow-hidden border border-border-soft bg-background">
          <iframe
            src={src}
            width="100%"
            height={Number(height) || 640}
            style={{ border: 0, display: 'block', maxWidth: '100%' }}
            loading="lazy"
            title="Coast FIRE Tracker embed preview"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Free to embed on blogs, newsletters, and personal-finance sites. A small attribution link back to Profit Pathfinder is included by default — please keep it so readers can find the full tracker.
      </p>
    </Card>
  );
}
