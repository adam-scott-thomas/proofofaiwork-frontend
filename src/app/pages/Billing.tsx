import { useState, useEffect } from "react";
import { CreditCard, Crown, Zap, CheckCircle2, Loader2, Shield, Bitcoin, ExternalLink, Sparkles, RefreshCw, Download, Briefcase, Package } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import {
  useBilling,
  usePaymentConfig,
  useSaveCard,
  useSubscribe,
  useSetModelTier,
  useCreateCryptoInvoice,
  useCryptoStatus,
} from "../../hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SquarePaymentForm from "../components/SquarePaymentForm";

const MODEL_TIERS = [
  { id: "free", label: "Standard", model: "GPT-4o Mini", desc: "Fast, good for most work", icon: Zap },
  { id: "paid", label: "Enhanced", model: "GPT-5.4", desc: "Sharper grouping and better judgment calls", icon: Shield },
  { id: "premium", label: "Premium", model: "Claude Opus", desc: "Maximum-quality reasoning for the hardest grouping jobs", icon: Crown },
] as const;

type CardDialogMode = "save" | "subscribe" | null;
type PaymentMethod = "card" | "crypto";

export default function Billing() {
  const { data: billing, isLoading } = useBilling();
  const { data: paymentConfig } = usePaymentConfig();
  const saveCardMutation = useSaveCard();
  const subscribeMutation = useSubscribe();
  const setTierMutation = useSetModelTier();
  const cryptoInvoiceMutation = useCreateCryptoInvoice();
  const queryClient = useQueryClient();

  const [cardDialogMode, setCardDialogMode] = useState<CardDialogMode>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cryptoInvoiceId, setCryptoInvoiceId] = useState<string | null>(null);
  const [cryptoInvoiceUrl, setCryptoInvoiceUrl] = useState<string | null>(null);
  const [cryptoFeature, setCryptoFeature] = useState<string | null>(null);

  const { data: cryptoStatus } = useCryptoStatus(cryptoInvoiceId);

  // Watch for crypto payment completion
  useEffect(() => {
    if (!cryptoInvoiceId || !cryptoStatus) return;
    if (cryptoStatus.local_status === "completed" || cryptoStatus.np_status === "finished" || cryptoStatus.np_status === "confirmed") {
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      setCardDialogMode(null);
      setCryptoInvoiceId(null);
      setCryptoInvoiceUrl(null);
      setSuccessMsg(
        cryptoFeature === "ai_sort"
          ? "Crypto payment confirmed. Premium AI grouping is unlocked on this account."
          : "Crypto payment confirmed! Feature activated."
      );
      setCryptoFeature(null);
    }
  }, [cryptoStatus, cryptoFeature, cryptoInvoiceId, queryClient]);

  // Poll crypto status every 10s while waiting
  useEffect(() => {
    if (!cryptoInvoiceId) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["crypto-status", cryptoInvoiceId] });
    }, 10_000);
    return () => clearInterval(interval);
  }, [cryptoInvoiceId, queryClient]);

  // Check URL params for crypto return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("crypto") === "success") {
      setSuccessMsg("Crypto payment submitted! It may take a few minutes to confirm.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

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

  const handleCardToken = async (sourceId: string) => {
    setSuccessMsg(null);

    if (cardDialogMode === "subscribe") {
      subscribeMutation.mutate(
        { source_id: sourceId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["billing"] });
            setCardDialogMode(null);
            setSuccessMsg("Subscribed to Pro! All features unlocked.");
          },
        },
      );
    } else {
      saveCardMutation.mutate(
        { source_id: sourceId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["billing"] });
            setCardDialogMode(null);
            setSuccessMsg("Card saved successfully.");
          },
        },
      );
    }
  };

  const handleCryptoSubscribe = () => {
    setSuccessMsg(null);
    setCryptoFeature("subscription");
    cryptoInvoiceMutation.mutate(
      { feature: "subscription" },
      {
        onSuccess: (data) => {
          setCryptoInvoiceId(data.invoice_id);
          setCryptoInvoiceUrl(data.invoice_url);
        },
      },
    );
  };

  const handleCryptoFeaturePurchase = (feature: string, successMessage: string) => {
    setSuccessMsg(null);
    setCryptoFeature(feature);
    cryptoInvoiceMutation.mutate(
      { feature },
      {
        onSuccess: (data) => {
          setCryptoInvoiceId(data.invoice_id);
          setCryptoInvoiceUrl(data.invoice_url);
          window.open(data.invoice_url, "_blank");
          setSuccessMsg(successMessage);
        },
      },
    );
  };

  const mutationPending = saveCardMutation.isPending || subscribeMutation.isPending;
  const mutationError = saveCardMutation.error || subscribeMutation.error;

  return (
    <div className="min-h-screen">
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="px-8 py-6">
          <h1 className="text-xl tracking-tight">Billing & Plan</h1>
          <p className="mt-1 text-[13px] text-[#717182]">Manage your subscription, payment method, and AI model tier</p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-8 space-y-6">
        {/* Success message */}
        {successMsg && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {successMsg}
          </div>
        )}

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
              <Button onClick={() => setCardDialogMode("subscribe")}>
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
            <Button variant="outline" size="sm" onClick={() => setCardDialogMode("save")}>
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
                      setCardDialogMode("subscribe");
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

        {/* Micro purchases */}
        <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
          <h2 className="text-[15px] mb-1">Micro Purchases</h2>
          <p className="text-[13px] text-[#717182] mb-5">Pay only for what you use.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[
              { icon: Sparkles, label: "AI Sort", price: "$5", desc: "Unlock GPT-5.4 / Opus grouping", feature: "ai_sort" },
              { icon: Zap, label: "Full Assessment", price: "$7", desc: "Forensic evaluation + scores" },
              { icon: Lock, label: "Private Mode", price: "$7", desc: "Keep your proof page private" },
              { icon: Crown, label: "Premium Polish", price: "$3", desc: "Enhanced profile presentation" },
              { icon: RefreshCw, label: "Rerun", price: "$3", desc: "Re-evaluate an assessment" },
              { icon: Download, label: "Export Packet", price: "$4", desc: "Download full evidence export" },
              { icon: Briefcase, label: "Career Add-ons", price: "$3–4", desc: "Resume, LinkedIn, cover letter" },
            ].map(({ icon: Icon, label, price, desc, feature }) => (
              <div
                key={label}
                className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-[#717182]" />
                  <span className="font-mono text-[13px] text-[#030213]">{price}</span>
                </div>
                <div className="text-[13px] font-medium">{label}</div>
                <div className="text-[11px] text-[#717182] leading-snug">{desc}</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-auto w-full text-[12px]"
                  onClick={() => {
                    if (feature === "ai_sort") {
                      handleCryptoFeaturePurchase(
                        "ai_sort",
                        "NOWPayments invoice opened for premium AI grouping. Once it confirms, run GPT-5.4 / Opus grouping from the dashboard."
                      );
                      return;
                    }
                    toast.info("Coming soon");
                  }}
                >
                  {feature === "ai_sort" ? "Unlock" : "Buy"}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Bundles */}
        <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
          <h2 className="text-[15px] mb-1">Bundles</h2>
          <p className="text-[13px] text-[#717182] mb-5">Unlock everything at a flat rate.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#717182]" />
                  <span className="text-[14px] font-medium">Unlock All for 90 Days</span>
                </div>
                <span className="font-mono text-[15px] text-[#030213]">$24</span>
              </div>
              <p className="text-[12px] text-[#717182] mb-4">
                Every micro-purchase feature, unlimited runs, for 90 days.
              </p>
              <Button
                variant="outline"
                className="w-full text-[13px]"
                disabled
                onClick={() => toast.info("Coming soon")}
              >
                Coming soon
              </Button>
            </div>
            <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-[#717182]" />
                  <span className="text-[14px] font-medium">Unlock All for 1 Year</span>
                </div>
                <span className="font-mono text-[15px] text-[#030213]">$79</span>
              </div>
              <p className="text-[12px] text-[#717182] mb-4">
                Best value — every feature, unlimited for a full year.
              </p>
              <Button
                variant="outline"
                className="w-full text-[13px]"
                disabled
                onClick={() => toast.info("Coming soon")}
              >
                Coming soon
              </Button>
            </div>
          </div>
        </Card>

        {/* Feature pricing (legacy — hidden in free mode, shown as reference in paid mode) */}
        {!isFreeMode && (
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
            <h2 className="text-[15px] mb-4">Paywall Status</h2>
            <div className="space-y-3">
              {[
                { feature: "ai_sort", label: "AI Sort", flag: flags.paywall_ai_sort },
                { feature: "student_publish", label: "Student Proof Publish", flag: flags.paywall_student_publish },
                { feature: "evaluation", label: "Full Assessment", flag: flags.paywall_evaluation },
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

      {/* Payment dialog — Card or Crypto */}
      <Dialog
        open={cardDialogMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCardDialogMode(null);
            setPaymentMethod("card");
            setCryptoInvoiceId(null);
            setCryptoInvoiceUrl(null);
          }
        }}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              {cardDialogMode === "subscribe" ? "Subscribe to Pro" : hasCard ? "Update Payment Method" : "Add Payment Method"}
            </DialogTitle>
            <DialogDescription>
              {cardDialogMode === "subscribe"
                ? `$${((prices.subscription ?? 0) / 100).toFixed(2)}/month — unlocks all features and premium models.`
                : "Your card is securely tokenized by Square. We never see your full card number."}
            </DialogDescription>
          </DialogHeader>

          {/* Payment method tabs — only show for subscribe */}
          {cardDialogMode === "subscribe" && (
            <div className="flex gap-2 border-b border-[rgba(0,0,0,0.08)] pb-3">
              <button
                onClick={() => setPaymentMethod("card")}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                  paymentMethod === "card"
                    ? "bg-[#030213] text-white"
                    : "bg-gray-100 text-[#717182] hover:bg-gray-200"
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Card
              </button>
              <button
                onClick={() => setPaymentMethod("crypto")}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                  paymentMethod === "crypto"
                    ? "bg-[#030213] text-white"
                    : "bg-gray-100 text-[#717182] hover:bg-gray-200"
                }`}
              >
                <Bitcoin className="h-3.5 w-3.5" />
                Crypto
              </button>
            </div>
          )}

          {mutationError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {(mutationError as Error).message}
            </div>
          )}

          {cryptoInvoiceMutation.error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {(cryptoInvoiceMutation.error as Error).message}
            </div>
          )}

          {/* Card payment form */}
          {paymentMethod === "card" && (
            <>
              {paymentConfig?.app_id && paymentConfig?.location_id ? (
                <SquarePaymentForm
                  appId={paymentConfig.app_id}
                  locationId={paymentConfig.location_id}
                  onToken={handleCardToken}
                  onCancel={() => setCardDialogMode(null)}
                  submitLabel={cardDialogMode === "subscribe" ? `Subscribe — $${((prices.subscription ?? 0) / 100).toFixed(2)}/mo` : "Save Card"}
                  loading={mutationPending}
                />
              ) : (
                <div className="flex items-center gap-2 text-[13px] text-[#717182]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading payment configuration...
                </div>
              )}
            </>
          )}

          {/* Crypto payment flow */}
          {paymentMethod === "crypto" && (
            <div className="space-y-4">
              {!cryptoInvoiceUrl ? (
                <>
                  <p className="text-[13px] text-[#717182]">
                    Pay with 300+ cryptocurrencies via NowPayments. You'll be redirected to complete the payment.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCardDialogMode(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCryptoSubscribe}
                      disabled={cryptoInvoiceMutation.isPending}
                    >
                      {cryptoInvoiceMutation.isPending && (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      )}
                      <Bitcoin className="mr-2 h-3.5 w-3.5" />
                      Pay with Crypto — ${((prices.subscription ?? 0) / 100).toFixed(2)}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
                    <p className="text-[13px] text-amber-800 font-medium mb-1">Invoice created</p>
                    <p className="text-[12px] text-amber-700">
                      Complete your payment in the NowPayments window. This page will update automatically when confirmed.
                    </p>
                  </div>

                  {cryptoStatus && (
                    <div className="flex items-center gap-2 text-[13px] text-[#717182]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Status: {cryptoStatus.np_status || cryptoStatus.local_status || "waiting"}
                    </div>
                  )}

                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCryptoInvoiceId(null);
                        setCryptoInvoiceUrl(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => window.open(cryptoInvoiceUrl, "_blank")}
                    >
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      Open Payment Page
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
