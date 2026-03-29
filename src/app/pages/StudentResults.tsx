import { useState } from "react";
import { useParams, Link } from "react-router";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Bot,
  Share2,
  ExternalLink,
  Copy,
  Lock,
  TrendingUp,
  TrendingDown,
  XCircle,
  Download,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch, apiPost } from "../../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

const DIMENSION_LABELS: Record<string, { label: string; side: "you" | "ai" }> = {
  clarity: { label: "Clarity of direction", side: "you" },
  context: { label: "Problem framing", side: "you" },
  constraint_quality: { label: "Setting constraints", side: "you" },
  iteration_discipline: { label: "Iterating on output", side: "you" },
  verification_habit: { label: "Checking AI's work", side: "ai" },
  output_judgment: { label: "Accept/reject decisions", side: "ai" },
  workflow_efficiency: { label: "Task decomposition", side: "ai" },
  risk_awareness: { label: "Edge case awareness", side: "ai" },
};

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 0.7 ? "bg-emerald-500" : score >= 0.4 ? "bg-amber-400" : "bg-red-400";
  const textColor = score >= 0.7 ? "text-emerald-700" : score >= 0.4 ? "text-amber-700" : "text-red-700";

  return (
    <div className="flex items-center gap-3">
      <span className="w-40 flex-shrink-0 text-[13px] text-[#3A3A3A]">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.round(score * 100)}%` }} />
      </div>
      <span className={`w-10 flex-shrink-0 text-right text-[13px] font-medium ${textColor}`}>
        {Math.round(score * 100)}%
      </span>
    </div>
  );
}

export default function StudentResults() {
  const { id } = useParams<{ id: string }>();
  const [published, setPublished] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: assessment, isLoading: assessmentLoading } = useQuery({
    queryKey: ["assessment", id],
    queryFn: () => apiFetch<any>(`/assessments/${id}`),
    enabled: !!id,
  });

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ["assessment-results", id],
    queryFn: () => apiFetch<any>(`/assessments/${id}/results`),
    enabled: !!id && (assessment?.status === "complete" || assessment?.status === "partial"),
  });

  // Publish mutation: create proof page + publish it
  const publishMutation = useMutation({
    mutationFn: async () => {
      // Create proof page
      const page = await apiPost<any>("/proof-pages", {
        assessment_id: id,
        headline: assessment?.task_context
          ? `AI Work Report — ${assessment.task_context.split("\n")[1]?.replace("Assignment: ", "") || "Assignment"}`
          : "AI Work Report",
        visibility: "link",
      });
      // Publish it
      await apiPost<any>(`/proof-pages/${page.id}/publish`, {});
      return page;
    },
    onSuccess: (page) => {
      const slug = page.slug || page.public_token;
      const url = `${window.location.origin}/p/${slug}`;
      setProofUrl(url);
      setPublished(true);
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const blob = await fetch(`/api/v1/assessments/${id}/download?format=json`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("poaw-token") ?? ""}` },
      }).then((r) => r.blob());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-work-report-${id?.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(proofUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (assessmentLoading || resultsLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
        <p className="text-[14px] text-[#717182]">Loading your results...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="py-16 text-center">
        <XCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
        <p className="text-[14px] text-[#717182]">Results not available yet. Please try again later.</p>
      </div>
    );
  }

  const observations = results.observations || [];
  const yourObs = observations.filter((o: any) => !o.skipped && o.score != null && DIMENSION_LABELS[o.dimension]?.side === "you");
  const aiObs = observations.filter((o: any) => !o.skipped && o.score != null && DIMENSION_LABELS[o.dimension]?.side === "ai");

  const yourAvg = yourObs.length > 0
    ? Math.round(yourObs.reduce((s: number, o: any) => s + o.score, 0) / yourObs.length * 100)
    : null;
  const aiAvg = aiObs.length > 0
    ? Math.round(aiObs.reduce((s: number, o: any) => s + o.score, 0) / aiObs.length * 100)
    : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-1 text-xl tracking-tight">Your AI work report</h1>
        <p className="text-[13px] text-[#717182]">
          Assessment {id?.slice(0, 8)} — {results.dimensions_evaluated ?? 0} dimensions evaluated
        </p>
      </div>

      {/* Summary scores */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <Card className="border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="mb-1 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-[13px] text-[#717182]">Your contribution</span>
            </div>
            <div className="text-3xl font-medium tracking-tight" style={{ color: "var(--score-hls, #2563eb)" }}>
              {yourAvg !== null ? `${yourAvg}%` : "—"}
            </div>
            <p className="mt-1 text-[11px] text-[#717182]">How well you directed the AI</p>
          </CardContent>
        </Card>

        <Card className="border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="mb-1 flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-600" />
              <span className="text-[13px] text-[#717182]">AI collaboration quality</span>
            </div>
            <div className="text-3xl font-medium tracking-tight" style={{ color: "var(--score-cai, #7c3aed)" }}>
              {aiAvg !== null ? `${aiAvg}%` : "—"}
            </div>
            <p className="mt-1 text-[11px] text-[#717182]">How effectively you used AI</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed scores */}
      <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-4 text-[15px] font-medium text-[#030213]">Detailed breakdown</h2>

          {yourObs.length > 0 && (
            <div className="mb-5">
              <div className="mb-3 flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-[12px] font-medium uppercase tracking-wider text-[#717182]">
                  Your direction
                </span>
              </div>
              <div className="space-y-2.5">
                {yourObs.map((obs: any) => (
                  <ScoreBar
                    key={obs.dimension}
                    score={obs.score}
                    label={DIMENSION_LABELS[obs.dimension]?.label ?? obs.dimension}
                  />
                ))}
              </div>
            </div>
          )}

          {aiObs.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Bot className="h-3.5 w-3.5 text-purple-600" />
                <span className="text-[12px] font-medium uppercase tracking-wider text-[#717182]">
                  AI collaboration
                </span>
              </div>
              <div className="space-y-2.5">
                {aiObs.map((obs: any) => (
                  <ScoreBar
                    key={obs.dimension}
                    score={obs.score}
                    label={DIMENSION_LABELS[obs.dimension]?.label ?? obs.dimension}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strengths & weaknesses */}
      {(results.strengths?.length > 0 || results.weaknesses?.length > 0) && (
        <div className="mb-6 grid grid-cols-2 gap-4">
          {results.strengths?.length > 0 && (
            <Card className="border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-[13px] font-medium text-[#030213]">Strengths</span>
                </div>
                <ul className="space-y-2">
                  {results.strengths.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-[#3A3A3A]">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {results.weaknesses?.length > 0 && (
            <Card className="border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-amber-600" />
                  <span className="text-[13px] font-medium text-[#030213]">Areas for growth</span>
                </div>
                <ul className="space-y-2">
                  {results.weaknesses.map((w: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-[#3A3A3A]">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* What this means (plain language explanation) */}
      <Card className="mb-6 border border-blue-100 bg-blue-50 shadow-sm">
        <CardContent className="p-5">
          <h3 className="mb-2 text-[14px] font-medium text-blue-900">What does this mean?</h3>
          <p className="text-[13px] leading-relaxed text-blue-800">
            {yourAvg !== null && yourAvg >= 70
              ? "Your scores show you actively directed the AI — setting goals, providing context, and making decisions about what to keep or change. The AI was a tool you controlled, not the other way around."
              : yourAvg !== null && yourAvg >= 40
              ? "Your scores show a mix — you directed some parts of the work but also accepted AI output without much revision in other areas. Consider being more specific about what you need from AI and reviewing its output more critically."
              : "Your scores suggest the AI did most of the heavy lifting. To improve, try giving the AI more specific instructions, breaking your task into smaller pieces, and critically reviewing what it produces."
            }
          </p>
        </CardContent>
      </Card>

      {/* Publish section */}
      {!published ? (
        <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                <Share2 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-[15px] font-medium text-[#030213]">
                  Share with your professor
                </h3>
                <p className="mb-4 text-[13px] text-[#717182]">
                  Publish a shareable link your professor can view — no account needed on their end.
                  Shows your scores, the evidence trail, and how you used AI.
                </p>
                <Button
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {publishMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      Publish proof page
                    </>
                  )}
                </Button>
                {publishMutation.isError && (
                  <p className="mt-2 text-[13px] text-red-600">
                    Failed to publish. Please try again.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border border-green-200 bg-green-50 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="text-[15px] font-medium text-green-900">Published!</h3>
            </div>
            <p className="mb-4 text-[13px] text-green-800">
              Send this link to your professor. They can view your AI work report without creating an account.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border border-green-300 bg-white px-3 py-2">
                <p className="truncate font-mono text-[13px] text-[#030213]">{proofUrl}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
              <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Open
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Secondary actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadMutation.mutate()}
          disabled={downloadMutation.isPending}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Download JSON
        </Button>
        <Link to="/student/submit">
          <Button variant="outline" size="sm">
            Submit another assignment
          </Button>
        </Link>
      </div>
    </div>
  );
}
