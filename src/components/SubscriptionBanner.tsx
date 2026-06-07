import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Dunning banner — only renders when the user's subscription is in `past_due`.
 * Stripe automatically retries for ~3 weeks; this nudges them to update their
 * payment method via the Customer Portal in the meantime. Pro access stays on.
 */
export function SubscriptionBanner() {
  const { subscription } = useSubscription();
  const [loading, setLoading] = useState(false);

  if (subscription?.status !== "past_due") return null;

  const openPortal = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          environment: getStripeEnvironment(),
          returnUrl: window.location.href,
        },
      });
      if (error || !data?.url) throw new Error(error?.message || "Portal unavailable");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e.message || "Could not open subscription portal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-amber-500/15 border-b border-amber-500/40 px-4 py-2.5 flex items-center justify-center gap-3 text-sm">
      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
      <span className="text-amber-700 dark:text-amber-200">
        Your last Pro payment didn't go through. We'll keep retrying — update your card to stay subscribed.
      </span>
      <Button size="sm" variant="outline" onClick={openPortal} disabled={loading} className="ml-1 h-7">
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Update payment"}
      </Button>
    </div>
  );
}
