import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  User,
  Bot,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { Card, CardContent } from "../components/ui/card";

// The 8 dimensions, grouped
const HUMAN_DIMENSIONS = [
  { key: "clarity", label: "Clarity", desc: "Stating objectives clearly" },
  { key: "context", label: "Context", desc: "Framing the problem" },
  { key: "constraint_quality", label: "Constraints", desc: "Setting precise bounds" },
  { key: "iteration_discipline", label: "Iteration", desc: "Refining with feedback" },
];

const AI_DIMENSIONS = [
  { key: "verification_habit", label: "Verification", desc: "Checking AI output" },
  { key: "output_judgment", label: "Judgment", desc: "Accept/reject decisions" },
  { key: "workflow_efficiency", label: "Workflow", desc: "Task decomposition" },
  { key: "risk_awareness", label: "Risk Awareness", desc: "Security & edge cases" },
];

type AssessmentStatus =
  | "pending"
  | "parsing"
  | "normalizing"
  | "gating"
  | "evaluating"
  | "aggregating"
  | "complete"
  | "partial"
  | "failed"
  | "stale";

interface LiveObservation {
  dimension: string;
  score: number | null;
  label: string | null;
  summary: string | null;
  confidence_label: string | null;
  skipped: boolean;
  skip_reason: string | null;
}

interface LiveData {
  status: string;
  total_dimensions: number;
  observations: LiveObservation[];
}

function scoreColor(score: number | null): string {
  if (score === null) return "bg-gray-200";
  if (score >= 0.7) return "bg-emerald-500";
  if (score >= 0.4) return "bg-amber-400";
  return "bg-red-400";
}

function DimensionBar({
  dim,
  observation,
  isNew,
}: {
  dim: { key: string; label: string; desc: string };
  observation: LiveObservation | undefined;
  isNew: boolean;
}) {
  const score = observation?.score ?? null;
  const skipped = observation?.skipped ?? false;
  const evaluated = observation !== undefined;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-700 ${
        isNew
          ? "bg-blue-50 ring-2 ring-blue-300"
          : evaluated
          ? "bg-white"
          : "bg-gray-50"
      }`}
    >
      <div className="w-28 flex-shrink-0">
        <p className={`text-sm font-semibold ${evaluated ? "text-foreground" : "text-gray-400"}`}>
          {dim.label}
        </p>
        <p className="text-xs text-muted-foreground">{dim.desc}</p>
      </div>

      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        {evaluated && !skipped && score !== null && (
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${scoreColor(score)}`}
            style={{ width: `${Math.round(score * 100)}%` }}
          />
        )}
      </div>

      <div className="w-12 text-right flex-shrink-0">
        {skipped ? (
          <span className="text-xs text-gray-400">skip</span>
        ) : evaluated && score !== null ? (
          <span
            className={`text-sm font-bold ${
              score >= 0.7
                ? "text-emerald-600"
                : score >= 0.4
                ? "text-amber-600"
                : "text-red-600"
            }`}
          >
            {Math.round(score * 100)}%
          </span>
        ) : (
          <Loader2 className="w-4 h-4 text-gray-300 animate-spin ml-auto" />
        )}
      </div>
    </div>
  );
}

function LiveDimensions({
  assessmentId,
  isEvaluating,
}: {
  assessmentId: string;
  isEvaluating: boolean;
}) {
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [newDims, setNewDims] = useState<Set<string>>(new Set());

  const poll = useCallback(async () => {
    try {
      const data = await apiFetch<LiveData>(`/assessments/${assessmentId}/live-observations`);
      setLiveData((prev) => {
        const prevCount = prev?.observations.length ?? 0;
        const newCount = data.observations.length;
        if (newCount > prevCount) {
          const newKeys = new Set(
            data.observations.slice(prevCount).map((o) => o.dimension)
          );
          setNewDims(newKeys);
          setTimeout(() => setNewDims(new Set()), 2000);
        }
        return data;
      });
    } catch {
      // ignore polling errors
    }
  }, [assessmentId]);

  useEffect(() => {
    if (!isEvaluating) return;
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [isEvaluating, poll]);

  // Poll once on mount for non-evaluating stages (aggregating/complete)
  useEffect(() => {
    if (!isEvaluating) poll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const observationMap = new Map(
    (liveData?.observations ?? []).map((o) => [o.dimension, o])
  );

  const humanScores = HUMAN_DIMENSIONS
    .map((d) => observationMap.get(d.key)?.score)
    .filter((s): s is number => s !== null && s !== undefined);
  const aiScores = AI_DIMENSIONS
    .map((d) => observationMap.get(d.key)?.score)
    .filter((s): s is number => s !== null && s !== undefined);

  const humanAvg =
    humanScores.length > 0
      ? Math.round((humanScores.reduce((a, b) => a + b, 0) / humanScores.length) * 100)
      : null;
  const aiAvg =
    aiScores.length > 0
      ? Math.round((aiScores.reduce((a, b) => a + b, 0) / aiScores.length) * 100)
      : null;

  const evaluated = liveData?.observations.length ?? 0;
  const total = liveData?.total_dimensions ?? 8;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {evaluated} / {total} dimensions evaluated
        </p>
        {evaluated > 0 && (
          <div className="flex gap-4 text-sm">
            {humanAvg !== null && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span className="font-semibold">{humanAvg}%</span>
              </span>
            )}
            {aiAvg !== null && (
              <span className="flex items-center gap-1">
                <Bot className="w-3.5 h-3.5" />
                <span className="font-semibold">{aiAvg}%</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Human skills */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Your Prompting Skills
            {humanAvg !== null && (
              <span className="ml-2 text-blue-600 normal-case">{humanAvg}%</span>
            )}
          </h4>
        </div>
        <div className="space-y-2">
          {HUMAN_DIMENSIONS.map((dim) => (
            <DimensionBar
              key={dim.key}
              dim={dim}
              observation={observationMap.get(dim.key)}
              isNew={newDims.has(dim.key)}
            />
          ))}
        </div>
      </div>

      {/* AI collaboration */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-purple-600" />
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            AI Collaboration Quality
            {aiAvg !== null && (
              <span className="ml-2 text-purple-600 normal-case">{aiAvg}%</span>
            )}
          </h4>
        </div>
        <div className="space-y-2">
          {AI_DIMENSIONS.map((dim) => (
            <DimensionBar
              key={dim.key}
              dim={dim}
              observation={observationMap.get(dim.key)}
              isNew={newDims.has(dim.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const PIPELINE_STEPS: Array<{ status: AssessmentStatus; label: string; description: string }> = [
  { status: "pending", label: "Pending", description: "Queued for processing" },
  { status: "parsing", label: "Parsing", description: "Reading and structuring input files" },
  { status: "normalizing", label: "Normalizing", description: "Extracting conversation structure" },
  { status: "gating", label: "Gating", description: "Determining assessment scope" },
];

function ProcessingSteps({ currentStatus }: { currentStatus: AssessmentStatus }) {
  const currentIndex = PIPELINE_STEPS.findIndex((s) => s.status === currentStatus);

  return (
    <div className="space-y-3">
      {PIPELINE_STEPS.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div
            key={step.status}
            className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${
              isCurrent
                ? "bg-blue-50 border-2 border-blue-200"
                : isComplete
                ? "bg-green-50 border border-green-200"
                : "bg-gray-50 border border-gray-200"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {isComplete && (
                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}
              {isCurrent && <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />}
              {!isComplete && !isCurrent && (
                <div className="w-6 h-6 rounded-full bg-gray-300" />
              )}
            </div>
            <div>
              <h4
                className={`font-semibold ${
                  isCurrent
                    ? "text-blue-900"
                    : isComplete
                    ? "text-green-900"
                    : "text-gray-500"
                }`}
              >
                {step.label}
              </h4>
              <p
                className={`text-sm ${
                  isCurrent
                    ? "text-blue-700"
                    : isComplete
                    ? "text-green-700"
                    : "text-gray-500"
                }`}
              >
                {step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Processing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: assessment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["assessment", id],
    queryFn: () => apiFetch<any>(`/assessments/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "complete" || status === "partial" || status === "failed") return false;
      return 3000;
    },
  });

  useEffect(() => {
    if (assessment) {
      if (assessment.status === "complete" || assessment.status === "partial") {
        const timer = setTimeout(() => {
          navigate(`/assessment/${id}/results`, { replace: true });
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [assessment, id, navigate]);

  const BackLink = () => (
    <Link
      to="/"
      className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Dashboard
    </Link>
  );

  if (isLoading || !assessment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-6 py-4">
            <BackLink />
          </div>
        </header>
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading assessment...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-6 py-4">
            <BackLink />
          </div>
        </header>
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Assessment Not Found</h1>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : "This assessment could not be loaded."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const status: AssessmentStatus = assessment.status;
  const isEvaluatingOrLater = ["evaluating", "aggregating", "complete", "partial"].includes(status);
  const isDone = status === "complete" || status === "partial";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <BackLink />
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3">
              {isDone ? "Assessment Complete" : "Processing Your Assessment"}
            </h1>
            <p className="text-muted-foreground">
              Assessment ID: {assessment.id.slice(0, 8)}...
            </p>
          </div>

          {/* Live dimensions — evaluating and beyond */}
          {isEvaluatingOrLater && (
            <Card className="shadow-xl border border-gray-200 mb-8">
              <CardContent className="p-8">
                <LiveDimensions
                  assessmentId={assessment.id}
                  isEvaluating={status === "evaluating"}
                />
                {isDone && (
                  <p className="text-center text-sm text-muted-foreground mt-6">
                    Redirecting to full results...
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pipeline steps — before evaluation */}
          {!isEvaluatingOrLater && (
            <Card className="shadow-xl border border-gray-200 mb-8">
              <CardContent className="p-12">
                <div className="flex flex-col items-center mb-8">
                  <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
                  <h2 className="text-2xl font-semibold text-foreground mb-2">
                    Preparing Assessment
                  </h2>
                </div>
                <ProcessingSteps currentStatus={status} />
              </CardContent>
            </Card>
          )}

          {/* Evaluating / aggregating indicator */}
          {status === "evaluating" && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Evaluating dimensions...</span>
              </div>
            </div>
          )}
          {status === "aggregating" && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Compiling final profile...</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
