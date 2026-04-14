import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Sparkles, Lock, CreditCard, Bitcoin, ExternalLink, Loader2, AlertCircle, CheckCircle2, Tag } from "lucide-react";
import React, { useState } from "react";
import { usePaymentConfig } from "../../hooks/useApi";
import { apiFetch, apiPost } from "../../lib/api";
import { useUnlockStore } from "../../stores/unlockStore";
import SquarePaymentForm from "./SquarePaymentForm";
import UnlockSuccess from "./UnlockSuccess";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type PaymentTab = "card" | "crypto";

export function PaymentModal({ open, onOpenChange, onComplete }: PaymentModalProps) {
  const { data: paymentConfig } = usePaymentConfig();
  const setUnlocked = useUnlockStore((s) => s.setUnlocked);

  const [tab, setTab] = useState<PaymentTab>("card");
  const [cardLoading, setCardLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [cryptoInvoiceUrl, setCryptoInvoiceUrl] = useState<string | null>(null);
  const [cryptoInvoiceId, setCryptoInvoiceId] = useState<string | null>(null);
  const [cryptoStatus, setCryptoStatus] = useState<string>("waiting");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponFinalCents, setCouponFinalCents] = useState(0);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMethod, setSuccessMethod] = useState<string>("Card");
  const [successAmount, setSuccessAmount] = useState<string>("$5.00");

  const isFreeWithCoupon = couponApplied && couponFinalCents === 0;

  // Server-side coupon validation. The backend records a Payment row
  // with payment_type='coupon' which the paywall dependency honors.
  const handleApplyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    setCouponChecking(true);
    setError(null);
    try {
      const res = await apiPost<{
        status: string;
        feature: string;
        discount_percent: number;
        amount_paid_cents: number;
        full_price_cents: number;
      }>("/payments/coupon/redeem", { code, feature: "ai_sort" });
      setCouponApplied(true);
      setCouponDiscount(res.discount_percent);
      setCouponFinalCents(res.amount_paid_cents);
    } catch (e: any) {
      setError(e?.message ?? "Invalid coupon code");
      setCouponApplied(false);
      setCouponDiscount(0);
      setCouponFinalCents(0);
    } finally {
      setCouponChecking(false);
    }
  };

  const [unlocking, setUnlocking] = useState(false);

  const triggerUnlock = (method: string, amount: string) => {
    setUnlocked();
    setSuccessMethod(method);
    setSuccessAmount(amount);
    onOpenChange(false);
    setSuccessOpen(true);
    // Kick off clustering in background — paywall now gates this
    // server-side, so the call only succeeds if the backend saw the
    // payment/coupon row we just created.
    apiPost("/projects/ai-cluster", {}).catch(() => {});
  };

  const handleFreeUnlock = () => {
    setUnlocking(true);
    triggerUnlock(`Coupon ${coupon.trim().toUpperCase()}`, "$0.00");
    setUnlocking(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setTab("card");
      setError(null);
      setCryptoInvoiceUrl(null);
      setCryptoInvoiceId(null);
      setCryptoStatus("waiting");
      setCoupon("");
      setCouponApplied(false);
      setCouponDiscount(0);
      setCouponFinalCents(0);
    }
    onOpenChange(open);
  };

  const handleCardToken = async (sourceId: string) => {
    setError(null);
    setCardLoading(true);
    try {
      await apiPost("/payments/ai-sort", { source_id: sourceId });
      triggerUnlock("Card", "$5.00");
    } catch (e: any) {
      setError(e.message || "Payment failed. Please try again.");
    } finally {
      setCardLoading(false);
    }
  };

  const handleCryptoPay = async () => {
    setError(null);
    setCryptoLoading(true);
    setCryptoStatus("waiting");
    try {
      const res = await apiPost<{ invoice_url: string; invoice_id?: string; id?: string }>(
        "/payments/crypto-invoice",
        { feature: "ai_sort" },
      );
      setCryptoInvoiceUrl(res.invoice_url);
      setCryptoInvoiceId(res.invoice_id ?? res.id ?? null);
      window.open(res.invoice_url, "_blank");
    } catch (e: any) {
      setError(e.message || "Could not create crypto invoice. Please try again.");
    } finally {
      setCryptoLoading(false);
    }
  };

  // Poll crypto invoice status every 5s while the invoice screen is open.
  // When status transitions to finished/confirmed, fire the unlock.
  React.useEffect(() => {
    if (!cryptoInvoiceId || !open) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const s: any = await apiFetch(`/payments/crypto-status/${cryptoInvoiceId}`);
        if (cancelled) return;
        const status = (s?.status ?? s?.payment_status ?? "").toLowerCase();
        setCryptoStatus(status || "waiting");
        if (status === "finished" || status === "confirmed" || status === "paid") {
          triggerUnlock("Crypto", "$4.20");
        }
      } catch {
        /* transient — keep polling */
      }
    };

    poll(); // fire once immediately
    const interval = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cryptoInvoiceId, open]);

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5" />
            Run AI Sort
          </DialogTitle>
          <DialogDescription>
            Preview your results and complete payment to unlock AI-organized work
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview of what they're buying */}
          <div className="rounded-md border-2 border-[var(--score-execution)] bg-[#FAFAFA] p-6">
            <div className="mb-4 text-[11px] uppercase tracking-wider text-[#717182]">
              Your Result
            </div>
            <div className="mb-4 text-5xl tracking-tight font-medium">
              ADVANCED–INTERMEDIATE
            </div>
            <div className="border-l-4 border-[rgba(0,0,0,0.08)] pl-4">
              <p className="mb-3 text-[15px] leading-relaxed text-[#3A3A3A]">
                You control direction and get outcomes.
              </p>
              <p className="text-[15px] leading-relaxed text-[#717182]">
                But you don't define constraints early — so you waste cycles fixing things later.
              </p>
            </div>
          </div>

          {/* What you get */}
          <div className="space-y-2 text-[14px]">
            <div className="text-[13px] text-[#717182]">This unlocks:</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[#717182]">→</span>
                <span>Projects structured and grouped</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#717182]">→</span>
                <span>Verified profile scores and shareable proof pages</span>
              </div>
            </div>
          </div>

          {/* Coupon */}
          <div className="border-t border-[rgba(0,0,0,0.06)] pt-4">
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-[#717182]" />
              <span className="text-[13px] text-[#717182]">Have a coupon?</span>
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                value={coupon}
                onChange={(e) => {
                  setCoupon(e.target.value);
                  setCouponApplied(false);
                  setCouponDiscount(0);
                  setCouponFinalCents(0);
                  setError(null);
                }}
                placeholder="Enter code"
                className="h-9 text-[13px] uppercase"
                disabled={couponApplied || couponChecking}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplyCoupon}
                disabled={!coupon.trim() || couponApplied || couponChecking}
              >
                {couponChecking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : couponApplied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  "Apply"
                )}
              </Button>
            </div>
            {couponApplied && (
              <p className="mt-2 text-[13px] text-green-600">
                {couponDiscount}% off applied{isFreeWithCoupon ? " — free unlock!" : ""}
              </p>
            )}
          </div>

          {/* Free unlock with coupon */}
          {isFreeWithCoupon ? (
            <div className="space-y-3">
              <Button className="w-full" size="lg" onClick={handleFreeUnlock} disabled={unlocking}>
                {unlocking ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Running AI Sort...</>
                ) : (
                  <><Sparkles className="mr-2 h-5 w-5" /> Unlock — Free</>
                )}
              </Button>
              <p className="text-center text-[12px] text-[#717182]">
                Coupon {coupon.trim().toUpperCase()} applied. No payment required.
              </p>
            </div>
          ) : (
          /* Payment section */
          <div className="space-y-4">
            {/* Payment method tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => { setTab("card"); setError(null); }}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                  tab === "card"
                    ? "bg-[#030213] text-white"
                    : "bg-gray-100 text-[#717182] hover:bg-gray-200"
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Card — $5
              </button>
              <button
                onClick={() => { setTab("crypto"); setError(null); }}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                  tab === "crypto"
                    ? "bg-[#030213] text-white"
                    : "bg-gray-100 text-[#717182] hover:bg-gray-200"
                }`}
              >
                <Bitcoin className="h-3.5 w-3.5" />
                Crypto — $4.20
              </button>
            </div>

            {/* Error display */}
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Card tab */}
            {tab === "card" && (
              <>
                <div className="flex items-center gap-2 text-[13px] text-[#717182]">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Secure payment powered by Square</span>
                </div>

                {paymentConfig?.app_id && paymentConfig?.location_id ? (
                  <SquarePaymentForm
                    appId={paymentConfig.app_id}
                    locationId={paymentConfig.location_id}
                    onToken={handleCardToken}
                    onCancel={() => onOpenChange(false)}
                    submitLabel="Pay $5"
                    loading={cardLoading}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-[13px] text-[#717182]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading payment configuration...
                  </div>
                )}
              </>
            )}

            {/* Crypto tab */}
            {tab === "crypto" && (
              <div className="space-y-4">
                {!cryptoInvoiceUrl ? (
                  <>
                    <p className="text-[13px] text-[#717182]">
                      Pay with 300+ cryptocurrencies via NowPayments. You'll be redirected to a secure payment page.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => onOpenChange(false)}
                        disabled={cryptoLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleCryptoPay}
                        disabled={cryptoLoading}
                      >
                        {cryptoLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                        <Bitcoin className="mr-2 h-3.5 w-3.5" />
                        Pay with Crypto — $4.20
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        {cryptoStatus === "finished" || cryptoStatus === "confirmed" || cryptoStatus === "paid" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                        ) : (
                          <Loader2 className="h-4 w-4 text-amber-700 animate-spin" />
                        )}
                        <p className="text-[13px] text-amber-800 font-medium">
                          {cryptoStatus === "waiting" && "Invoice created — waiting for payment"}
                          {cryptoStatus === "confirming" && "Payment detected — confirming on chain…"}
                          {cryptoStatus === "partially_paid" && "Partial payment received"}
                          {(cryptoStatus === "finished" || cryptoStatus === "confirmed" || cryptoStatus === "paid") && "Payment confirmed — unlocking…"}
                          {cryptoStatus === "failed" && "Payment failed"}
                          {cryptoStatus === "expired" && "Invoice expired"}
                          {!["waiting","confirming","partially_paid","finished","confirmed","paid","failed","expired"].includes(cryptoStatus) && "Checking status…"}
                        </p>
                      </div>
                      <p className="text-[12px] text-amber-700">
                        Complete your payment in the NowPayments window. We check every 5 seconds — this page will unlock automatically once the payment confirms.
                      </p>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCryptoInvoiceUrl(null);
                          setCryptoInvoiceId(null);
                          setCryptoStatus("waiting");
                          setError(null);
                        }}
                      >
                        Back
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
          </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    <UnlockSuccess
      open={successOpen}
      onClose={() => {
        setSuccessOpen(false);
        onComplete();
      }}
      amount={successAmount}
      method={successMethod}
    />
    </>
  );
}
