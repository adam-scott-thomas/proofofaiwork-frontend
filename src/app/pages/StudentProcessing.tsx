import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Loader2, CheckCircle2, XCircle, User, Bot } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { Card, CardContent } from "../components/ui/card";

type Status =
  | "pending" | "parsing" | "normalizing" | "gating"
  | "evaluating" | "aggregating" | "complete" | "partial" | "failed";

interface LiveObservation {
  dimension: string;
  score: number | null;
  label: string | null;
  summary: string | null;
  skipped: boolean;
}

const STEP_LABELS: Record<string, string> = {
  pending: "Queued",
  parsing: "Reading your conversation",
  normalizing: "Structuring the data",
  gating: "Checking what we can evaluate",
  evaluating: "Scoring your work",
  aggregating: "Compiling results",
  complete: "Done!",
  partial: "Done!",
};

const DIMENSION_LABELS: Record<string, { label: string; desc: string; side: "you" | "ai" }> = {
  clarity: { label: "Clarity", desc: "How clearly you stated what you needed", side: "you" },
  context: { label: "Context", desc: "How well you framed the problem", side: "you" },
  constraint_quality: { label: "Constraints", desc: "How precisely you set boundaries", side: "you" },
  iteration_discipline: { label: "Iteration", desc: "How you refined AI output", side: "you" },
  verification_habit: { label: "Verification", desc: "Whether you checked AI's work", side: "ai" },
  output_judgment: { label: "Judgment", desc: "Your accept/reject decisions", side: "ai" },
  workflow_efficiency: { label: "Workflow", desc: "How you decomposed the task", side: "ai" },
  risk_awareness: { label: "Risk awareness", desc: "Attention to edge cases", side: "ai" },
};

function scoreColor(score: number | null): string {
  if (score === null) return "bg-gray-200";
  if (score >= 0.7) return "bg-emerald-500";
  if (score >= 0.4) return "bg-amber-400";
  return "bg-red-400";
}

export default function StudentProcessing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [observations, setObservations] = useState<LiveObservation[]>([]);
  const [newDims, setNewDims] = useState<Set<string>>(new Set());

  const { data: assessment } = useQuery({
    queryKey: ["assessment", id],
    queryFn: () => apiFetch<any>(`/assessments/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      if (s === "complete" || s === "partial" || s === "failed") return false;
      return 3000;
    },
  });

  // Poll live observations
  const poll = useCallback(async () => {
    if (!id) return;
    try {
      const data = await apiFetch<{ observations: LiveObservation[] }>(`/assessments/${id}/live-observations`);
      setObservations((prev) => {
        if (data.observations.length > prev.length) {
          const newKeys = new Set(data.observations.slice(prev.length).map((o) => o.dimension));
          setNewDims(newKeys);
          setTimeout(() => setNewDims(new Set()), 2000);
        }
        return data.observations;
      });
    } catch { /* ignore */ }
  }, [id]);

  const status: Status = assessment?.status ?? "pending";
  const isEvaluating = ["evaluating", "aggregating"].includes(status);
  const isDone = status === "complete" || status === "partial";

  useEffect(() => {
    if (!isEvaluating && !isDone) return;
    poll();
    const interval = setInterval(poll, 2500);
    return () => clearInterval(interval);
  }, [isEvaluating, isDone, poll]);

  // Redirect to results when done
  useEffect(() => {
    if (isDone) {
      const timer = setTimeout(() => navigate(`/student/results/${id}`, { replace: true }), 2500);
      return () => clearTimeout(timer);
    }
  }, [isDone, id, navigate]);

  if (status === "failed") {
    return (
      <div className="py-12 text-center">
        <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h1 className="mb-2 text-xl font-medium text-[#030213]">Evaluation failed</h1>
        <p className="text-[14px] text-[#717182]">
          {assessment?.failure_reason || "Something went wrong. Please try uploading again."}
        </p>
      </div>
    );
  }

  const yourDims = observations.filter((o) => DIMENSION_LABELS[o.dimension]?.side === "you");
  const aiDims = observations.filter((o) => DIMENSION_LABELS[o.dimension]?.side === "ai");

  return (
    <div>
      {/* Status header */}
      <div className="mb-8 text-center">
        {isDone ? (
          <>
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
            <h1 className="text-xl font-medium text-[#030213]">Analysis complete</h1>
            <p className="mt-1 text-[13px] text-[#717182]">Taking you to your results...</p>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-blue-500" />
            <h1 className="text-xl font-medium text-[#030213]">
              {STEP_LABELS[status] || "Processing..."}
            </h1>
            <p className="mt-1 text-[13px] text-[#717182]">
              This usually takes 30–60 seconds
            </p>
          </>
        )}
      </div>

      {/* Dimension scores (appear during evaluation) */}
      {observations.length > 0 && (
        <div className="space-y-6">
          {/* Your skills */}
          {yourDims.length > 0 && (
            <Card className="border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <h2 className="text-[14px] font-medium text-[#030213]">Your contribution</h2>
                </div>
                <div className="space-y-3">
                  {yourDims.map((obs) => {
                    const dim = DIMENSION_LABELS[obs.dimension];
                    const isNew = newDims.has(obs.dimension);
                    return (
                      <div
                        key={obs.dimension}
                        className={`rounded-lg p-3 transition-all duration-700 ${
                          isNew ? "bg-blue-50 ring-1 ring-blue-200" : "bg-[#FAFAFA]"
                        }`}
                      >
                        <div className="mb-1.5 flex items-baseline justify-between">
                          <span className="text-[13px] font-medium text-[#030213]">
                            {dim?.label ?? obs.dimension}
                          </span>
                          {obs.score !== null && !obs.skipped && (
                            <span className={`text-[13px] font-medium ${
                              obs.score >= 0.7 ? "text-emerald-600" : obs.score >= 0.4 ? "text-amber-600" : "text-red-600"
                            }`}>
                              {Math.round(obs.score * 100)}%
                            </span>
                          )}
                        </div>
                        {obs.score !== null && !obs.skipped && (
                          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${scoreColor(obs.score)}`}
                              style={{ width: `${Math.round(obs.score * 100)}%` }}
                            />
                          </div>
                        )}
                        <p className="mt-1 text-[11px] text-[#717182]">{dim?.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI collaboration */}
          {aiDims.length > 0 && (
            <Card className="border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-purple-600" />
                  <h2 className="text-[14px] font-medium text-[#030213]">How you used AI</h2>
                </div>
                <div className="space-y-3">
                  {aiDims.map((obs) => {
                    const dim = DIMENSION_LABELS[obs.dimension];
                    const isNew = newDims.has(obs.dimension);
                    return (
                      <div
                        key={obs.dimension}
                        className={`rounded-lg p-3 transition-all duration-700 ${
                          isNew ? "bg-purple-50 ring-1 ring-purple-200" : "bg-[#FAFAFA]"
                        }`}
                      >
                        <div className="mb-1.5 flex items-baseline justify-between">
                          <span className="text-[13px] font-medium text-[#030213]">
                            {dim?.label ?? obs.dimension}
                          </span>
                          {obs.score !== null && !obs.skipped && (
                            <span className={`text-[13px] font-medium ${
                              obs.score >= 0.7 ? "text-emerald-600" : obs.score >= 0.4 ? "text-amber-600" : "text-red-600"
                            }`}>
                              {Math.round(obs.score * 100)}%
                            </span>
                          )}
                        </div>
                        {obs.score !== null && !obs.skipped && (
                          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${scoreColor(obs.score)}`}
                              style={{ width: `${Math.round(obs.score * 100)}%` }}
                            />
                          </div>
                        )}
                        <p className="mt-1 text-[11px] text-[#717182]">{dim?.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
