import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useBilling, useBillingCheckout, useBillingSkus } from "../../hooks/useApi";

function listFrom(data: any) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.skus)) return data.skus;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export default function Billing() {
  const { data: entitlements, isLoading: entitlementsLoading } = useBilling();
  const { data: skus, isLoading: skusLoading } = useBillingSkus();
  const checkout = useBillingCheckout();
  const skuList = listFrom(skus);

  if (entitlementsLoading || skusLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#717182]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading billing...
      </div>
    );
  }

  const entitlementList = Array.isArray(entitlements?.entitlements)
    ? entitlements.entitlements
    : Object.entries(entitlements ?? {}).map(([key, value]) => ({ key, value }));

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-7">
          <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Settings</div>
          <h1 className="mt-2 text-3xl tracking-tight">Billing</h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#5C5C5C]">
            Current entitlements and approved checkout options.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 p-8">
        <Card className="border border-[#D8D2C4] bg-white p-5">
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">
            <CheckCircle2 className="h-4 w-4 text-[#1F6A3F]" />
            Entitlements
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {entitlementList.length > 0 ? entitlementList.map((item: any, index: number) => (
              <div key={item.key ?? item.feature ?? index} className="rounded-md border border-[#EAE3CF] bg-[#FBF8F1] px-3 py-2">
                <div className="text-[13px] text-[#161616]">{item.label ?? item.feature ?? item.key}</div>
                <div className="mt-0.5 text-[12px] text-[#6B6B66]">
                  {String(item.status ?? item.value ?? item.enabled ?? "active")}
                </div>
              </div>
            )) : (
              <div className="text-[13px] text-[#6B6B66]">No entitlements reported.</div>
            )}
          </div>
        </Card>

        <Card className="border border-[#D8D2C4] bg-white p-5">
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">
            <CreditCard className="h-4 w-4 text-[#315D8A]" />
            Checkout
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {skuList.length > 0 ? skuList.map((sku: any) => (
              <div key={sku.id ?? sku.sku ?? sku.feature_key} className="rounded-lg border border-[#D8D2C4] bg-[#FBF8F1] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[14px] text-[#161616]">{sku.label ?? sku.name ?? sku.feature_key ?? sku.id}</div>
                    {sku.description ? <div className="mt-1 text-[12px] leading-relaxed text-[#6B6B66]">{sku.description}</div> : null}
                  </div>
                  <div className="shrink-0 text-[13px] text-[#161616]">
                    {sku.price_label ?? (sku.amount_cents != null ? `$${(Number(sku.amount_cents) / 100).toFixed(2)}` : "")}
                  </div>
                </div>
                <Button
                  className="mt-4 w-full"
                  disabled={checkout.isPending}
                  onClick={() =>
                    checkout.mutate(
                      { sku: sku.id ?? sku.sku ?? sku.feature_key },
                      {
                        onSuccess: (result: any) => {
                          if (result?.checkout_url) window.location.href = result.checkout_url;
                          else toast.success("Checkout started");
                        },
                        onError: (error: any) => toast.error(error?.message ?? "Checkout failed"),
                      },
                    )
                  }
                >
                  {checkout.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Checkout
                </Button>
              </div>
            )) : (
              <div className="text-[13px] text-[#6B6B66]">No checkout SKUs available.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
