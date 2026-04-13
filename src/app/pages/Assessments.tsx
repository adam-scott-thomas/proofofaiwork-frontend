import { ClipboardList, Plus, ChevronRight, Clock, CheckCircle2, XCircle, RotateCw } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Link, useNavigate } from "react-router";
import { useAssessments } from "../../hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";
import { apiPost } from "../../lib/api";
import { toast } from "sonner";
import { useState } from "react";

function StatusBadge({ status, progress }: { status: string; progress?: number }) {
  if (status === "completed") {
    return (
      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Completed
      </Badge>
    );
  }
  if (status === "running") {
    return (
      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
        <Clock className="mr-1 h-3 w-3" />
        Running {progress != null ? `${progress}%` : ""}
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge variant="destructive">
        <XCircle className="mr-1 h-3 w-3" />
        Failed
      </Badge>
    );
  }
  return null;
}

export default function Assessments() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [rerunningId, setRerunningId] = useState<string | null>(null);
  const { data: assessmentsData, isLoading } = useAssessments();

  const handleRerun = async (assessmentId: string) => {
    setRerunningId(assessmentId);
    try {
      await apiPost(`/assessments/${assessmentId}/rerun`, {});
      toast.success("Assessment queued for rerun");
      qc.invalidateQueries({ queryKey: ["assessments"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Rerun failed");
    } finally {
      setRerunningId(null);
    }
  };

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center text-[13px] text-[#717182]">Loading...</div>
  );

  const assessments: any[] = Array.isArray(assessmentsData) ? assessmentsData : assessmentsData?.data ?? assessmentsData?.items ?? [];

  const verifiedAssessments = assessments.filter((a: any) => a.status === "completed" && a.confidence === "high");
  const incompleteAssessments = assessments.filter((a: any) => a.status !== "completed" || a.confidence === "low");

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl tracking-tight">Assessments</h1>
              <p className="mt-1 text-[13px] text-[#717182]">
                Run forensic evaluations to generate AI Work Profile scores
              </p>
            </div>
            <Button onClick={() => navigate("/app/projects")}>
              <Plus className="mr-2 h-4 w-4" />
              New Assessment
            </Button>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Info Card */}
        <Card className="mb-6 border border-blue-200 bg-blue-50 p-6 shadow-sm">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 flex-shrink-0">
              <ClipboardList className="h-5 w-5 text-blue-700" />
            </div>
            <div className="flex-1">
              <h3 className="mb-1 text-[15px] text-blue-900">How Assessments Work</h3>
              <p className="text-[13px] text-blue-800">
                Assessments analyze your AI conversations to compute HLS (Human Leadership Score), AI Execution Load,
                and CAI (Cognitive Amplification Index). Each assessment requires completed projects with ship proof
                for accurate measurement. Results are used to generate proof pages and portfolios.
              </p>
            </div>
          </div>
        </Card>

        {assessments.length === 0 ? (
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-8 text-center shadow-sm">
            <p className="text-[13px] text-[#717182]">No assessments yet. Click "New Assessment" to get started.</p>
          </Card>
        ) : (
          <>
            {/* Verified Results */}
            {verifiedAssessments.length > 0 && (
              <div className="mb-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'var(--score-execution)' }} />
                  <h2 className="text-[15px]">Verified Results</h2>
                  <span className="text-[13px] text-[#717182]">
                    → {verifiedAssessments.length} high confidence assessment{verifiedAssessments.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="mb-4 text-[13px] text-[#717182] max-w-2xl">
                  Completed with high confidence • Usable for proof pages and profiles
                </p>

                <div className="space-y-3">
                  {verifiedAssessments.map((assessment: any) => (
                    <Card key={assessment.id} className="border border-[rgba(0,0,0,0.08)] bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="px-6 py-5">
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-3">
                              <div className="text-[15px]">{assessment.name ?? assessment.id}</div>
                              <StatusBadge status={assessment.status} progress={assessment.progress} />
                            </div>

                            <div className="mb-3 flex items-center gap-4 text-[13px] text-[#717182]">
                              {assessment.project_count != null && <span>{assessment.project_count} projects</span>}
                              {assessment.conversation_count != null && <span>{assessment.conversation_count} conversations</span>}
                              {assessment.created_at && (
                                <span className="font-mono">
                                  {new Date(assessment.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-4">
                              {assessment.cai != null && (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[11px] uppercase tracking-wider text-[#717182]">CAI</span>
                                  <span className="font-mono text-[18px]" style={{ color: 'var(--score-cai)' }}>
                                    {assessment.cai}
                                  </span>
                                </div>
                              )}
                              {assessment.hls != null && (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[11px] uppercase tracking-wider text-[#717182]">HLS</span>
                                  <span className="font-mono text-[18px]" style={{ color: 'var(--score-hls)' }}>
                                    {assessment.hls}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link to={`/app/assessment/${assessment.id}/results`}>
                              <Button variant="outline" size="sm">
                                View Results
                              </Button>
                            </Link>
                            <ChevronRight className="h-4 w-4 text-[#717182]" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Incomplete / Low Confidence */}
            {incompleteAssessments.length > 0 && (
              <div className="mb-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#C0C0C5]" />
                  <h2 className="text-[15px] text-[#717182]">Incomplete / Low Confidence</h2>
                </div>
                <p className="mb-4 text-[13px] text-[#717182] max-w-2xl">
                  Failed, running, or completed with weak data
                </p>

                <Card className="border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] shadow-none">
                  <div className="divide-y divide-[rgba(0,0,0,0.04)]">
                    {incompleteAssessments.map((assessment: any) => (
                      <div key={assessment.id} className="px-6 py-4 hover:bg-white/50 transition-colors">
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-3">
                              <div className="text-[14px] text-[#717182]">{assessment.name ?? assessment.id}</div>
                              <StatusBadge status={assessment.status} progress={assessment.progress} />
                            </div>

                            <div className="mb-2 flex items-center gap-4 text-[13px] text-[#C0C0C5]">
                              {assessment.project_count != null && <span>{assessment.project_count} projects</span>}
                              {assessment.conversation_count != null && <span>{assessment.conversation_count} conversations</span>}
                              {assessment.created_at && (
                                <span className="font-mono">
                                  {new Date(assessment.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              )}
                            </div>

                            {assessment.status === "running" && assessment.progress != null && (
                              <div className="mb-2">
                                <Progress value={assessment.progress} className="h-1.5" />
                              </div>
                            )}

                            {assessment.status === "completed" && assessment.confidence === "low" && (
                              <div className="rounded-sm bg-yellow-50 px-3 py-2 text-[13px] text-yellow-800 border border-yellow-200">
                                Low confidence • Not recommended for proof pages
                              </div>
                            )}

                            {assessment.status === "failed" && assessment.error && (
                              <div className="rounded-sm bg-red-50 px-3 py-2 text-[13px] text-red-800 border border-red-200">
                                {assessment.error}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {assessment.status === "failed" && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={rerunningId === assessment.id}
                                onClick={() => handleRerun(assessment.id)}
                              >
                                <RotateCw className={`mr-2 h-4 w-4 ${rerunningId === assessment.id ? "animate-spin" : ""}`} />
                                {rerunningId === assessment.id ? "Queuing…" : "Retry"}
                              </Button>
                            )}
                            {assessment.status === "running" && (
                              <Button variant="ghost" size="sm" disabled>
                                <Clock className="h-4 w-4 animate-spin" />
                              </Button>
                            )}
                            {assessment.status === "completed" && assessment.confidence === "low" && (
                              <Link to={`/app/assessment/${assessment.id}/results`}>
                                <Button variant="outline" size="sm">
                                  View Anyway
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-sm">
                <div className="text-[13px] text-[#717182]">Total Assessments</div>
                <div className="mt-1 text-2xl tracking-tight">{assessments.length}</div>
              </Card>
              <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-sm">
                <div className="text-[13px] text-[#717182]">Verified Results</div>
                <div className="mt-1 text-2xl tracking-tight">{verifiedAssessments.length}</div>
                <div className="mt-1 text-[12px] text-[#717182]">
                  → ready to use
                </div>
              </Card>
              <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-sm">
                <div className="text-[13px] text-[#717182]">Incomplete</div>
                <div className="mt-1 text-2xl tracking-tight">{incompleteAssessments.length}</div>
                <div className="mt-1 text-[12px] text-[#717182]">
                  → failed or low confidence
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
