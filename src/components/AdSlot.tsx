import { useEffect, useRef } from 'react';
import { ADSENSE_PUBLISHER_ID } from '@/config/ads';

interface AdSlotProps {
  slot: string;
  minHeight?: number;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Reserved ad space. Renders nothing visible until ADSENSE_PUBLISHER_ID is set. */
export function AdSlot({ slot, minHeight = 250, className = '' }: AdSlotProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_PUBLISHER_ID || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore ad load errors
    }
  }, []);

  return (
    <div className={`w-full my-8 ${className}`} style={{ minHeight }} aria-hidden={!ADSENSE_PUBLISHER_ID}>
      {ADSENSE_PUBLISHER_ID && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', minHeight }}
          data-ad-client={ADSENSE_PUBLISHER_ID}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
}

export default AdSlot;
