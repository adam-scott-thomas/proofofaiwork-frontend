import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  FileBarChart,
  Loader2,
  PlayCircle,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useAssessments } from "../../hooks/useApi";
import { apiDelete, apiPost } from "../../lib/api";
import { asArray, assessmentTitle, dateTime } from "../lib/poaw";

type Assessment = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  task_context?: string | null;
  upload_count?: number;
  failure_reason?: string | null;
  failure_stage?: string | null;
  confidence?: string | null;
  overall_confidence_score?: number | null;
  project_id?: string | null;
  project_title?: string | null;
  dimensions_evaluated?: number | null;
  dimensions_skipped?: number | null;
};

type FilterKey = "all" | "complete" | "partial" | "failed" | "running";

const FILTER_CONFIG: Array<{ key: FilterKey; label: string; statuses: string[] | null }> = [
  { key: "all", label: "All", statuses: null },
  { key: "complete", label: "Complete", statuses: ["complete"] },
  { key: "partial", label: "Partial", statuses: ["partial"] },
  { key: "running", label: "Running", statuses: ["pending", "processing", "in_progress", "retrying"] },
  { key: "failed", label: "Failed", statuses: ["failed"] },
];

const STATUS_STYLE: Record<string, { icon: React.ComponentType<{ className?: string }>; className: string; label: string }> = {
  complete: { icon: Check, className: "bg-[#D3E9D9] text-[#1F6A3F]", label: "Complete" },
  partial: { icon: AlertTriangle, className: "bg-[#F8E5C2] text-[#8A5F10]", label: "Partial" },
  pending: { icon: Clock, className: "bg-[#EAE3CF] text-[#6B6B66]", label: "Queued" },
  processing: { icon: Loader2, className: "bg-[#EDE3FF] text-[#5D3FA0]", label: "Processing" },
  in_progress: { icon: Loader2, className: "bg-[#EDE3FF] text-[#5D3FA0]", label: "Processing" },
  retrying: { icon: RefreshCw, className: "bg-[#EDE3FF] text-[#5D3FA0]", label: "Retrying" },
  failed: { icon: ShieldAlert, className: "bg-[#F3D1D1] text-[#8B2F2F]", label: "Failed" },
  stale: { icon: Clock, className: "bg-[#EAE3CF] text-[#6B6B66]", label: "Stale" },
};

const RUNNING_STATUSES = ["pending", "processing", "in_progress", "retrying"];
const statusKey = (status: string | null | undefined) => (status ?? "").toLowerCase();

export default function Assessments() {
  const { data, isLoading, refetch } = useAssessments();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [deleting, setDeleting] = useState<Assessment | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const rerun = useMutation({
    mutationFn: (id: string) => apiPost(`/assessments/${id}/rerun`, {}),
    onSuccess: () => {
      toast.success("Rerun queued");
      refetch();
    },
    onError: (error: any) => toast.error(error?.message ?? "Rerun failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/assessments/${id}`),
    onSuccess: () => {
      toast.success("Assessment deleted");
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Delete failed"),
  });

  const assessments = asArray<Assessment>(data);
  const filtered = useMemo(() => {
    const filterConfig = FILTER_CONFIG.find((entry) => entry.key === filter);
    if (!filterConfig?.statuses) return assessments;
    return assessments.filter((assessment) => filterConfig.statuses!.includes(statusKey(assessment.status)));
  }, [assessments, filter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.updated_at ?? a.created_at).getTime();
      const timeB = new Date(b.updated_at ?? b.created_at).getTime();
      return timeB - timeA;
    });
  }, [filtered]);

  const counts = useMemo(() => {
    const map: Record<FilterKey, number> = { all: 0, complete: 0, partial: 0, failed: 0, running: 0 };
    map.all = assessments.length;
    for (const assessment of assessments) {
      const normalized = statusKey(assessment.status);
      if (normalized === "complete") map.complete++;
      else if (normalized === "partial") map.partial++;
      else if (normalized === "failed") map.failed++;
      else if (RUNNING_STATUSES.includes(normalized)) map.running++;
    }
    return map;
  }, [assessments]);

  useEffect(() => {
    if (counts.running <= 0) return;

    setLastChecked(new Date());
    const interval = setInterval(() => {
      refetch().finally(() => setLastChecked(new Date()));
    }, 5000);
    return () => clearInterval(interval);
  }, [counts.running, refetch]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading assessments...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-7">
          <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Assessments</div>
          <h1 className="mt-2 text-3xl tracking-tight">Evaluation runs and results.</h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#5C5C5C]">
            Every assessment carries its own observations, evidence class breakdown, and version metadata.
            Start one from a confirmed project; rerun from here when the engine or evidence changes.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {FILTER_CONFIG.map((filterConfig) => {
              const active = filter === filterConfig.key;
              return (
                <button
                  key={filterConfig.key}
                  type="button"
                  onClick={() => setFilter(filterConfig.key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] transition-colors ${
                    active
                      ? "border-[#315D8A] bg-[#EEF2F9] text-[#161616]"
                      : "border-[#D8D2C4] bg-white text-[#5C5C5C] hover:bg-[#FBF8F1]"
                  }`}
                >
                  <span>{filterConfig.label}</span>
                  <span className="rounded-full bg-[#F3EEE2] px-1.5 py-0.5 text-[10px] text-[#6B6B66]">
                    {counts[filterConfig.key]}
                  </span>
                </button>
              );
            })}
            {counts.running > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#D8D2C4] bg-white px-3 py-1 text-[12px] text-[#5C5C5C]">
                <Loader2 className="h-3 w-3 animate-spin text-[#315D8A]" />
                Auto-refreshing{lastChecked ? ` · ${lastChecked.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}` : ""}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-5xl space-y-3">
          {sorted.length === 0 ? (
            <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-10 text-center text-[14px] text-[#5C5C5C]">
              {assessments.length === 0 ? (
                <>
                  No assessments yet.{" "}
                  <Link to="/app/projects" className="underline">
                    Confirm a project and run one.
                  </Link>
                </>
              ) : (
                <>Nothing matches this filter.</>
              )}
            </Card>
          ) : (
            sorted.map((assessment) => (
              <AssessmentRow
                key={assessment.id}
                assessment={assessment}
                onRerun={() => rerun.mutate(assessment.id)}
                onDelete={() => setDeleting(assessment)}
                rerunPending={rerun.isPending}
              />
            ))
          )}
        </div>
      </div>

      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this assessment?</DialogTitle>
            <DialogDescription>
              The assessment and its observations are removed. Uploads stay in the pool.
              Any proof page linked to this assessment will need to point at a different one.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              className="bg-[#8B2F2F] hover:bg-[#7A2525]"
              disabled={remove.isPending}
              onClick={() => deleting && remove.mutate(deleting.id)}
            >
              {remove.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssessmentRow({
  assessment,
  onRerun,
  onDelete,
  rerunPending,
}: {
  assessment: Assessment;
  onRerun: () => void;
  onDelete: () => void;
  rerunPending: boolean;
}) {
  const normalizedStatus = statusKey(assessment.status);
  const status = STATUS_STYLE[normalizedStatus] || STATUS_STYLE.pending;
  const Icon = status.icon;
  const isFinal = normalizedStatus === "complete" || normalizedStatus === "partial";
  const isRunning = RUNNING_STATUSES.includes(normalizedStatus);
  const isFailed = normalizedStatus === "failed";
  const primaryHref = isFinal
    ? `/app/assessment/${assessment.id}/results`
    : isRunning
    ? `/app/assessment/${assessment.id}/processing`
    : `/app/assessment/${assessment.id}/results`;

  return (
    <Card className="border border-[#D8D2C4] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase ${status.className}`}>
              <Icon className={`h-3 w-3 ${isRunning ? "animate-spin" : ""}`} />
              {status.label}
            </span>
            {assessment.dimensions_evaluated != null ? (
              <span className="rounded-full border border-[#D8D2C4] px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase text-[#6B6B66]">
                {assessment.dimensions_evaluated} of {(assessment.dimensions_evaluated ?? 0) + (assessment.dimensions_skipped ?? 0)} dims
              </span>
            ) : null}
            {assessment.confidence ? (
              <span className="rounded-full bg-[#F3EEE2] px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase text-[#5C5C5C]">
                {assessment.confidence} confidence
              </span>
            ) : null}
          </div>

          <Link to={primaryHref} className="group mt-2 block">
            <div className="flex items-center gap-2 text-[15px] text-[#161616] group-hover:text-[#315D8A]">
              <FileBarChart className="h-4 w-4 text-[#6B6B66] group-hover:text-[#315D8A]" />
              {assessmentTitle(assessment)}
            </div>
          </Link>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#6B6B66]">
            {assessment.project_title ? <span>project {assessment.project_title}</span> : null}
            {assessment.upload_count != null ? (
              <span>{assessment.upload_count} upload{assessment.upload_count === 1 ? "" : "s"}</span>
            ) : null}
            <span>created {dateTime(assessment.created_at)}</span>
            {assessment.updated_at && assessment.updated_at !== assessment.created_at ? (
              <span>updated {dateTime(assessment.updated_at)}</span>
            ) : null}
          </div>

          {isFailed && assessment.failure_reason ? (
            <div className="mt-3 rounded-md border border-[#E8B8B8] bg-[#FBEAEA] px-3 py-2 text-[12px] text-[#8B2F2F]">
              {assessment.failure_stage ? <span className="mr-2 text-[10px] uppercase tracking-[0.12em]">{assessment.failure_stage} stage</span> : null}
              {assessment.failure_reason}
            </div>
          ) : null}
          {isRunning ? (
            <div className="mt-3 rounded-md border border-[#D8D2C4] bg-[#FBF8F1] px-3 py-2 text-[12px] text-[#5C5C5C]">
              <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#315D8A]" />
                <span>Still running. This row updates automatically while the backend advances the assessment.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <Link to={primaryHref}>
            <Button variant="outline" size="sm" className="w-full">
              {isRunning ? (
                <>
                  <PlayCircle className="mr-2 h-3.5 w-3.5" />
                  Watch
                </>
              ) : (
                <>
                  Open
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </Link>
          {(isFinal || isFailed) ? (
            <Button variant="ghost" size="sm" onClick={onRerun} disabled={rerunPending}>
              {rerunPending ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
              )}
              {isFailed ? "Retry" : "Rerun"}
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" className="text-[#8B2F2F] hover:bg-[#F3D1D1]/40 hover:text-[#8B2F2F]" onClick={onDelete}>
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
