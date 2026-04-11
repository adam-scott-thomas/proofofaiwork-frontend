import { Upload, AlertCircle, CheckCircle2, Clock, Download, Trash2 } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useState } from "react";
import { UploadDialog } from "../components/UploadDialog";
import { usePool, useUploads } from "../../hooks/useApi";

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

  const { data: poolData, isLoading: poolLoading } = usePool();
  const { data: uploadsData, isLoading: uploadsLoading } = useUploads();

  const isLoading = poolLoading || uploadsLoading;

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center text-[13px] text-[#717182]">Loading...</div>
  );

  const uploads: any[] = Array.isArray(uploadsData) ? uploadsData : uploadsData?.data ?? uploadsData?.items ?? [];

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
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Conversations
            </Button>
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
            <Button variant="outline">
              Free Clustering
              <span className="ml-2 text-[11px] text-[#717182]">Rule-based</span>
            </Button>
            <Button>
              AI Clustering
              <span className="ml-2 text-[11px]">$7</span>
            </Button>
          </div>
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
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                      {(upload.status === "error" || upload.status === "failed") && (
                        <Button variant="outline" size="sm">
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
    </div>
  );
}
