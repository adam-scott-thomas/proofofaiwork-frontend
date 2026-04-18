import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { apiFetch, apiPost } from "../../lib/api";

const STAGES = [
  { key: "pending", label: "Queued" },
  { key: "parsing", label: "Reading conversation" },
  { key: "normalizing", label: "Structuring the data" },
  { key: "gating", label: "Checking what can be evaluated" },
  { key: "evaluating", label: "Scoring the work" },
  { key: "aggregating", label: "Compiling results" },
  { key: "complete", label: "Done" },
];

export default function Processing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState(0);
  const [observations, setObservations] = useState<any[]>([]);

  const { data: assessment } = useQuery({
    queryKey: ["assessment", id],
    queryFn: () => apiFetch<any>(`/assessments/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "complete" || status === "partial" || status === "failed" ? false : 2500;
    },
  });

  const rerun = useMutation({
    mutationFn: () => apiPost(`/assessments/${id}/rerun`, {}),
  });

  useEffect(() => {
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!id) return;
    const status = assessment?.status;
    if (status === "complete" || status === "partial" || status === "failed") return;
    let live = true;
    const tick = async () => {
      try {
        const data = await apiFetch<any>(`/assessments/${id}/live-observations`);
        if (live) setObservations(Array.isArray(data?.observations) ? data.observations : []);
      } catch {
        // ignore live polling failures
      }
    };
    tick();
    const interval = setInterval(tick, 2500);
    return () => {
      live = false;
      clearInterval(interval);
    };
  }, [assessment?.status, id]);

  useEffect(() => {
    if (assessment?.status === "complete" || assessment?.status === "partial") {
      const timeout = setTimeout(() => navigate(`/app/assessment/${id}/results`, { replace: true }), 1200);
      return () => clearTimeout(timeout);
    }
  }, [assessment?.status, id, navigate]);

  const activeIndex = useMemo(() => {
    const status = assessment?.status ?? "pending";
    const stageIndex = STAGES.findIndex((stage) => stage.key === status);
    if (stageIndex >= 0) return stageIndex;
    if (status === "partial") return STAGES.length - 1;
    return 0;
  }, [assessment?.status]);

  if (assessment?.status === "failed") {
    return (
      <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
        <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
          <div className="px-8 py-8">
            <Link to="/app" className="inline-flex items-center gap-2 text-[13px] text-[#5C5C5C] hover:text-[#161616]">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          </div>
        </header>
        <div className="px-8 py-12">
          <div className="mx-auto max-w-2xl">
            <Card className="border border-[#E4B7B2] bg-white p-8 shadow-sm">
              <div className="text-2xl tracking-tight">Processing failed.</div>
              <div className="mt-3 text-[15px] leading-8 text-[#8E3B34]">
                {assessment.failure_reason || "The assessment could not complete."}
              </div>
              <div className="mt-6 flex gap-3">
                <Button onClick={() => rerun.mutate()} disabled={rerun.isPending}>
                  {rerun.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Retry
                </Button>
                <Link to="/app/upload/new">
                  <Button variant="outline">Upload again</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-8">
          <Link to="/app" className="inline-flex items-center gap-2 text-[13px] text-[#5C5C5C] hover:text-[#161616]">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <div className="mt-5">
            <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Processing</div>
            <h1 className="mt-2 text-3xl tracking-tight">
              {assessment?.status === "complete" || assessment?.status === "partial" ? "Assessment complete." : "Assessment in progress."}
            </h1>
            <p className="mt-2 text-[15px] text-[#5C5C5C]">
              {elapsed < 60 ? `${elapsed}s elapsed` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s elapsed`}
            </p>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
            <div className="space-y-4">
              {STAGES.map((stage, index) => {
                const complete = index < activeIndex;
                const active = index === activeIndex && assessment?.status !== "complete" && assessment?.status !== "partial";
                const done = (assessment?.status === "complete" || assessment?.status === "partial") && index === STAGES.length - 1;
                return (
                  <div key={stage.key} className="flex items-center gap-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] ${
                      complete || done
                        ? "bg-[#E7F2E9] text-[#2F6B3B]"
                        : active
                        ? "bg-[#E7EEF6] text-[#315D8A]"
                        : "bg-[#F3EEE2] text-[#6B6B66]"
                    }`}>
                      {complete || done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : index + 1}
                    </div>
                    <div className="flex-1">
                      <div className={`text-[14px] ${active ? "text-[#161616]" : "text-[#5C5C5C]"}`}>{stage.label}</div>
                      {active ? <div className="mt-1 h-1.5 rounded-full bg-[#E7EEF6]" /> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {observations.length > 0 ? (
            <Card className="mt-6 border border-[#D8D2C4] bg-white p-6 shadow-sm">
              <div className="text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Live observations</div>
              <div className="mt-4 space-y-3">
                {observations.map((observation: any) => (
                  <div key={observation.dimension} className="rounded-md border border-[#D8D2C4] bg-[#FBF8F1] px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-[14px]">{observation.dimension}</div>
                      {observation.score != null ? (
                        <div className="text-[13px] text-[#315D8A]">{Math.round(observation.score * 100)}%</div>
                      ) : null}
                    </div>
                    {observation.summary ? (
                      <div className="mt-1 text-[12px] text-[#5C5C5C]">{observation.summary}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
