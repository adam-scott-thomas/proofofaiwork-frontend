import { Upload, AlertCircle, CheckCircle2, Clock, Download, Trash2, Loader2, Sparkles, Eraser } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useState } from "react";
import { UploadDialog } from "../components/UploadDialog";
import { PaymentModal } from "../components/PaymentModal";
import ProgressSteps from "../components/ProgressSteps";
import { usePool, useTriggerClustering, useDirectUpload, useAiCluster } from "../../hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDelete, apiPost } from "../../lib/api";

function StatusBadge({ status, progress }: { status: string; progress?: number }) {
  if (status === "completed" || status === "done") {
    return (
      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Completed
      </Badge>
    );
  }
  if (status === "parsing" || status === "processing") {
    return (
      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
        <Clock className="mr-1 h-3 w-3" />
        Parsing{progress != null ? ` ${progress}%` : ""}
      </Badge>
    );
  }
  if (status === "error" || status === "failed") {
    return (
      <Badge variant="destructive">
        <AlertCircle className="mr-1 h-3 w-3" />
        Error
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-[#F5F5F7] text-[#717182]">
      {status}
    </Badge>
  );
}

export default function UploadPool() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [clusterDone, setClusterDone] = useState(false);
  const [clusterResult, setClusterResult] = useState<{ projects: number; unclustered: number } | null>(null);
  const qc = useQueryClient();
  const clusterMutation = useTriggerClustering();
  const aiClusterMutation = useAiCluster();
  const retryUpload = useDirectUpload();

  const handleCleanupUnparsed = async () => {
    if (!window.confirm("Delete all unparsed pool items? This cannot be undone.")) return;
    setCleaningUp(true);
    try {
      const res: any = await apiPost("/pool/cleanup-unparsed", {});
      const n = res?.deleted ?? res?.count ?? 0;
      toast.success(`Deleted ${n} unparsed item${n !== 1 ? "s" : ""}`);
      qc.invalidateQueries({ queryKey: ["pool"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Cleanup failed");
    } finally {
      setCleaningUp(false);
    }
  };

  const FREE_CLUSTER_STEPS = [
    { label: "Reading conversations", duration: 1200 },
    { label: "Matching titles", duration: 1800 },
    { label: "Grouping by time window", duration: 1500 },
    { label: "Naming projects", duration: 1000 },
    { label: "Finalizing", duration: 800 },
  ];

  const handleDelete = async (uploadId: string) => {
    setDeletingId(uploadId);
    try {
      await apiDelete(`/pool/${uploadId}`);
      toast.success("Upload deleted");
      qc.invalidateQueries({ queryKey: ["uploads"] });
      qc.invalidateQueries({ queryKey: ["pool"] });
    } catch {
      toast.error("Failed to delete upload");
    } finally {
      setDeletingId(null);
    }
  };

  const { data: poolData, isLoading: poolLoading } = usePool();

  const isLoading = poolLoading;

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center text-[13px] text-[#717182]">Loading...</div>
  );

  const uploads: any[] = poolData?.conversations ?? [];

  // Pool stats — use poolData if available, otherwise derive from uploads
  const pool = poolData ?? {};
  const totalConversations = pool.total_conversations ?? pool.conversation_count ?? uploads.reduce((s: number, u: any) => s + (u.conversation_count ?? 0), 0);
  const unassigned = pool.unassigned ?? pool.unassigned_count ?? 0;
  const suggestedProjects = pool.suggested_projects ?? pool.cluster_suggestions ?? 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl tracking-tight">Upload Pool</h1>
              <p className="mt-1 text-[13px] text-[#717182]">
                Imported conversations awaiting project assignment
              </p>
            </div>
            <div className="flex items-center gap-2">
              {uploads.some((u: any) => !u.turn_count) && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cleaningUp}
                  onClick={handleCleanupUnparsed}
                >
                  {cleaningUp ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Eraser className="mr-2 h-4 w-4" />
                  )}
                  Clean up unparsed
                </Button>
              )}
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Conversations
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Stats Bar */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-4 shadow-sm">
            <div className="text-[13px] text-[#717182]">Total Conversations</div>
            <div className="mt-1 text-2xl tracking-tight">{totalConversations}</div>
          </Card>
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-4 shadow-sm">
            <div className="text-[13px] text-[#717182]">Unassigned</div>
            <div className="mt-1 text-2xl tracking-tight">{unassigned}</div>
          </Card>
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-4 shadow-sm">
            <div className="text-[13px] text-[#717182]">Suggested Projects</div>
            <div className="mt-1 text-2xl tracking-tight">{suggestedProjects}</div>
          </Card>
        </div>

        {/* Clustering Actions */}
        <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="mb-1 text-[15px]">Organize Conversations</h3>
            <p className="text-[13px] text-[#717182]">
              Cluster conversations into projects using rule-based or AI-powered analysis
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              disabled={clusterMutation.isPending}
              onClick={() => {
                setClusterDone(false);
                setClusterResult(null);
                clusterMutation.mutate(undefined, {
                  onSuccess: (data: any) => {
                    setClusterDone(true);
                    setClusterResult({
                      projects: data?.projects?.length ?? data?.project_count ?? 0,
                      unclustered: data?.unclustered_count ?? data?.unclustered ?? 0,
                    });
                    qc.invalidateQueries({ queryKey: ["projects"] });
                    qc.invalidateQueries({ queryKey: ["pool"] });
                  },
                  onError: (err: any) => toast.error(err?.message ?? "Clustering failed"),
                });
              }}
            >
              {clusterMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Free Clustering
              <span className="ml-2 text-[11px] text-[#717182]">Rule-based</span>
            </Button>
            <Button
              disabled={aiClusterMutation.isPending}
              onClick={() => {
                aiClusterMutation.mutate(undefined, {
                  onSuccess: (data: any) => {
                    setClusterDone(true);
                    setClusterResult({
                      projects: data?.projects?.length ?? data?.project_count ?? 0,
                      unclustered: data?.unclustered_count ?? data?.unclustered ?? 0,
                    });
                    qc.invalidateQueries({ queryKey: ["projects"] });
                    qc.invalidateQueries({ queryKey: ["pool"] });
                    toast.success("AI clustering complete");
                  },
                  onError: (err: any) => toast.error(err?.message ?? "AI clustering failed"),
                });
              }}
            >
              {aiClusterMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              AI Clustering
              <span className="ml-2 text-[11px]">$0 · Free until Friday</span>
            </Button>
          </div>

          {/* Progress stepper appears during and after clustering */}
          {(clusterMutation.isPending || clusterDone) && (
            <div className="mt-5 rounded-md border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] p-4">
              <ProgressSteps
                steps={FREE_CLUSTER_STEPS}
                active={clusterMutation.isPending || clusterDone}
                done={clusterDone}
                doneLabel={
                  clusterResult
                    ? `→ ${clusterResult.projects} project${clusterResult.projects !== 1 ? "s" : ""} created${
                        clusterResult.unclustered > 0 ? ` · ${clusterResult.unclustered} unclustered` : ""
                      }`
                    : "Clustering complete"
                }
              />
            </div>
          )}
        </Card>

        {/* Uploads List */}
        <Card className="border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
          <div className="border-b border-[rgba(0,0,0,0.06)] px-6 py-4">
            <h3 className="text-[15px]">Upload History</h3>
          </div>
          {uploads.length === 0 ? (
            <div className="px-6 py-8 text-center text-[13px] text-[#717182]">
              No uploads yet. Click "Upload Conversations" to get started.
            </div>
          ) : (
            <div className="divide-y divide-[rgba(0,0,0,0.04)]">
              {uploads.map((upload: any) => (
                <div key={upload.id} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <div className="text-[14px]">{upload.filename ?? upload.name ?? upload.id}</div>
                        <StatusBadge status={upload.status ?? "unknown"} progress={upload.progress} />
                      </div>
                      <div className="flex items-center gap-4 text-[13px] text-[#717182]">
                        {upload.size && <span className="font-mono">{upload.size}</span>}
                        {upload.conversation_count != null && upload.conversation_count > 0 && (
                          <span>{upload.conversation_count} conversations</span>
                        )}
                        {(upload.created_at ?? upload.uploaded_at) && (
                          <span>
                            {new Date(upload.created_at ?? upload.uploaded_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      {(upload.status === "parsing" || upload.status === "processing") && upload.progress != null && (
                        <div className="mt-3">
                          <Progress value={upload.progress} className="h-1.5" />
                        </div>
                      )}
                      {(upload.status === "error" || upload.status === "failed") && upload.error && (
                        <div className="mt-2 rounded-sm bg-red-50 px-3 py-2 text-[13px] text-red-800">
                          {upload.error}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {(upload.status === "completed" || upload.status === "done") && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const assessmentId = upload.assessment_id ?? upload.id;
                              try {
                                const { useAuthStore } = await import("../../stores/authStore");
                                const token = useAuthStore.getState().token;
                                const apiHost = (import.meta as any).env?.VITE_API_URL || "";
                                const base = apiHost ? `${apiHost.replace(/\/$/, "")}/api/v1` : "/api/v1";
                                const resp = await fetch(`${base}/assessments/${assessmentId}/download?format=json`, {
                                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                                });
                                if (!resp.ok) { toast.error("Download failed"); return; }
                                const blob = await resp.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `assessment-${assessmentId}.json`;
                                a.click();
                                URL.revokeObjectURL(url);
                              } catch {
                                toast.error("Download failed");
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === upload.id}
                            onClick={() => handleDelete(upload.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                      {(upload.status === "error" || upload.status === "failed") && (
                        <Button variant="outline" size="sm" onClick={() => toast.info("Retry: re-upload the file to try again")}>
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <UploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        onComplete={() => {
          qc.invalidateQueries({ queryKey: ["projects"] });
          qc.invalidateQueries({ queryKey: ["pool"] });
          toast.success("AI Sort complete — check Projects page");
        }}
      />
    </div>
  );
}
