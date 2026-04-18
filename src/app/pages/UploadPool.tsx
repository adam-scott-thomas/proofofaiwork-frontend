import { Link } from "react-router";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAiCluster, usePool } from "../../hooks/useApi";
import { apiDelete } from "../../lib/api";
import { dateTime } from "../lib/poaw";

export default function UploadPool() {
  const qc = useQueryClient();
  const { data, isLoading } = usePool();
  const aiCluster = useAiCluster();

  const removeUpload = async (uploadId: string) => {
    try {
      await apiDelete(`/pool/${uploadId}`);
      toast.success("Upload removed from pool");
      qc.invalidateQueries({ queryKey: ["pool"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to remove upload");
    }
  };

  const runClustering = () => {
    aiCluster.mutate(undefined, {
      onSuccess: (result: any) => {
        const count = result?.projects?.length ?? 0;
        toast.success(`Clustering created ${count} project${count === 1 ? "" : "s"}`);
        qc.invalidateQueries({ queryKey: ["projects"] });
        qc.invalidateQueries({ queryKey: ["pool"] });
      },
      onError: (error: any) => toast.error(error?.message ?? "Clustering failed"),
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        Loading upload pool...
      </div>
    );
  }

  const conversations = Array.isArray(data?.conversations) ? data.conversations : [];

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Upload pool</div>
              <h1 className="mt-2 text-3xl tracking-tight">Parsed conversations waiting for structure.</h1>
              <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-[#5C5C5C]">
                Uploads land here after parsing. From here you can inspect conversations, remove bad inputs,
                or cluster the pool into projects.
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/app/upload/new">
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload more
                </Button>
              </Link>
              <Button variant="outline" onClick={runClustering} disabled={aiCluster.isPending}>
                {aiCluster.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Cluster into projects
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="grid grid-cols-3 gap-4">
          <Card className="border border-[#D8D2C4] bg-white p-5 shadow-sm">
            <div className="text-[12px] uppercase tracking-[0.12em] text-[#6B6B66]">Total</div>
            <div className="mt-2 text-3xl tracking-tight">{data?.total ?? 0}</div>
          </Card>
          <Card className="border border-[#D8D2C4] bg-white p-5 shadow-sm">
            <div className="text-[12px] uppercase tracking-[0.12em] text-[#6B6B66]">Unassigned</div>
            <div className="mt-2 text-3xl tracking-tight">{data?.unassigned ?? 0}</div>
          </Card>
          <Card className="border border-[#D8D2C4] bg-white p-5 shadow-sm">
            <div className="text-[12px] uppercase tracking-[0.12em] text-[#6B6B66]">Assigned</div>
            <div className="mt-2 text-3xl tracking-tight">{Math.max(0, (data?.total ?? 0) - (data?.unassigned ?? 0))}</div>
          </Card>
        </div>

        <div className="mt-6 space-y-3">
          {conversations.map((conversation: any) => (
            <Card key={conversation.upload_id} className="border border-[#D8D2C4] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-[15px]">{conversation.title}</div>
                  <div className="mt-2 text-[13px] text-[#5C5C5C]">
                    {conversation.turn_count} turns • {conversation.user_turn_count} user • {conversation.assistant_turn_count} assistant
                  </div>
                  <div className="mt-1 text-[12px] text-[#6B6B66]">
                    {conversation.source_format || "unknown format"} • {conversation.evidence_class} • {dateTime(conversation.created_at)}
                  </div>
                  <div className="mt-1 text-[12px] text-[#6B6B66]">
                    {(conversation.model_slugs ?? []).join(", ") || "model unknown"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/app/conversations/${conversation.upload_id}`}>
                    <Button variant="outline">Open</Button>
                  </Link>
                  {!conversation.project_id ? (
                    <Button variant="outline" onClick={() => removeUpload(conversation.upload_id)}>
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}

          {conversations.length === 0 ? (
            <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-8 text-[14px] text-[#5C5C5C] shadow-sm">
              Nothing has been parsed yet.
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
