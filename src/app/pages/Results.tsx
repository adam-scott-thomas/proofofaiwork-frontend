import { useParams, Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Download,
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

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

const PROCESSING_STATUSES: AssessmentStatus[] = [
  "pending",
  "parsing",
  "normalizing",
  "gating",
  "evaluating",
  "aggregating",
];

const STATUS_CONFIG: Record<
  AssessmentStatus,
  { icon: React.ElementType; color: string; label: string; spinning: boolean }
> = {
  pending: { icon: Clock, color: "bg-gray-100 text-gray-700 border-gray-200", label: "Pending", spinning: false },
  parsing: { icon: Loader2, color: "bg-blue-100 text-blue-700 border-blue-200", label: "Parsing", spinning: true },
  normalizing: { icon: Loader2, color: "bg-blue-100 text-blue-700 border-blue-200", label: "Normalizing", spinning: true },
  gating: { icon: Loader2, color: "bg-blue-100 text-blue-700 border-blue-200", label: "Gating", spinning: true },
  evaluating: { icon: Loader2, color: "bg-blue-100 text-blue-700 border-blue-200", label: "Evaluating", spinning: true },
  aggregating: { icon: Loader2, color: "bg-blue-100 text-blue-700 border-blue-200", label: "Aggregating", spinning: true },
  partial: { icon: AlertCircle, color: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Partial", spinning: false },
  complete: { icon: CheckCircle2, color: "bg-green-100 text-green-700 border-green-200", label: "Complete", spinning: false },
  failed: { icon: XCircle, color: "bg-red-100 text-red-700 border-red-200", label: "Failed", spinning: false },
  stale: { icon: AlertCircle, color: "bg-gray-100 text-gray-700 border-gray-200", label: "Stale", spinning: false },
};

function scoreColor(score: number): string {
  if (score >= 0.7) return "bg-emerald-500";
  if (score >= 0.4) return "bg-amber-400";
  return "bg-red-400";
}

function scoreTextColor(score: number): string {
  if (score >= 0.7) return "text-emerald-700";
  if (score >= 0.4) return "text-amber-700";
  return "text-red-700";
}

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: assessment,
    isLoading: assessmentLoading,
    error: assessmentError,
  } = useQuery({
    queryKey: ["assessment", id],
    queryFn: () => apiFetch<any>(`/assessments/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "complete" || status === "partial" || status === "failed") return false;
      return 5000;
    },
  });

  const isComplete = assessment?.status === "complete" || assessment?.status === "partial";

  const {
    data: results,
    isLoading: resultsLoading,
    error: resultsError,
  } = useQuery({
    queryKey: ["assessment-results", id],
    queryFn: () => apiFetch<any>(`/assessments/${id}/results`),
    enabled: !!id && isComplete,
  });

  const downloadMutation = useMutation({
    mutationFn: async ({ format }: { format: "json" | "pdf" }) => {
      const blob = await fetch(`/api/v1/assessments/${id}/download?format=${format}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("poaw-token") ?? ""}`,
        },
      }).then((r) => r.blob());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `assessment-${id?.slice(0, 8)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  const BackLink = () => (
    <Link
      to="/"
      className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Dashboard
    </Link>
  );

  if (assessmentLoading || !assessment) {
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

  if (assessmentError || resultsError) {
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
              {assessmentError instanceof Error
                ? assessmentError.message
                : "This assessment could not be loaded."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const status: AssessmentStatus = assessment.status;
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.stale;
  const StatusIcon = config.icon;
  const isProcessing = PROCESSING_STATUSES.includes(status);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <BackLink />
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Assessment Results</h1>
            <p className="text-muted-foreground">
              Assessment ID: {assessment.id.slice(0, 8)}...
            </p>
          </div>

          {/* Status Badge */}
          <div className={`rounded-2xl border p-6 ${config.color}`}>
            <div className="flex items-center gap-3">
              <StatusIcon className={`w-6 h-6 ${config.spinning ? "animate-spin" : ""}`} />
              <div>
                <p className="font-semibold">Status: {config.label}</p>
                {assessment.completed_at && (
                  <p className="text-sm opacity-80">
                    Completed: {new Date(assessment.completed_at).toLocaleString()}
                  </p>
                )}
                {assessment.started_at && !assessment.completed_at && (
                  <p className="text-sm opacity-80">
                    Started: {new Date(assessment.started_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* In progress */}
          {isProcessing && (
            <Card className="mt-6 border border-gray-200">
              <CardContent className="p-8 text-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Assessment in Progress
                </h2>
                <p className="text-muted-foreground mb-4">
                  Status: <span className="capitalize">{status}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  This page will automatically update when the assessment is complete.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Failed */}
          {status === "failed" && (
            <Card className="mt-6 border border-red-200">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <XCircle className="w-8 h-8 text-destructive" />
                  <h2 className="text-xl font-semibold text-foreground">Assessment Failed</h2>
                </div>
                {assessment.failure_reason && (
                  <p className="text-destructive mb-4">{assessment.failure_reason}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Please try uploading your file again or contact support if the issue persists.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Uploaded Files */}
          {assessment.uploads && assessment.uploads.length > 0 && (
            <Card className="mt-6 border border-gray-200">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Uploaded Files</h2>
                <div className="space-y-3">
                  {assessment.uploads.map((upload: any) => (
                    <div
                      key={upload.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <FileText className="w-8 h-8 text-gray-400" />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{upload.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(upload.file_size_bytes / 1024 / 1024).toFixed(2)} MB •{" "}
                          {upload.file_type.toUpperCase()}
                        </p>
                      </div>
                      {upload.evidence_class && (
                        <Badge variant="secondary">Class {upload.evidence_class}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full results */}
          {isComplete && results && !resultsLoading && (
            <>
              {/* Overall Confidence */}
              <Card className="mt-6 border border-gray-200">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                      Overall Confidence
                    </h2>
                    {results.overall_confidence && (
                      <div
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-semibold ${
                          results.overall_confidence === "high"
                            ? "bg-green-100 text-green-700"
                            : results.overall_confidence === "moderate"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {results.overall_confidence === "high" && <CheckCircle2 className="w-5 h-5" />}
                        {results.overall_confidence === "moderate" && <AlertCircle className="w-5 h-5" />}
                        {results.overall_confidence === "low" && <XCircle className="w-5 h-5" />}
                        <span className="capitalize">{results.overall_confidence} Confidence</span>
                      </div>
                    )}
                    {results.overall_confidence_score != null && (
                      <p className="text-3xl font-bold text-foreground mt-4">
                        {Math.round(results.overall_confidence_score * 100)}%
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Dimensions Evaluated</p>
                      <p className="text-2xl font-bold text-foreground">
                        {results.dimensions_evaluated ?? 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Dimensions Skipped</p>
                      <p className="text-2xl font-bold text-foreground">
                        {results.dimensions_skipped ?? 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Observations with score bars */}
              {results.observations && results.observations.length > 0 && (
                <Card className="mt-6 border border-gray-200">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                      Detailed Observations
                    </h2>
                    <div className="space-y-4">
                      {results.observations.map((obs: any, index: number) => (
                        <div
                          key={index}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-foreground capitalize">
                              {obs.dimension.replace(/_/g, " ")}
                            </h3>
                            {obs.label && (
                              <div
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium ${
                                  obs.label === "strong"
                                    ? "bg-green-100 text-green-700"
                                    : obs.label === "mixed"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {obs.label === "strong" && <TrendingUp className="w-4 h-4" />}
                                {obs.label === "mixed" && <Minus className="w-4 h-4" />}
                                {obs.label === "weak" && <TrendingDown className="w-4 h-4" />}
                                <span className="capitalize">{obs.label}</span>
                              </div>
                            )}
                          </div>

                          {/* Score bar */}
                          {obs.score != null && !obs.skipped && (
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${scoreColor(obs.score)}`}
                                  style={{ width: `${Math.round(obs.score * 100)}%` }}
                                />
                              </div>
                              <span className={`text-sm font-bold w-10 text-right ${scoreTextColor(obs.score)}`}>
                                {Math.round(obs.score * 100)}%
                              </span>
                            </div>
                          )}

                          {obs.summary && (
                            <p className="text-sm text-muted-foreground mb-1">{obs.summary}</p>
                          )}
                          {obs.confidence_label && (
                            <p className="text-xs text-muted-foreground">
                              Confidence: <span className="capitalize">{obs.confidence_label}</span>
                            </p>
                          )}
                          {obs.skipped && obs.skip_reason && (
                            <p className="text-sm text-muted-foreground italic">
                              Skipped: {obs.skip_reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Signals */}
              {results.signals && results.signals.length > 0 && (
                <Card className="mt-6 border border-border">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-1">
                      Your AI Work Style
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Patterns derived from how you work with AI
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {results.signals.map((signal: any, i: number) => (
                        <div
                          key={i}
                          className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-foreground"
                        >
                          {typeof signal === "string" ? signal : signal.label ?? signal.key ?? JSON.stringify(signal)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Strengths */}
              {results.strengths && results.strengths.length > 0 && (
                <Card className="mt-6 border border-gray-200">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Strengths
                    </h2>
                    <ul className="space-y-2">
                      {results.strengths.map((strength: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-foreground">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Weaknesses */}
              {results.weaknesses && results.weaknesses.length > 0 && (
                <Card className="mt-6 border border-gray-200">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-destructive" />
                      Areas for Growth
                    </h2>
                    <ul className="space-y-2">
                      {results.weaknesses.map((weakness: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-foreground">
                          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {results.recommendations && results.recommendations.length > 0 && (
                <div className="mt-6 bg-blue-50 rounded-2xl border border-blue-200 p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Recommendations
                  </h2>
                  <ul className="space-y-2">
                    {results.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-foreground">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  className="flex-1 min-w-[200px]"
                  onClick={() => navigate(`/proof/create/${id}`)}
                >
                  <Share2 className="w-5 h-5" />
                  Create Proof Page
                </Button>
                <Button
                  variant="outline"
                  disabled={downloadMutation.isPending}
                  onClick={() => downloadMutation.mutate({ format: "json" })}
                >
                  <Download className="w-5 h-5" />
                  Download JSON
                </Button>
                <Button
                  variant="outline"
                  disabled={downloadMutation.isPending}
                  onClick={() => downloadMutation.mutate({ format: "pdf" })}
                >
                  <Download className="w-5 h-5" />
                  Download PDF
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
