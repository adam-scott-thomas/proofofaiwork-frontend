import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { apiDelete, apiFetch, apiPost } from "../../lib/api";

type Stage = { key: string; label: string; description: string };

const STAGES: Stage[] = [
  { key: "pending", label: "Queued", description: "Waiting for a worker slot." },
  { key: "parsing", label: "Parsing", description: "Reading the file, extracting turns and structure. No LLM here." },
  { key: "normalizing", label: "Normalizing", description: "Per-file cleanup, then aggregate. Drops fluff, keeps decision points." },
  { key: "gating", label: "Quality gate", description: "Deciding which dimensions have enough evidence to evaluate." },
  { key: "evaluating", label: "Evaluating", description: "Rubric-based scoring per dimension. This is where the LLM runs." },
  { key: "aggregating", label: "Profile", description: "Combining observations into confidence, strengths, and narrative." },
  { key: "complete", label: "Ready", description: "Results ready for review." },
];

type Observation = {
  dimension: string;
  score: number | null;
  label: string | null;
  summary: string | null;
  confidence_label: string | null;
  skipped: boolean;
  skip_reason: string | null;
};

type LiveResponse = {
  assessment_id: string;
  status: string;
  total_dimensions: number;
  observations: Observation[];
};

type Assessment = {
  id: string;
  status: string;
  engine_version?: string;
  rubric_version?: string;
  dimensions_evaluated?: number | null;
  dimensions_skipped?: number | null;
  retry_count?: number;
  started_at?: string | null;
  completed_at?: string | null;
  failed_at?: string | null;
  failure_reason?: string | null;
  failure_stage?: string | null;
  task_context?: string | null;
  uploads?: Array<{ id: string; file_name: string; file_type: string; file_size_bytes: number; evidence_class: string }>;
};

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

function bytesLabel(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const CLASS_STYLE: Record<string, string> = {
  A: "bg-[#1F6A3F] text-white",
  B: "bg-[#486E9B] text-white",
  C: "bg-[#C18A2E] text-white",
  D: "bg-[#8B2F2F] text-white",
};

export default function Processing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [elapsed, setElapsed] = useState(0);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [totalDimensions, setTotalDimensions] = useState<number>(8);
  const cancelDialog = useRef<boolean>(false);

  const assessmentQuery = useQuery<Assessment>({
    queryKey: ["assessment", id],
    queryFn: () => apiFetch<Assessment>(`/assessments/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "complete" || status === "partial" || status === "failed" ? false : 2500;
    },
  });

  const rerun = useMutation({
    mutationFn: () => apiPost(`/assessments/${id}/rerun`, {}),
    onSuccess: (data: any) => {
      const newId = data?.id || data?.assessment_id;
      if (newId) navigate(`/app/assessment/${newId}/processing`, { replace: true });
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });

  const remove = useMutation({
    mutationFn: () => apiDelete(`/assessments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      navigate("/app/assessments");
    },
  });

  useEffect(() => {
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!id) return;
    const status = assessmentQuery.data?.status;
    if (status === "complete" || status === "partial" || status === "failed") return;
    let live = true;
    const tick = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const data = await apiFetch<LiveResponse>(`/assessments/${id}/live-observations`);
        if (!live) return;
        setObservations(Array.isArray(data?.observations) ? data.observations : []);
        if (typeof data?.total_dimensions === "number") setTotalDimensions(data.total_dimensions);
      } catch {
        // ignore
      }
    };
    tick();
    const interval = setInterval(tick, 2500);
    // Pause polling while tab is backgrounded; fire immediately on focus.
    const onVisibility = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      live = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [assessmentQuery.data?.status, id]);

  useEffect(() => {
    const status = assessmentQuery.data?.status;
    if (status === "complete" || status === "partial") {
      const timeout = setTimeout(() => navigate(`/app/assessment/${id}/results`, { replace: true }), 1500);
      return () => clearTimeout(timeout);
    }
  }, [assessmentQuery.data?.status, id, navigate]);

  const assessment = assessmentQuery.data;
  const status = assessment?.status ?? "pending";
  const isFinal = status === "complete" || status === "partial";
  const activeIndex = useMemo(() => {
    const stageIndex = STAGES.findIndex((stage) => stage.key === status);
    if (stageIndex >= 0) return stageIndex;
    if (isFinal) return STAGES.length - 1;
    return 0;
  }, [status, isFinal]);

  if (status === "failed") {
    return (
      <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
        <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
          <div className="px-8 py-7">
            <Link to="/app/assessments" className="inline-flex items-center gap-2 text-[13px] text-[#5C5C5C] hover:text-[#161616]">
              <ArrowLeft className="h-4 w-4" />
              Back to assessments
            </Link>
          </div>
        </header>
        <div className="px-8 py-12">
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Processing failed</div>
            <h1 className="text-3xl tracking-tight">This assessment didn't complete.</h1>
            <Card className="border border-[#E8B8B8] bg-[#FBEAEA] p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#8B2F2F]" />
                <div>
                  <div className="text-[12px] uppercase tracking-[0.1em] text-[#8B2F2F]">
                    {assessment?.failure_stage || "evaluate"} stage · retry {assessment?.retry_count ?? 0}
                  </div>
                  <div className="mt-1 text-[14px] leading-relaxed text-[#5C5C5C]">
                    {assessment?.failure_reason || "No reason recorded."}
                  </div>
                </div>
              </div>
            </Card>
            <div className="flex gap-3">
              <Button onClick={() => rerun.mutate()} disabled={rerun.isPending}>
                {rerun.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Retry
              </Button>
              <Link to="/app/upload/new">
                <Button variant="outline">Upload again</Button>
              </Link>
              <Button
                variant="ghost"
                className="ml-auto text-[#8B2F2F] hover:bg-[#F3D1D1]/40 hover:text-[#8B2F2F]"
                onClick={() => remove.mutate()}
                disabled={remove.isPending}
              >
                {remove.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const scored = observations.filter((observation) => !observation.skipped && observation.score != null);
  const skipped = observations.filter((observation) => observation.skipped);
  const pctDone = Math.min(100, Math.round(((scored.length + skipped.length) / Math.max(totalDimensions, 1)) * 100));

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-7">
          <Link to="/app/assessments" className="inline-flex items-center gap-2 text-[13px] text-[#5C5C5C] hover:text-[#161616]">
            <ArrowLeft className="h-4 w-4" />
            Back to assessments
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Processing</div>
              <h1 className="mt-2 text-3xl tracking-tight">
                {isFinal ? "Assessment complete." : "Your work is being evaluated."}
              </h1>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#5C5C5C]">
                {isFinal
                  ? "Redirecting to results in a moment..."
                  : "Parsing is deterministic. Evaluation uses a rubric-constrained LLM. Skipped dimensions are honest, not broken."}
              </p>
            </div>
            <div className="min-w-[240px] rounded-lg border border-[#D8D2C4] bg-white p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#6B6B66]">Progress</div>
              <div className="mt-1 flex items-baseline gap-2">
                <div className="text-3xl tracking-tight">{pctDone}<span className="text-base text-[#6B6B66]">%</span></div>
                {isFinal ? <Check className="h-5 w-5 text-[#1F6A3F]" /> : <Loader2 className="h-4 w-4 animate-spin text-[#315D8A]" />}
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EAE3CF]">
                <div className="h-full bg-[#315D8A]" style={{ width: `${pctDone}%` }} />
              </div>
              <div className="mt-2 text-[11px] text-[#6B6B66]">
                {formatDuration(elapsed)} elapsed · {scored.length}/{totalDimensions} scored
                {skipped.length > 0 ? ` · ${skipped.length} skipped` : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-5">
            <Card className="border border-[#D8D2C4] bg-white p-5">
              <div className="text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">Pipeline</div>
              <div className="mt-3 space-y-3">
                {STAGES.map((stage, index) => {
                  const complete = index < activeIndex || (isFinal && index < STAGES.length - 1);
                  const active = index === activeIndex && !isFinal;
                  const done = isFinal && index === STAGES.length - 1;
                  return (
                    <div key={stage.key} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-[11px] ${
                        complete || done
                          ? "bg-[#D3E9D9] text-[#1F6A3F]"
                          : active
                          ? "bg-[#DCE4F0] text-[#315D8A]"
                          : "bg-[#F3EEE2] text-[#6B6B66]"
                      }`}>
                        {complete || done ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : active ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`text-[13px] ${active ? "text-[#161616]" : "text-[#5C5C5C]"}`}>
                          {stage.label}
                        </div>
                        <div className="mt-0.5 text-[11px] leading-relaxed text-[#6B6B66]">
                          {stage.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {assessment?.uploads?.length ? (
              <Card className="border border-[#D8D2C4] bg-white p-5">
                <div className="text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">Sources</div>
                <div className="mt-3 space-y-2">
                  {assessment.uploads.map((upload) => (
                    <div key={upload.id} className="flex items-center gap-3 rounded-md border border-[#EAE3CF] bg-[#FBF8F1] px-3 py-2">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-[#315D8A]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] text-[#161616]">{upload.file_name}</div>
                        <div className="text-[10px] text-[#6B6B66]">
                          {upload.file_type.toUpperCase()} · {bytesLabel(upload.file_size_bytes)}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] ${CLASS_STYLE[upload.evidence_class] || ""}`}>
                        {upload.evidence_class}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            <Card className="border border-[#D8D2C4] bg-[#FBF8F1] p-5">
              <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">
                <Sparkles className="h-3.5 w-3.5" />
                Why this takes time
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-[#5C5C5C]">
                The evaluator asks specific rubric questions per dimension, not a single "score this chat"
                prompt. That's why the observations are comparable across runs. Complex conversations take
                longer to normalize and score.
              </p>
            </Card>
          </div>

          <div>
            <Card className="border border-[#D8D2C4] bg-white p-5">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">Live observations</div>
                  <div className="mt-0.5 text-[15px]">Dimensions appear as they land.</div>
                </div>
                <div className="text-[11px] text-[#6B6B66]">
                  {scored.length}/{totalDimensions} scored
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {observations.length > 0 ? (
                  observations.map((observation) => (
                    <ObservationTile key={observation.dimension} observation={observation} />
                  ))
                ) : (
                  Array.from({ length: totalDimensions }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-md border border-dashed border-[#D8D2C4] bg-[#FBF8F1] px-3 py-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-[#C0B99B]" />
                      <div className="text-[12px] text-[#6B6B66]">Waiting for dimension {index + 1}...</div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>

        {!isFinal ? (
          <div className="mx-auto mt-8 max-w-6xl text-right">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#8B2F2F] hover:bg-[#F3D1D1]/40 hover:text-[#8B2F2F]"
              onClick={() => {
                if (!cancelDialog.current && confirm("Cancel and delete this assessment? Uploads stay in the pool.")) {
                  cancelDialog.current = true;
                  remove.mutate();
                }
              }}
              disabled={remove.isPending}
            >
              {remove.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <X className="mr-2 h-3.5 w-3.5" />}
              Cancel assessment
            </Button>
          </div>
        ) : (
          <div className="mx-auto mt-8 max-w-6xl text-right">
            <Link to={`/app/assessment/${id}/results`}>
              <Button>
                View results
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ObservationTile({ observation }: { observation: Observation }) {
  if (observation.skipped) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-dashed border-[#D8D2C4] bg-[#FBF8F1] px-3 py-2">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8A5F10]" />
        <div className="min-w-0 flex-1">
          <div className="text-[12px] text-[#161616]">{observation.dimension}</div>
          <div className="mt-0.5 text-[11px] text-[#6B6B66]">
            {observation.skip_reason || "Insufficient evidence signal."}
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-[0.1em] text-[#8A5F10]">skipped</span>
      </div>
    );
  }
  if (observation.score != null) {
    const pct = Math.round(observation.score * 100);
    return (
      <div className="rounded-md border border-[#EAE3CF] bg-white px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="text-[12px] text-[#161616]">{observation.label || observation.dimension}</div>
              <span className="rounded-full border border-[#D8D2C4] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] text-[#6B6B66]">
                {observation.dimension}
              </span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#EAE3CF]">
              <div className="h-full bg-[#486E9B]" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-[14px] tracking-tight">{pct}<span className="text-[10px] text-[#6B6B66]">%</span></div>
            <div className="text-[10px] text-[#6B6B66]">{observation.confidence_label || "low"} conf</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-md border border-[#EAE3CF] bg-white px-3 py-2">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#315D8A]" />
      <div className="text-[12px] text-[#161616]">{observation.dimension}</div>
      <span className="ml-auto text-[10px] uppercase tracking-[0.1em] text-[#6B6B66]">scoring...</span>
    </div>
  );
}
