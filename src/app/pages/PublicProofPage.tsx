import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Shield, Calendar, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";

const DIMENSION_LABELS: Record<string, { label: string; desc: string }> = {
  clarity: { label: "Clarity of direction", desc: "How clearly the user stated what they needed" },
  context: { label: "Problem framing", desc: "Background and context provided" },
  constraint_quality: { label: "Setting constraints", desc: "Boundaries and requirements set" },
  iteration_discipline: { label: "Iterating on output", desc: "How the user refined AI output" },
  verification_habit: { label: "Checking AI's work", desc: "Testing and validating output" },
  output_judgment: { label: "Accept/reject decisions", desc: "Evaluating output quality" },
  workflow_efficiency: { label: "Task decomposition", desc: "Breaking work into steps" },
  risk_awareness: { label: "Edge case awareness", desc: "Considering what could go wrong" },
};

function scoreColor(score: number): string {
  if (score >= 0.7) return "bg-emerald-500";
  if (score >= 0.4) return "bg-amber-400";
  return "bg-red-400";
}

function scoreTextColor(score: number): string {
  if (score >= 0.7) return "text-emerald-600";
  if (score >= 0.4) return "text-amber-600";
  return "text-red-600";
}

export default function PublicProofPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-proof", slug],
    queryFn: async () => {
      const res = await fetch(`/api/v1/p/${slug}`);
      if (!res.ok) throw new Error("Proof page not found");
      return res.json();
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <h1 className="text-xl font-medium">Proof page not found</h1>
        <p className="text-sm text-gray-500">This link may have expired or been unpublished.</p>
      </div>
    );
  }

  const observations = data.observations || [];
  const trustPanel = data.trust_panel || {};
  const headline = data.headline || "AI Work Report";
  const publishedAt = data.published_at;

  // Split observations into scored and skipped
  const scored = observations.filter((o: any) => o.score !== null && !o.skipped);
  const avgScore = scored.length > 0
    ? scored.reduce((sum: number, o: any) => sum + o.score, 0) / scored.length
    : 0;

  // Group into "your direction" vs "AI collaboration"
  const directionDims = ["clarity", "context", "constraint_quality", "iteration_discipline"];
  const collabDims = ["verification_habit", "output_judgment", "workflow_efficiency", "risk_awareness"];

  const directionObs = observations.filter((o: any) => directionDims.includes(o.dimension));
  const collabObs = observations.filter((o: any) => collabDims.includes(o.dimension));

  // Strengths and weaknesses
  const strengths = scored.filter((o: any) => o.score >= 0.7);
  const weaknesses = scored.filter((o: any) => o.score < 0.4);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="mx-auto max-w-3xl px-8 py-6">
          <div className="mb-3 flex items-center gap-2 text-[13px] text-[#717182]">
            <span>Proof of AI Work</span>
            <span>-</span>
            <span>Student Report</span>
          </div>
          <h1 className="mb-2 text-2xl tracking-tight">{headline}</h1>
          <div className="flex items-center gap-4">
            {publishedAt && (
              <div className="flex items-center gap-2 text-[13px] text-[#717182]">
                <Calendar className="h-4 w-4" />
                {new Date(publishedAt).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                })}
              </div>
            )}
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              <Shield className="mr-1 h-3 w-3" />
              {trustPanel.dimensions_evaluated || scored.length} of 8 dimensions evaluated
            </Badge>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-8 py-10">
        {/* Overall Score */}
        <Card className="mb-8 border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm text-center">
          <div className="text-[13px] uppercase tracking-wider text-[#717182] mb-2">Overall Score</div>
          <div className={`text-6xl font-bold mb-1 ${scoreTextColor(avgScore)}`}>
            {Math.round(avgScore * 100)}%
          </div>
          <div className="text-[13px] text-[#717182]">
            across {scored.length} evaluated dimension{scored.length !== 1 ? "s" : ""}
          </div>
        </Card>

        {/* Direction Dimensions */}
        {directionObs.length > 0 && (
          <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-[14px] font-medium text-[#030213]">How the student directed the AI</h2>
            <div className="space-y-4">
              {directionObs.map((obs: any) => {
                const dim = DIMENSION_LABELS[obs.dimension];
                const score = obs.score ?? 0;
                const skipped = obs.skipped;
                return (
                  <div key={obs.dimension}>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <div>
                        <span className="text-[13px] font-medium text-[#030213]">{dim?.label ?? obs.dimension}</span>
                        <span className="ml-2 text-[11px] text-[#717182]">{dim?.desc}</span>
                      </div>
                      {!skipped && (
                        <span className={`text-[13px] font-medium ${scoreTextColor(score)}`}>
                          {Math.round(score * 100)}%
                        </span>
                      )}
                    </div>
                    {!skipped && (
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                        <div className={`h-full rounded-full ${scoreColor(score)}`} style={{ width: `${Math.round(score * 100)}%` }} />
                      </div>
                    )}
                    {obs.summary && (
                      <p className="mt-1 text-[11px] text-[#717182]">{obs.summary}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Collaboration Dimensions */}
        {collabObs.length > 0 && (
          <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-[14px] font-medium text-[#030213]">How the student used AI</h2>
            <div className="space-y-4">
              {collabObs.map((obs: any) => {
                const dim = DIMENSION_LABELS[obs.dimension];
                const score = obs.score ?? 0;
                const skipped = obs.skipped;
                return (
                  <div key={obs.dimension}>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <div>
                        <span className="text-[13px] font-medium text-[#030213]">{dim?.label ?? obs.dimension}</span>
                        <span className="ml-2 text-[11px] text-[#717182]">{dim?.desc}</span>
                      </div>
                      {!skipped && (
                        <span className={`text-[13px] font-medium ${scoreTextColor(score)}`}>
                          {Math.round(score * 100)}%
                        </span>
                      )}
                    </div>
                    {!skipped && (
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                        <div className={`h-full rounded-full ${scoreColor(score)}`} style={{ width: `${Math.round(score * 100)}%` }} />
                      </div>
                    )}
                    {obs.summary && (
                      <p className="mt-1 text-[11px] text-[#717182]">{obs.summary}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Strengths & Weaknesses */}
        {(strengths.length > 0 || weaknesses.length > 0) && (
          <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
            {strengths.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-[13px] font-medium text-emerald-700">Strengths</h3>
                <ul className="space-y-1">
                  {strengths.map((o: any) => (
                    <li key={o.dimension} className="text-[13px] text-[#3A3A3A]">
                      <span className="font-medium">{DIMENSION_LABELS[o.dimension]?.label ?? o.dimension}:</span>{" "}
                      {o.summary}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {weaknesses.length > 0 && (
              <div>
                <h3 className="mb-2 text-[13px] font-medium text-red-700">Areas for growth</h3>
                <ul className="space-y-1">
                  {weaknesses.map((o: any) => (
                    <li key={o.dimension} className="text-[13px] text-[#3A3A3A]">
                      <span className="font-medium">{DIMENSION_LABELS[o.dimension]?.label ?? o.dimension}:</span>{" "}
                      {o.summary}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        {/* Sample Size / Trust */}
        <Card className="border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="mb-1 text-[14px] font-medium text-blue-900">Verification</h3>
              <p className="text-[13px] text-blue-800">
                This report was generated by Proof of AI Work from uploaded conversation data.
                {trustPanel.dimensions_evaluated > 0 && (
                  <> {trustPanel.dimensions_evaluated} dimensions were evaluated using AI-assisted scoring.</>
                )}
              </p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-10 border-t border-[rgba(0,0,0,0.08)] pt-6 text-center text-[13px] text-[#717182]">
          ProofofAIWork - proofofaiwork.com
        </div>
      </div>
    </div>
  );
}
