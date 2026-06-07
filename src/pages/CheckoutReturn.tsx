import { useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
import { TopNav } from "@/components/layout/TopNav";

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const { refetch } = useSubscription();

  useEffect(() => {
    if (sessionId) {
      const t = setInterval(refetch, 2000);
      const stop = setTimeout(() => clearInterval(t), 15000);
      return () => {
        clearInterval(t);
        clearTimeout(stop);
      };
    }
  }, [sessionId, refetch]);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-xl mx-auto p-8 text-center">
          {sessionId ? (
            <>
              <CheckCircle2 className="h-14 w-14 mx-auto mb-4 text-primary" />
              <h1 className="text-2xl font-semibold mb-2">Payment received</h1>
              <p className="text-muted-foreground mb-6">
                Welcome to Profit Pathfinder Pro. Your access is being activated.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/")}>Go to dashboard</Button>
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
