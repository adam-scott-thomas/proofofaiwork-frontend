import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { apiFetch, apiPost } from "../../lib/api";

type Assessment = {
  id: string;
  status: string;
  engine_version?: string;
  dimensions_evaluated?: number | null;
  dimensions_skipped?: number | null;
  retry_count?: number;
  started_at?: string | null;
  completed_at?: string | null;
  failed_at?: string | null;
  failure_reason?: string | null;
  failure_stage?: string | null;
  task_context?: string | null;
};

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

export default function Processing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [elapsed, setElapsed] = useState(0);

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

  useEffect(() => {
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const status = assessmentQuery.data?.status;
    if (status === "complete" || status === "partial") {
      const timeout = setTimeout(() => navigate(`/app/assessment/${id}/results`, { replace: true }), 1000);
      return () => clearTimeout(timeout);
    }
  }, [assessmentQuery.data?.status, id, navigate]);

  const assessment = assessmentQuery.data;
  const status = assessment?.status ?? "pending";

  if (assessmentQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading assessment...
      </div>
    );
  }

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
            <h1 className="text-3xl tracking-tight">This assessment did not complete.</h1>
            <Card className="border border-[#E8B8B8] bg-[#FBEAEA] p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#8B2F2F]" />
                <div>
                  <div className="text-[12px] uppercase tracking-[0.1em] text-[#8B2F2F]">
                    {assessment?.failure_stage || "assessment"} stage · retry {assessment?.retry_count ?? 0}
                  </div>
                  <div className="mt-1 text-[14px] leading-relaxed text-[#5C5C5C]">
                    {assessment?.failure_reason || "No reason recorded."}
                  </div>
                </div>
              </div>
            </Card>
            <Button onClick={() => rerun.mutate()} disabled={rerun.isPending}>
              {rerun.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Retry
            </Button>
          </div>
        </div>
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
          <h1 className="mt-4 text-3xl tracking-tight">Assessment processing.</h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#5C5C5C]">
            Status: {status}. This page polls the assessment record until results are ready.
          </p>
        </div>
      </header>
      <div className="px-8 py-10">
        <div className="mx-auto max-w-3xl space-y-4">
          <Card className="border border-[#D8D2C4] bg-white p-5">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-[#315D8A]" />
              <div>
                <div className="text-[14px] text-[#161616]">Working</div>
                <div className="text-[12px] text-[#6B6B66]">Elapsed {formatDuration(elapsed)}</div>
              </div>
            </div>
          </Card>
          <Link to={`/app/assessment/${id}/results`}>
            <Button variant="outline">
              Check results
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
