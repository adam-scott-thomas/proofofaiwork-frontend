import { useMemo, useState } from "react";
import { Globe } from "lucide-react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../components/ui/card";
import { apiFetch } from "../../lib/api";

export default function Explore() {
  const [signalFilter, setSignalFilter] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["directory-public", signalFilter],
    queryFn: () => apiFetch<any>(`/directory${signalFilter ? `?signal=${encodeURIComponent(signalFilter)}` : ""}`),
  });

  const entries = Array.isArray(data?.entries) ? data.entries : [];
  const clusters = data?.signal_clusters ?? {};
  const filterKeys = useMemo(() => Object.keys(clusters), [clusters]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        Loading directory...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-[#315D8A]" />
            <div>
              <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Directory</div>
              <h1 className="mt-1 text-3xl tracking-tight">Browse published proof pages.</h1>
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[#5C5C5C]">
            This is the public browse layer. Once a proof page is published and opted in, it should show up here.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-8 py-8">
        {data?.enabled === false ? (
          <Card className="border border-[#D8D2C4] bg-white p-8 shadow-sm">
            <div className="text-[18px] tracking-tight">Directory not open yet</div>
            <div className="mt-2 text-[14px] text-[#5C5C5C]">
              {data?.message || "The directory opens after enough proof pages have been published."}
            </div>
          </Card>
        ) : (
          <>
            {filterKeys.length > 0 ? (
              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  onClick={() => setSignalFilter("")}
                  className={`rounded-full border px-3 py-1.5 text-[12px] ${
                    !signalFilter ? "border-[#315D8A] bg-[#315D8A] text-white" : "border-[#D8D2C4] bg-white text-[#5C5C5C]"
                  }`}
                >
                  All
                </button>
                {filterKeys.map((signal) => (
                  <button
                    key={signal}
                    onClick={() => setSignalFilter(signal)}
                    className={`rounded-full border px-3 py-1.5 text-[12px] ${
                      signalFilter === signal ? "border-[#315D8A] bg-[#315D8A] text-white" : "border-[#D8D2C4] bg-white text-[#5C5C5C]"
                    }`}
                  >
                    {signal} ({clusters[signal]})
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mb-4 text-[13px] text-[#6B6B66]">
              {data?.total_published ?? entries.length} published proof pages
            </div>

            <div className="grid grid-cols-2 gap-4">
              {entries.map((entry: any) => (
                <Link key={entry.slug ?? entry.public_token} to={entry.url} className="block">
                  <Card className="h-full border border-[#D8D2C4] bg-white p-6 shadow-sm transition-colors hover:bg-[#FBF8F1]">
                    <div className="text-[18px] tracking-tight">{entry.headline || "Untitled proof page"}</div>
                    <div className="mt-2 text-[14px] leading-7 text-[#5C5C5C]">
                      {entry.summary || "No summary provided."}
                    </div>
                    {Array.isArray(entry.signals) && entry.signals.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {entry.signals.slice(0, 4).map((signal: any, index: number) => (
                          <div key={`${signal.id ?? signal.label ?? index}`} className="rounded-full border border-[#D8D2C4] bg-[#FBF8F1] px-3 py-1 text-[12px] text-[#5C5C5C]">
                            {signal.label ?? signal.id ?? String(signal)}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </Card>
                </Link>
              ))}
            </div>

            {entries.length === 0 ? (
              <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-8 text-[14px] text-[#5C5C5C] shadow-sm">
                No proof pages match this filter.
              </Card>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
