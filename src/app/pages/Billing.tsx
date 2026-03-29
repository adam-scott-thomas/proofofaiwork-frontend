import { useState } from "react";
import { CreditCard, Crown, Zap, CheckCircle2, Loader2, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useBilling, useSubscribe, useSetModelTier } from "../../hooks/useApi";

const MODEL_TIERS = [
  { id: "free", label: "Standard", model: "GPT-4o Mini", desc: "Fast, good for most work", icon: Zap },
  { id: "paid", label: "Enhanced", model: "GPT-4o", desc: "Deeper analysis, better judgment calls", icon: Shield },
  { id: "premium", label: "Premium", model: "Claude Opus", desc: "Best available — maximum quality", icon: Crown },
] as const;

export default function Billing() {
  const { data: billing, isLoading } = useBilling();
  const subscribeMutation = useSubscribe();
  const setTierMutation = useSetModelTier();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#717182]">
        Loading billing...
      </div>
    );
  }

  const plan = billing?.plan ?? "free";
  const modelTier = billing?.model_tier ?? "free";
  const hasCard = billing?.has_card ?? false;
  const subActive = billing?.subscription_active ?? false;
  const flags = billing?.flags ?? {};
  const prices = billing?.prices ?? {};
  const isFreeMode = flags.billing_mode === "free";

  return (
    <div className="min-h-screen">
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="px-8 py-6">
          <h1 className="text-xl tracking-tight">Billing & Plan</h1>
          <p className="mt-1 text-[13px] text-[#717182]">Manage your subscription, payment method, and AI model tier</p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-8 space-y-6">
        {/* Current plan */}
        <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-[15px]">Current Plan</h2>
                <Badge variant="secondary" className={subActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600"}>
                  {subActive ? "Pro" : isFreeMode ? "Free (all features unlocked)" : "Free"}
                </Badge>
              </div>
              {subActive && billing?.subscription_expires_at && (
                <p className="text-[13px] text-[#717182]">
                  Renews {new Date(billing.subscription_expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}
              {isFreeMode && (
                <p className="text-[13px] text-emerald-600">All paywalls are currently disabled</p>
              )}
            </div>
            {!subActive && !isFreeMode && (
              <Button
                onClick={() => {
                  // For now, show a message — Square Web Payments SDK integration needed for card collection
                  alert("Subscription requires card setup. Coming soon.");
                }}
              >
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Pro — ${((prices.subscription ?? 0) / 100).toFixed(2)}/mo
              </Button>
            )}
          </div>
        </Card>

        {/* Payment method */}
        <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-[#717182]" />
              <div>
                <h2 className="text-[15px]">Payment Method</h2>
                <p className="text-[13px] text-[#717182]">
                  {hasCard ? "Card on file" : "No payment method saved"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => alert("Card setup coming soon — Square Web Payments SDK")}>
              {hasCard ? "Update card" : "Add card"}
            </Button>
          </div>
        </Card>

        {/* Model tier selector */}
        <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-[15px] mb-1">AI Model Tier</h2>
            <p className="text-[13px] text-[#717182]">
              Choose which AI model evaluates your work. Better models = deeper, more nuanced analysis.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {MODEL_TIERS.map((tier) => {
              const isActive = modelTier === tier.id;
              const needsSub = tier.id !== "free" && !subActive && !isFreeMode && flags.paywall_premium_model;
              return (
                <button
                  key={tier.id}
                  onClick={() => {
                    if (needsSub) {
                      alert("Upgrade to Pro to use this model tier");
                      return;
                    }
                    setSelectedTier(tier.id);
                    setTierMutation.mutate(tier.id);
                  }}
                  disabled={setTierMutation.isPending}
                  className={`rounded-lg border p-4 text-left transition-all ${
                    isActive
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                      : "border-[rgba(0,0,0,0.08)] hover:border-[rgba(0,0,0,0.2)]"
                  } ${needsSub ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <tier.icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-[#717182]"}`} />
                    <span className="text-[14px] font-medium">{tier.label}</span>
                    {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 ml-auto" />}
                  </div>
                  <p className="text-[12px] text-[#717182] mb-1">{tier.model}</p>
                  <p className="text-[11px] text-[#717182]">{tier.desc}</p>
                  {needsSub && (
                    <p className="mt-2 text-[11px] text-amber-600">Requires Pro subscription</p>
                  )}
                </button>
              );
            })}
          </div>
          {setTierMutation.isPending && (
            <div className="mt-3 flex items-center gap-2 text-[13px] text-[#717182]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Switching model...
            </div>
          )}
          {setTierMutation.isSuccess && selectedTier && (
            <div className="mt-3 flex items-center gap-2 text-[13px] text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Switched to {MODEL_TIERS.find(t => t.id === selectedTier)?.label}
            </div>
          )}
        </Card>

        {/* Feature pricing */}
        {!isFreeMode && (
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
            <h2 className="text-[15px] mb-4">Feature Pricing</h2>
            <div className="space-y-3">
              {[
                { feature: "ai_sort", label: "AI Sort", flag: flags.paywall_ai_sort },
                { feature: "student_publish", label: "Student Proof Publish", flag: flags.paywall_student_publish },
                { feature: "evaluation", label: "Run Evaluation", flag: flags.paywall_evaluation },
                { feature: "premium_model", label: "Premium Model Upgrade", flag: flags.paywall_premium_model },
              ].map(({ feature, label, flag }) => (
                <div key={feature} className="flex items-center justify-between text-[13px]">
                  <span className="text-[#3A3A3A]">{label}</span>
                  <span className={flag ? "text-[#717182]" : "text-emerald-600"}>
                    {flag ? `$${((prices[feature] ?? 0) / 100).toFixed(2)}` : "Free"}
                    {subActive && flag && " (included in Pro)"}
                  </span>
                </div>
              ))}
              {!subActive && (
                <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.06)]">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-[#030213]">Pro Subscription (all included)</span>
                    <span className="font-medium text-[#030213]">${((prices.subscription ?? 0) / 100).toFixed(2)}/month</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
