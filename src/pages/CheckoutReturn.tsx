import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
import { TopNav } from "@/components/layout/TopNav";
import { toast } from "sonner";

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const { refetch, isActive } = useSubscription();
  const announcedRef = useRef(false);

  // Poll for the webhook to land the subscription row, then welcome + redirect.
  useEffect(() => {
    if (!sessionId) return;
    const t = setInterval(refetch, 2000);
    const stop = setTimeout(() => clearInterval(t), 20000);
    return () => {
      clearInterval(t);
      clearTimeout(stop);
    };
  }, [sessionId, refetch]);

  useEffect(() => {
    if (!sessionId || !isActive || announcedRef.current) return;
    announcedRef.current = true;
    toast.success("Welcome to Profit Pathfinder Pro", {
      description: "All Pro tools are now unlocked. Taking you to the AI Trade Journal…",
      icon: <Sparkles className="h-4 w-4" />,
    });
    const redirect = setTimeout(() => navigate("/ai-trade-journal", { replace: true }), 1800);
    return () => clearTimeout(redirect);
  }, [isActive, sessionId, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-xl mx-auto p-8 text-center">
          {sessionId ? (
            <>
              {isActive ? (
                <CheckCircle2 className="h-14 w-14 mx-auto mb-4 text-primary" />
              ) : (
                <Loader2 className="h-14 w-14 mx-auto mb-4 text-primary animate-spin" />
              )}
              <h1 className="text-2xl font-semibold mb-2">
                {isActive ? "You're in." : "Activating your Pro access…"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {isActive
                  ? "Redirecting you to the AI Trade Journal."
                  : "This usually takes a few seconds while we confirm the payment."}
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button onClick={() => navigate("/ai-trade-journal")} disabled={!isActive}>
                  Open AI Trade Journal
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/settings">View subscription</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold mb-2">No session found</h1>
              <p className="text-muted-foreground mb-6">
                We couldn't find a checkout session. Try again from the pricing page.
              </p>
              <Button asChild>
                <Link to="/pricing">Back to pricing</Link>
              </Button>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
