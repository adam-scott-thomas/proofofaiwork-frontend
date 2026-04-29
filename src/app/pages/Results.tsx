import { AlertCircle, ArrowLeft, FileText, Loader2, RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { apiFetch, apiPost } from "../../lib/api";
import { assessmentTitle, dateTime } from "../lib/poaw";

type Observation = {
  dimension: string;
  score: number | null;
  label: string | null;
  summary: string | null;
  confidence_label: string | null;
  skipped: boolean;
  skip_reason: string | null;
};

type Assessment = {
  id: string;
  status: string;
  engine_version: string;
  task_context: string | null;
  dimensions_evaluated: number | null;
  dimensions_skipped: number | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type Results = {
  status: string;
  overall_confidence: string | null;
  overall_confidence_score: number | null;
  dimensions_evaluated: number | null;
  dimensions_skipped: number | null;
  strengths: Array<string | { text: string; dimension?: string }>;
  weaknesses: Array<string | { text: string; dimension?: string }>;
  recommendations: Array<string | { text: string; dimension?: string }>;
  observations: Observation[];
};

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-[#EAE3CF] text-[#6B6B66]" },
  processing: { label: "Processing", className: "bg-[#EDE3FF] text-[#5D3FA0]" },
  in_progress: { label: "Processing", className: "bg-[#EDE3FF] text-[#5D3FA0]" },
  complete: { label: "Complete", className: "bg-[#D3E9D9] text-[#1F6A3F]" },
  partial: { label: "Partial", className: "bg-[#F8E5C2] text-[#8A5F10]" },
  failed: { label: "Failed", className: "bg-[#F3D1D1] text-[#8B2F2F]" },
};

function insightText(item: string | { text: string; dimension?: string } | null | undefined) {
  if (!item) return null;
  if (typeof item === "string") return item;
  return item.text || null;
}

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const assessmentQuery = useQuery<Assessment>({
    queryKey: ["assessment", id],
    queryFn: () => apiFetch<Assessment>(`/assessments/${id}`),
    enabled: !!id,
  });
  const resultsQuery = useQuery<Results>({
    queryKey: ["assessment-results", id],
    queryFn: () => apiFetch<Results>(`/assessments/${id}/results`),
    enabled: !!id,
  });

  const createProofPage = useMutation({
    mutationFn: () => apiPost<{ id: string; slug?: string }>("/proof-pages", { assessment_id: id }),
    onSuccess: () => {
      toast.success("Proof page created");
      queryClient.invalidateQueries({ queryKey: ["proof-pages"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Proof page failed"),
  });
  const rerun = useMutation({
    mutationFn: () => apiPost<any>(`/assessments/${id}/rerun`, {}),
    onSuccess: () => {
      toast.success("Assessment rerun started");
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      queryClient.invalidateQueries({ queryKey: ["assessment", id] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Rerun failed"),
  });

  const assessment = assessmentQuery.data;
  const results = resultsQuery.data;
  const loading = assessmentQuery.isLoading || resultsQuery.isLoading;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading results...
      </div>
    );
  }

  if (!assessment || !results) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <Card className="max-w-md border border-[#D8D2C4] bg-white p-6">
          <AlertCircle className="mx-auto mb-3 h-6 w-6 text-[#8B2F2F]" />
          <div className="text-[15px]">Results are not available yet.</div>
          <Link to="/app/assessments" className="mt-4 inline-flex text-[13px] text-[#315D8A] hover:underline">
            Back to assessments
          </Link>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_STYLE[(assessment.status ?? "").toLowerCase()] ?? STATUS_STYLE.pending;
  const evaluated = results.observations.filter((observation) => !observation.skipped);
  const skipped = results.observations.filter((observation) => observation.skipped);

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-7">
          <Link to="/app/assessments" className="mb-4 inline-flex items-center gap-2 text-[13px] text-[#5C5C5C] hover:text-[#161616]">
            <ArrowLeft className="h-4 w-4" />
            Back to assessments
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${statusConfig.className}`}>
                  {statusConfig.label}
                </span>
                <span className="text-[12px] text-[#6B6B66]">{assessment.engine_version}</span>
              </div>
              <h1 className="mt-2 text-3xl tracking-tight">{assessmentTitle(assessment)}</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#5C5C5C]">
                {assessment.task_context || "Assessment results and observations."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={rerun.isPending} onClick={() => rerun.mutate()}>
                {rerun.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Rerun
              </Button>
              <Button disabled={createProofPage.isPending} onClick={() => createProofPage.mutate()}>
                {createProofPage.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Create proof page
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="grid gap-3 md:grid-cols-4">
            <Summary label="Confidence" value={results.overall_confidence ?? "pending"} />
            <Summary label="Score" value={results.overall_confidence_score != null ? Math.round(results.overall_confidence_score * 100) : "—"} />
            <Summary label="Evaluated" value={results.dimensions_evaluated ?? evaluated.length} />
            <Summary label="Skipped" value={results.dimensions_skipped ?? skipped.length} />
          </section>

          <section className="grid gap-3 lg:grid-cols-3">
            <InsightList title="Strengths" items={results.strengths} />
            <InsightList title="Weaknesses" items={results.weaknesses} />
            <InsightList title="Recommendations" items={results.recommendations} />
          </section>

          <section>
            <div className="mb-3 text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Observations</div>
            <div className="space-y-3">
              {results.observations.map((observation) => (
                <Card key={observation.dimension} className="border border-[#D8D2C4] bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[14px] text-[#161616]">{observation.dimension.replace(/_/g, " ")}</div>
                      {observation.summary ? <p className="mt-1 text-[13px] leading-relaxed text-[#5C5C5C]">{observation.summary}</p> : null}
                      {observation.skipped ? <p className="mt-1 text-[12px] text-[#8A5F10]">{observation.skip_reason || "Skipped"}</p> : null}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl tracking-tight">{observation.score ?? "—"}</div>
                      <div className="text-[11px] text-[#6B6B66]">{observation.confidence_label ?? observation.label ?? ""}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <div className="text-[11px] text-[#6B6B66]">
            Updated {dateTime(assessment.updated_at)}{assessment.completed_at ? ` · Completed ${dateTime(assessment.completed_at)}` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="border border-[#D8D2C4] bg-white p-4">
      <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">{label}</div>
      <div className="mt-1 text-2xl tracking-tight text-[#161616]">{value}</div>
    </Card>
  );
}

function InsightList({ title, items }: { title: string; items: Results["strengths"] }) {
  const rows = items.map(insightText).filter(Boolean);
  return (
    <Card className="border border-[#D8D2C4] bg-white p-4">
      <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">{title}</div>
      <div className="mt-3 space-y-2">
        {rows.length > 0 ? rows.map((item, index) => (
          <div key={index} className="text-[13px] leading-relaxed text-[#5C5C5C]">{item}</div>
        )) : <div className="text-[13px] text-[#6B6B66]">Nothing reported.</div>}
      </div>
    </Card>
  );
}
