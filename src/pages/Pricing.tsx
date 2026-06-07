import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { TopNav } from "@/components/layout/TopNav";
import { Orbs } from "@/components/layout/Orbs";

const FEATURES = [
  "SmartTrade AI & QuantGemini analysis",
  "Advanced portfolio & performance tracking",
  "Full options toolkit (PMCC, Wheel, Condor, 0DTE)",
  "Unlimited AI fundamental analysis",
  "Dividend tracker with CAGR & YOC",
  "Real estate & car finance suites",
  "Priority data refreshes",
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isActive } = useSubscription();
  const [checkoutPrice, setCheckoutPrice] = useState<string | null>(null);

  const startCheckout = (priceId: string) => {
    if (!user) {
      navigate("/auth", { state: { from: { pathname: "/pricing" } } });
      return;
    }
    setCheckoutPrice(priceId);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <Orbs />
      <TopNav />
      <PaymentTestModeBanner />

      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" /> Profit Pathfinder Pro
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display gradient-text mb-4">
            Unlock the full toolkit
          </h1>
          <p className="text-muted-foreground text-lg">
            Get every AI-powered tool, advanced analytics, and the complete options suite.
          </p>
        </div>

        {isActive ? (
          <Card className="max-w-xl mx-auto p-8 text-center">
            <Sparkles className="h-10 w-10 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-semibold mb-2">You're on Pro</h2>
            <p className="text-muted-foreground mb-6">
              Thanks for being a Profit Pathfinder Pro member. Enjoy full access.
            </p>
            <Button onClick={() => navigate("/")}>Back to app</Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <PricingCard
              title="Monthly"
              price="$9.99"
              period="/month"
              priceId="pro_monthly"
              onSelect={startCheckout}
              features={FEATURES}
            />
            <PricingCard
              title="Yearly"
              price="$99"
              period="/year"
              priceId="pro_yearly"
              highlight
              badge="Save 17%"
              onSelect={startCheckout}
              features={FEATURES}
            />
          </div>
        )}

        <Dialog open={!!checkoutPrice} onOpenChange={(open) => !open && setCheckoutPrice(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Complete your purchase</DialogTitle>
            </DialogHeader>
            {checkoutPrice && user && (
              <StripeEmbeddedCheckout
                priceId={checkoutPrice}
                customerEmail={user.email}
                userId={user.id}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  priceId: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
  onSelect: (priceId: string) => void;
}

function PricingCard({ title, price, period, priceId, features, highlight, badge, onSelect }: PricingCardProps) {
  return (
    <Card className={`p-8 relative ${highlight ? "border-primary shadow-lg shadow-primary/20" : ""}`}>
      {badge && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">{badge}</Badge>
      )}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <div className="flex items-baseline mb-6">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-muted-foreground ml-1">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button
        className="w-full"
        variant={highlight ? "default" : "outline"}
        onClick={() => onSelect(priceId)}
      >
        Get {title}
      </Button>
    </Card>
  );
}
