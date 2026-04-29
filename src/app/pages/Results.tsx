import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock,
  Download,
  FileText,
  Flag,
  Globe,
  Hash,
  Loader2,
  MinusCircle,
  PlayCircle,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { apiFetch, apiPost, apiDelete } from "../../lib/api";
import { assessmentTitle, dateTime } from "../lib/poaw";
import { useAuthStore } from "../../stores/authStore";

type Observation = {
  id?: string | null;
  dimension: string;
  score: number | null;
  label: string | null;
  summary: string | null;
  confidence_label: string | null;
  confidence_score: number | null;
  skipped: boolean;
  skip_reason: string | null;
  eval_failed?: boolean;
};

type Signal = {
  id: string;
  label: string;
  description: string;
  category: string;
  visibility: "public" | "private" | "hidden";
  strength: number;
  source_dimensions: string[];
};

type Upload = {
  id: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  file_hash: string;
  evidence_class: "A" | "B" | "C" | "D";
  provenance: "self_submitted" | "file_export" | "api_export" | "verified";
  created_at: string;
};

type NormalizedFile = {
  file_index: number | null;
  content_hash: string;
  task_type: string | null;
  turn_count: number;
  active_turn_count: number | null;
  iteration_count: number;
  acceptance_pattern: string | null;
  compression_ratio: number | null;
};

type Assessment = {
  id: string;
  status: string;
  engine_version: string;
  rubric_version: string;
  pipeline_version: string;
  task_context: string | null;
  dimensions_evaluated: number | null;
  dimensions_skipped: number | null;
  retry_count: number;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  failure_stage: string | null;
  created_at: string;
  updated_at: string;
  uploads: Upload[];
};

type Results = {
  assessment_id: string;
  status: string;
  overall_confidence: string | null;
  overall_confidence_score: number | null;
  dimensions_evaluated: number | null;
  dimensions_skipped: number | null;
  strengths: Array<string | { text: string; dimension?: string }>;
  weaknesses: Array<string | { text: string; dimension?: string }>;
  recommendations: Array<string | { text: string; dimension?: string }>;
  observations: Observation[];
  signals: Signal[];
};

const EVIDENCE_COLORS: Record<string, string> = {
  A: "bg-[#1F6A3F] text-white",
  B: "bg-[#486E9B] text-white",
  C: "bg-[#C18A2E] text-white",
  D: "bg-[#8B2F2F] text-white",
};

const PROVENANCE_LABEL: Record<string, string> = {
  verified: "Third-party verified",
  api_export: "API export",
  file_export: "Platform file export",
  self_submitted: "Self-submitted",
};

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-[#EAE3CF] text-[#6B6B66]" },
  processing: { label: "Processing", className: "bg-[#EDE3FF] text-[#5D3FA0]" },
  in_progress: { label: "Processing", className: "bg-[#EDE3FF] text-[#5D3FA0]" },
  complete: { label: "Complete", className: "bg-[#D3E9D9] text-[#1F6A3F]" },
  partial: { label: "Partial", className: "bg-[#F8E5C2] text-[#8A5F10]" },
  failed: { label: "Failed", className: "bg-[#F3D1D1] text-[#8B2F2F]" },
  stale: { label: "Stale", className: "bg-[#E5E0D4] text-[#6B6B66]" },
};

function bytesLabel(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function pct(value: number | null | undefined) {
  if (value == null) return null;
  if (value <= 1) return Math.round(value * 100);
  return Math.round(value);
}

function insightText(item: string | { text: string; dimension?: string } | null | undefined) {
  if (!item) return null;
  if (typeof item === "string") return item;
  return item.text || null;
}

function insightDim(item: string | { text: string; dimension?: string } | null | undefined) {
  if (!item || typeof item === "string") return null;
  return item.dimension || null;
}

function confidenceDot(label?: string | null) {
  const n = (label || "").toLowerCase();
  if (n === "high") return "bg-[#1F6A3F]";
  if (n === "medium" || n === "moderate") return "bg-[#C18A2E]";
  return "bg-[#6B6B66]";
}

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  const normalizedQuery = useQuery<{ files: NormalizedFile[] }>({
    queryKey: ["assessment-normalized", id],
    queryFn: () => apiFetch<{ files: NormalizedFile[] }>(`/assessments/${id}/normalized`),
    enabled: !!id,
  });
  const disputesQuery = useQuery<Array<{ observation_id: string; status: string }>>({
    queryKey: ["disputes"],
    queryFn: () => apiFetch<Array<{ observation_id: string; status: string }>>("/disputes"),
    retry: false,
  });

  const createProofPage = useMutation({
    mutationFn: () => apiPost<{ id: string; slug?: string }>("/proof-pages", { assessment_id: id }),
  });
  const rerun = useMutation({
    mutationFn: () => apiPost<any>(`/assessments/${id}/rerun`, {}),
  });
  const removeAssessment = useMutation({
    mutationFn: () => apiDelete(`/assessments/${id}`),
  });

  const [disputeTarget, setDisputeTarget] = useState<Observation | null>(null);
  const [disputedDimsLocal, setDisputedDimsLocal] = useState<Set<string>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [skippedOpen, setSkippedOpen] = useState(false);

  const assessment = assessmentQuery.data;
  const results = resultsQuery.data;
  const normalized = normalizedQuery.data;

  // Merge server-side active disputes (open/reviewed for this assessment's
  // observations) with any disputes this session filed locally.
  const disputedObsIds = useMemo(() => {
    const set = new Set<string>();
    for (const dispute of disputesQuery.data ?? []) {
      if (dispute.status === "open" || dispute.status === "reviewed") {
        set.add(dispute.observation_id);
      }
    }
    return set;
  }, [disputesQuery.data]);

  const disputedDims = useMemo(() => {
    const set = new Set(disputedDimsLocal);
    for (const observation of results?.observations ?? []) {
      if (observation.id && disputedObsIds.has(observation.id)) {
        set.add(observation.dimension);
      }
    }
    return set;
  }, [disputedDimsLocal, disputedObsIds, results?.observations]);

  const status = assessment?.status ?? results?.status ?? "pending";
  const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.pending;
  const isFinal = status === "complete" || status === "partial";
  const observations = results?.observations ?? [];
  const evaluated = useMemo(() => observations.filter((o) => !o.skipped), [observations]);
  const skipped = useMemo(() => observations.filter((o) => o.skipped), [observations]);
  const publicSignals = useMemo(
    () => (results?.signals ?? []).filter((s) => s.visibility === "public"),
    [results?.signals],
  );
  const uploads = assessment?.uploads ?? [];
  const evidenceBreakdown = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const upload of uploads) counts[upload.evidence_class] = (counts[upload.evidence_class] ?? 0) + 1;
    return counts;
  }, [uploads]);
  const mixedProvenance = useMemo(() => {
    const set = new Set(uploads.map((upload) => upload.provenance));
    return set.size > 1;
  }, [uploads]);
  const dominantProvenance = uploads.length
    ? Array.from(uploads.reduce((acc, u) => acc.set(u.provenance, (acc.get(u.provenance) ?? 0) + 1), new Map<string, number>()))
        .sort((a, b) => b[1] - a[1])[0][0]
    : null;

  const normalizedByHash = useMemo(() => {
    const map = new Map<string, NormalizedFile>();
    for (const file of normalized?.files ?? []) map.set(file.content_hash, file);
    return map;
  }, [normalized?.files]);

  const canCreateProof = isFinal && evaluated.length >= 1;
  const canDownload = isFinal;
  const canRerun = status !== "processing" && status !== "in_progress";

  if (assessmentQuery.isLoading || resultsQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        Loading results...
      </div>
    );
  }

  if (assessmentQuery.error || !assessment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-[#6B6B66]">
        <AlertCircle className="h-6 w-6" />
        <div>Assessment not found or you don't have access.</div>
        <Link to="/app/assessments" className="text-[13px] underline">Back to assessments</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-7">
          <Link to="/app/assessments" className="inline-flex items-center gap-2 text-[13px] text-[#5C5C5C] hover:text-[#161616]">
            <ArrowLeft className="h-4 w-4" />
            Back to assessments
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.08em] ${statusStyle.className}`}>
                  {status === "complete" ? <Check className="h-3 w-3" /> :
                    status === "partial" ? <AlertTriangle className="h-3 w-3" /> :
                    status === "failed" ? <ShieldAlert className="h-3 w-3" /> :
                    <Clock className="h-3 w-3" />}
                  {statusStyle.label}
                </span>
                <span className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Assessment</span>
              </div>
              <h1 className="mt-2 text-3xl tracking-tight">{assessmentTitle(assessment)}</h1>
              {assessment.task_context ? (
                <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#5C5C5C]">
                  {assessment.task_context}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-[#6B6B66]">
                <span>Engine v{assessment.engine_version}</span>
                <span>Rubric v{assessment.rubric_version}</span>
                <span>Pipeline v{assessment.pipeline_version}</span>
                <span>Completed {dateTime(assessment.completed_at)}</span>
                {assessment.retry_count > 0 ? <span>Reruns {assessment.retry_count}</span> : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                variant="default"
                disabled={!canCreateProof || createProofPage.isPending}
                onClick={() =>
                  createProofPage.mutate(undefined, {
                    onSuccess: (pp) => {
                      toast.success("Proof page created");
                      if (pp?.id) navigate(`/app/proof-pages`);
                    },
                    onError: (error: any) => toast.error(error?.message ?? "Failed to create proof page"),
                  })
                }
              >
                {createProofPage.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                Create proof page
              </Button>
              <Button
                variant="outline"
                disabled={!canRerun || rerun.isPending}
                onClick={() =>
                  rerun.mutate(undefined, {
                    onSuccess: (data: any) => {
                      toast.success("Reassessment started");
                      const newId = data?.id || data?.assessment_id;
                      if (newId) navigate(`/app/assessment/${newId}/processing`);
                    },
                    onError: (error: any) => toast.error(error?.message ?? "Could not start reassessment"),
                  })
                }
              >
                {rerun.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                {status === "failed" ? "Retry" : "Rerun"}
              </Button>
              <DownloadButton id={id!} disabled={!canDownload} />
              <Button
                variant="ghost"
                className="text-[#8B2F2F] hover:bg-[#F3D1D1]/40 hover:text-[#8B2F2F]"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {status === "failed" ? (
            <Card className="border border-[#E8B8B8] bg-[#FBEAEA] p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#8B2F2F]" />
                <div>
                  <div className="text-[13px] font-medium text-[#8B2F2F]">Assessment failed at the {assessment.failure_stage || "evaluate"} stage</div>
                  <div className="mt-1 text-[13px] text-[#5C5C5C]">
                    {assessment.failure_reason || "No failure reason recorded."}
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          {status === "partial" ? (
            <Card className="border border-[#E8CE9C] bg-[#FDF4DC] p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#8A5F10]" />
                <div className="text-[13px] text-[#5C5C5C]">
                  <span className="font-medium text-[#8A5F10]">
                    {assessment.dimensions_evaluated ?? evaluated.length} of{" "}
                    {(assessment.dimensions_evaluated ?? 0) + (assessment.dimensions_skipped ?? 0)} dimensions evaluated.
                  </span>{" "}
                  The quality gate skipped the rest due to insufficient signal.{" "}
                  <button type="button" className="underline" onClick={() => setSkippedOpen((v) => !v)}>
                    {skippedOpen ? "Hide" : "Show"} skipped
                  </button>
                </div>
              </div>
            </Card>
          ) : null}

          {(status === "pending" || status === "processing" || status === "in_progress") ? (
            <Card className="border border-[#D8D2C4] bg-white p-5">
              <div className="flex items-center gap-3 text-[13px] text-[#5C5C5C]">
                <Loader2 className="h-5 w-5 animate-spin text-[#5D3FA0]" />
                <div>
                  This assessment is still processing.{" "}
                  <Link to={`/app/assessment/${id}/processing`} className="underline">
                    Watch live progress
                  </Link>
                </div>
              </div>
            </Card>
          ) : null}

          <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="border border-[#D8D2C4] bg-white p-5 md:col-span-2">
              <div className="text-[12px] uppercase tracking-[0.12em] text-[#6B6B66]">Overall confidence</div>
              <div className="mt-2 flex items-baseline gap-3">
                <div className="text-4xl tracking-tight">
                  {results?.overall_confidence || "—"}
                </div>
                {results?.overall_confidence_score != null ? (
                  <div className="text-[13px] text-[#6B6B66]">
                    {pct(results.overall_confidence_score)}% signal strength
                  </div>
                ) : null}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-[12px] text-[#6B6B66]">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.1em]">Evaluated</div>
                  <div className="mt-0.5 text-xl text-[#161616]">{results?.dimensions_evaluated ?? evaluated.length}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.1em]">Skipped</div>
                  <div className="mt-0.5 text-xl text-[#161616]">{results?.dimensions_skipped ?? skipped.length}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.1em]">Disputed</div>
                  <div className="mt-0.5 text-xl text-[#161616]">{disputedDims.size}</div>
                </div>
              </div>
            </Card>

            <Card className="border border-[#D8D2C4] bg-white p-5 md:col-span-2">
              <div className="text-[12px] uppercase tracking-[0.12em] text-[#6B6B66]">Evidence quality (uploads)</div>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[#EAE3CF]">
                {(["A", "B", "C", "D"] as const).map((k) =>
                  evidenceBreakdown[k] ? (
                    <div
                      key={k}
                      className={EVIDENCE_COLORS[k]}
                      style={{ width: `${(evidenceBreakdown[k] / Math.max(uploads.length, 1)) * 100}%` }}
                      title={`${evidenceBreakdown[k]} × class ${k}`}
                    />
                  ) : null,
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#6B6B66]">
                {(["A", "B", "C", "D"] as const).map((k) =>
                  evidenceBreakdown[k] ? (
                    <span key={k} className="inline-flex items-center gap-1">
                      <span className={`h-2 w-2 rounded-full ${EVIDENCE_COLORS[k].split(" ")[0]}`} />
                      {evidenceBreakdown[k]} × {k}
                    </span>
                  ) : null,
                )}
              </div>
              <div className="mt-3 text-[12px] text-[#6B6B66]">
                Provenance:{" "}
                <span className="text-[#161616]">
                  {mixedProvenance
                    ? "Mixed"
                    : PROVENANCE_LABEL[dominantProvenance || "self_submitted"] || "—"}
                </span>
              </div>
            </Card>
          </section>

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <div>
                <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Observations</div>
                <h2 className="text-xl tracking-tight">Dimension by dimension</h2>
              </div>
              <div className="text-[12px] text-[#6B6B66]">
                {evaluated.length} evaluated · {skipped.length} skipped
              </div>
            </div>

            <div className="space-y-3">
              {evaluated.map((observation) => {
                const isDisputed = disputedDims.has(observation.dimension);
                return (
                  <Card key={observation.dimension} className="border border-[#D8D2C4] bg-white p-5">
                    <div className="grid gap-4 md:grid-cols-[120px_1fr_auto]">
                      <div>
                        <div className="text-3xl tracking-tight">
                          {pct(observation.score) ?? "—"}
                          {observation.score != null ? <span className="ml-1 text-sm text-[#6B6B66]">%</span> : null}
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EAE3CF]">
                          <div
                            className="h-full bg-[#486E9B]"
                            style={{ width: `${pct(observation.score) ?? 0}%` }}
                          />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-[15px] text-[#161616]">
                            {observation.label || observation.dimension}
                          </div>
                          <span className="rounded-full border border-[#D8D2C4] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#6B6B66]">
                            {observation.dimension}
                          </span>
                          {isDisputed ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#F3D1D1] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#8B2F2F]">
                              <Flag className="h-2.5 w-2.5" />
                              Disputed
                            </span>
                          ) : null}
                        </div>
                        {observation.summary ? (
                          <p className="mt-2 text-[13px] leading-relaxed text-[#5C5C5C]">
                            {observation.summary}
                          </p>
                        ) : null}
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-[#6B6B66]">
                          <span className={`h-2 w-2 rounded-full ${confidenceDot(observation.confidence_label)}`} />
                          <span>
                            {(observation.confidence_label || "low").toLowerCase()} confidence
                            {observation.confidence_score != null
                              ? ` · ${Math.round(observation.confidence_score * 100)}% model certainty`
                              : null}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!isFinal || isDisputed || observation.eval_failed || !observation.id}
                          onClick={() => setDisputeTarget(observation)}
                          title={
                            isDisputed ? "Already disputed" :
                            observation.eval_failed ? "Cannot dispute a failed evaluation" :
                            !observation.id ? "Observation id unavailable" :
                            "Flag this observation"
                          }
                        >
                          <Flag className="mr-2 h-3.5 w-3.5" />
                          {isDisputed ? "Disputed" : "Dispute"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {evaluated.length === 0 ? (
                <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-5 text-center text-[13px] text-[#6B6B66]">
                  No evaluated dimensions yet.
                </Card>
              ) : null}

              {skippedOpen && skipped.length > 0 ? (
                <div className="mt-2 space-y-2">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-[#6B6B66]">Skipped by quality gate</div>
                  {skipped.map((observation) => (
                    <Card key={observation.dimension} className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-4">
                      <div className="flex items-start gap-3">
                        <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#6B6B66]" />
                        <div>
                          <div className="text-[13px] text-[#161616]">{observation.dimension}</div>
                          <div className="mt-1 text-[12px] text-[#6B6B66]">
                            {observation.skip_reason || "Not enough evidence for this dimension."}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          {(insightArray(results?.strengths).length ||
            insightArray(results?.weaknesses).length ||
            insightArray(results?.recommendations).length) ? (
            <section>
              <div className="mb-3">
                <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Interpretation</div>
                <h2 className="text-xl tracking-tight">What the evidence says</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <InsightCard title="Strengths" items={insightArray(results?.strengths)} tone="positive" />
                <InsightCard title="Weaknesses" items={insightArray(results?.weaknesses)} tone="negative" />
                <InsightCard title="Recommendations" items={insightArray(results?.recommendations)} tone="neutral" />
              </div>
            </section>
          ) : null}

          {publicSignals.length > 0 ? (
            <section>
              <div className="mb-3">
                <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Public signals</div>
                <h2 className="text-xl tracking-tight">Patterns visible to viewers</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {publicSignals.map((signal) => (
                  <Card key={signal.id} className="border border-[#D8D2C4] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[14px]">{signal.label}</div>
                      <div className="text-[11px] text-[#6B6B66]">{signal.category}</div>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#EAE3CF]">
                      <div className="h-full bg-[#1F6A3F]" style={{ width: `${Math.round(signal.strength * 100)}%` }} />
                    </div>
                    {signal.description ? (
                      <p className="mt-2 text-[12px] leading-relaxed text-[#5C5C5C]">{signal.description}</p>
                    ) : null}
                    {signal.source_dimensions.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {signal.source_dimensions.map((dim) => (
                          <span key={dim} className="rounded-full border border-[#D8D2C4] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#6B6B66]">
                            {dim}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <div className="mb-3">
              <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Artifacts</div>
              <h2 className="text-xl tracking-tight">Uploads that fed this assessment</h2>
            </div>
            <div className="space-y-2">
              {uploads.map((upload) => {
                const norm = normalizedByHash.get(upload.file_hash);
                return (
                  <Card key={upload.id} className="border border-[#D8D2C4] bg-white p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <FileText className="h-4 w-4 shrink-0 text-[#6B6B66]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px]">{upload.file_name}</div>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#6B6B66]">
                          <span className="inline-flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {upload.file_hash.slice(0, 10)}…
                          </span>
                          <span>{upload.file_type.toUpperCase()}</span>
                          <span>{bytesLabel(upload.file_size_bytes)}</span>
                          <span>{PROVENANCE_LABEL[upload.provenance] || upload.provenance}</span>
                        </div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${EVIDENCE_COLORS[upload.evidence_class] || "bg-[#EAE3CF] text-[#161616]"}`}>
                        Class {upload.evidence_class}
                      </span>
                    </div>
                    {norm ? (
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#EAE3CF] pt-3 text-[11px] text-[#6B6B66]">
                        <span>task: <span className="text-[#161616]">{norm.task_type || "mixed"}</span></span>
                        <span>turns: <span className="text-[#161616]">{norm.turn_count}</span></span>
                        {norm.active_turn_count != null ? (
                          <span>active: <span className="text-[#161616]">{norm.active_turn_count}</span></span>
                        ) : null}
                        <span>iterations: <span className="text-[#161616]">{norm.iteration_count}</span></span>
                        {norm.compression_ratio != null ? (
                          <span>compression: <span className="text-[#161616]">{norm.compression_ratio.toFixed(2)}×</span></span>
                        ) : null}
                        {norm.acceptance_pattern ? (
                          <span>pattern: <span className="text-[#161616]">{norm.acceptance_pattern}</span></span>
                        ) : null}
                      </div>
                    ) : null}
                  </Card>
                );
              })}
              {uploads.length === 0 ? (
                <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-5 text-center text-[13px] text-[#6B6B66]">
                  No uploads recorded on this assessment.
                </Card>
              ) : null}
            </div>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D8D2C4] pt-5 text-[11px] text-[#6B6B66]">
            <div>
              Assessment <span className="text-[#161616]">{assessment.id.slice(0, 8)}…{assessment.id.slice(-4)}</span> ·
              created {dateTime(assessment.created_at)}
            </div>
            <div>engine v{assessment.engine_version} · rubric v{assessment.rubric_version} · pipeline v{assessment.pipeline_version}</div>
          </footer>
        </div>
      </div>

      <DisputeDialog
        observation={disputeTarget}
        onClose={() => setDisputeTarget(null)}
        onSubmitted={(dim) => {
          setDisputedDimsLocal((prev) => new Set(prev).add(dim));
          setDisputeTarget(null);
          queryClient.invalidateQueries({ queryKey: ["disputes"] });
        }}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this assessment?</DialogTitle>
            <DialogDescription>
              The assessment and its observations will be removed. Uploads stay in your pool.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#8B2F2F] hover:bg-[#7A2525]"
              disabled={removeAssessment.isPending}
              onClick={() =>
                removeAssessment.mutate(undefined, {
                  onSuccess: () => {
                    toast.success("Assessment deleted");
                    navigate("/app/assessments");
                  },
                  onError: (error: any) => toast.error(error?.message ?? "Delete failed"),
                })
              }
            >
              {removeAssessment.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InsightCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: Array<string | { text: string; dimension?: string }>;
  tone: "positive" | "negative" | "neutral";
}) {
  const accent =
    tone === "positive" ? "border-l-[#1F6A3F]" :
    tone === "negative" ? "border-l-[#8B2F2F]" :
    "border-l-[#486E9B]";
  return (
    <Card className={`border border-[#D8D2C4] border-l-4 bg-white p-4 ${accent}`}>
      <div className="text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">{title}</div>
      {items.length === 0 ? (
        <div className="mt-3 text-[12px] text-[#6B6B66]">None recorded.</div>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => {
            const text = insightText(item);
            const dim = insightDim(item);
            if (!text) return null;
            return (
              <li key={index} className="text-[13px] leading-relaxed text-[#161616]">
                {dim ? (
                  <span className="mr-1.5 rounded-full border border-[#D8D2C4] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#6B6B66]">
                    {dim}
                  </span>
                ) : null}
                {text}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function insightArray(v: unknown): Array<string | { text: string; dimension?: string }> {
  if (!v) return [];
  if (!Array.isArray(v)) return [];
  return v as Array<string | { text: string; dimension?: string }>;
}

function DownloadButton({ id, disabled }: { id: string; disabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const onClick = async () => {
    setLoading(true);
    try {
      const token = useAuthStore.getState().token;
      const apiHost = import.meta.env.VITE_API_URL || "";
      const url = `${apiHost ? apiHost.replace(/\/$/, "") : ""}/api/v1/assessments/${id}/download?format=json`;
      const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `assessment-${id}.json`;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error: any) {
      toast.error(error.message ?? "Download failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button variant="outline" disabled={disabled || loading} onClick={onClick}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      Download
    </Button>
  );
}

function DisputeDialog({
  observation,
  onClose,
  onSubmitted,
}: {
  observation: Observation | null;
  onClose: () => void;
  onSubmitted: (dim: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const open = !!observation;

  const submit = useMutation({
    mutationFn: async () => {
      if (!observation) throw new Error("No observation selected");
      if (reason.trim().length < 20) throw new Error("Reason must be at least 20 characters");
      const obsId = await findObservationId(observation);
      if (!obsId) throw new Error("Could not locate observation id");
      return apiPost(`/observations/${obsId}/dispute`, {
        reason: reason.trim(),
        user_evidence: evidence.trim() || null,
      });
    },
    onSuccess: () => {
      toast.success("Dispute filed");
      if (observation) onSubmitted(observation.dimension);
      setReason("");
      setEvidence("");
    },
    onError: (error: any) => toast.error(error?.message ?? "Could not file dispute"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Dispute {observation?.label || observation?.dimension}</DialogTitle>
          <DialogDescription>
            Tell us why this observation is inaccurate. At least 20 characters. Optional counter-evidence welcome.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">Reason</label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. This dimension should be higher — I iterated five times on turn 12 and the summary missed it."
              rows={4}
            />
            <div className="mt-1 text-right text-[11px] text-[#6B6B66]">
              {reason.trim().length}/20 min
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">Counter-evidence (optional)</label>
            <Textarea
              value={evidence}
              onChange={(event) => setEvidence(event.target.value)}
              placeholder="Paste specific turns or excerpts to support your claim."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={submit.isPending || reason.trim().length < 20}
            onClick={() => submit.mutate()}
          >
            {submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            Submit dispute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function findObservationId(observation: Observation): Promise<string | null> {
  return observation.id ?? null;
}
