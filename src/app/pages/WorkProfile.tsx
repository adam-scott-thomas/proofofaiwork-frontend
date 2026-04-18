import { Card } from "../components/ui/card";
import { useWorkProfile } from "../../hooks/useApi";
import { dateTime } from "../lib/poaw";

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-[#D8D2C4] bg-white p-5">
      <div className="text-[12px] uppercase tracking-[0.12em] text-[#6B6B66]">{label}</div>
      <div className={`mt-2 text-4xl tracking-tight ${tone}`}>{value}</div>
    </div>
  );
}

export default function WorkProfile() {
  const { data, isLoading } = useWorkProfile();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        Loading work profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-8">
          <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Work profile</div>
          <h1 className="mt-2 text-3xl tracking-tight">Your aggregate AI work profile.</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#5C5C5C]">
            This is the higher-order summary across evaluated work: leadership, execution load, amplification,
            confidence, integrity, and narrative.
          </p>
        </div>
      </header>

      <div className="px-8 py-8">
        {!data ? (
          <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-8 text-[14px] text-[#5C5C5C] shadow-sm">
            No work profile yet. Evaluate one or more projects first.
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Metric
                label="Human Leadership Score"
                value={data.human_leadership_score != null ? `${data.human_leadership_score}` : "—"}
                tone="text-[#315D8A]"
              />
              <Metric
                label="AI Execution Load"
                value={data.ai_execution_load != null ? `${Math.round(data.ai_execution_load * 100)}%` : "—"}
                tone="text-[#A8741A]"
              />
              <Metric
                label="CAI"
                value={data.cai != null ? `${data.cai}` : "—"}
                tone="text-[#2F6B3B]"
              />
            </div>

            <div className="mt-6 grid grid-cols-[1.2fr_0.8fr] gap-6">
              <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
                <div className="text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Narrative</div>
                <div className="mt-3 text-[15px] leading-8 text-[#2A2A28]">
                  {data.narrative || "No narrative generated yet."}
                </div>

                {Array.isArray(data.confidence_rationale) && data.confidence_rationale.length > 0 ? (
                  <>
                    <div className="mt-6 text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Confidence rationale</div>
                    <div className="mt-3 space-y-2">
                      {data.confidence_rationale.map((reason: string, index: number) => (
                        <div key={index} className="rounded-md border border-[#D8D2C4] bg-[#FBF8F1] px-3 py-2 text-[13px] text-[#5C5C5C]">
                          {reason}
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </Card>

              <div className="space-y-4">
                <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
                  <div className="text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Archetype</div>
                  <div className="mt-3 text-[18px] tracking-tight">
                    {data.archetype?.primary || "—"}
                  </div>
                  {Array.isArray(data.archetype?.secondary) && data.archetype.secondary.length > 0 ? (
                    <div className="mt-2 text-[13px] text-[#5C5C5C]">
                      secondary: {data.archetype.secondary.join(", ")}
                    </div>
                  ) : null}
                </Card>

                <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
                  <div className="text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Integrity</div>
                  <div className="mt-3 text-[14px] text-[#2A2A28]">
                    manipulation likelihood: {data.integrity?.manipulation_likelihood || "—"}
                  </div>
                  {Array.isArray(data.integrity?.flags) && data.integrity.flags.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {data.integrity.flags.map((flag: string, index: number) => (
                        <div key={index} className="rounded-md border border-[#D8D2C4] bg-[#FBF8F1] px-3 py-2 text-[13px] text-[#8E3B34]">
                          {flag}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 text-[13px] text-[#5C5C5C]">No integrity flags recorded.</div>
                  )}
                </Card>

                <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
                  <div className="text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Status</div>
                  <div className="mt-3 text-[14px] text-[#2A2A28]">
                    {data.status} • confidence {data.confidence || "—"}
                  </div>
                  <div className="mt-1 text-[12px] text-[#6B6B66]">evaluated {dateTime(data.evaluated_at)}</div>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
