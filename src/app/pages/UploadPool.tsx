import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Eraser,
  FolderKanban,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  Upload as UploadIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  useAiCluster,
  useAiClusterEstimate,
  useClearUnassignedPool,
  useClusterStatus,
  usePool,
  useReclusterProjects,
} from "../../hooks/useApi";
import { apiDelete, apiPost } from "../../lib/api";
import { dateTime } from "../lib/poaw";

type PoolConversation = {
  upload_id: string;
  title: string;
  file_name: string;
  turn_count: number;
  user_turn_count: number;
  assistant_turn_count: number;
  model_slugs: string[];
  source_format: string;
  create_time: number | null;
  evidence_class: "A" | "B" | "C" | "D";
  project_id: string | null;
  created_at: string;
};

type FilterKey = "all" | "unassigned" | "assigned";
type ClusterMode = "rule" | "ai";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "unassigned", label: "Unassigned" },
  { key: "assigned", label: "Assigned" },
];

const CLASS_STYLE: Record<string, string> = {
  A: "bg-[#1F6A3F] text-white",
  B: "bg-[#486E9B] text-white",
  C: "bg-[#C18A2E] text-white",
  D: "bg-[#8B2F2F] text-white",
};

export default function UploadPool() {
  const queryClient = useQueryClient();
  const { data, isLoading } = usePool();
  const aiCluster = useAiCluster();
  const reclusterProjects = useReclusterProjects();
  const clearUnassignedPool = useClearUnassignedPool();
  const estimate = useAiClusterEstimate();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [clusterOpen, setClusterOpen] = useState(false);
  const [clusterMode, setClusterMode] = useState<ClusterMode>("rule");
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [clearUnassignedOpen, setClearUnassignedOpen] = useState(false);
  const [clusterJobId, setClusterJobId] = useState<string | null>(null);
  const [clusterFinalized, setClusterFinalized] = useState(false);
  const clusterStatus = useClusterStatus(clusterJobId, !clusterFinalized);

  const removeUpload = useMutation({
    mutationFn: (uploadId: string) => apiDelete(`/pool/${uploadId}`),
    onSuccess: () => {
      toast.success("Removed from pool");
      queryClient.invalidateQueries({ queryKey: ["pool"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Remove failed"),
  });

  const cleanup = useMutation({
    mutationFn: () => apiPost(`/pool/cleanup-unparsed`, {}),
    onSuccess: (result: any) => {
      setCleanupOpen(false);
      toast.success(`Removed ${result?.removed ?? 0} unparsed upload${result?.removed === 1 ? "" : "s"}`);
      queryClient.invalidateQueries({ queryKey: ["pool"] });
    },
    onError: (error: any) => {
      setCleanupOpen(false);
      toast.error(error?.message ?? "Cleanup failed");
    },
  });

  const conversations: PoolConversation[] = Array.isArray(data?.conversations) ? data.conversations : [];

  const filtered = useMemo(() => {
    let result = conversations;
    if (filter === "unassigned") result = result.filter((conversation) => !conversation.project_id);
    if (filter === "assigned") result = result.filter((conversation) => conversation.project_id);
    if (query.trim()) {
      const needle = query.trim().toLowerCase();
      result = result.filter((conversation) =>
        conversation.title.toLowerCase().includes(needle) ||
        conversation.file_name.toLowerCase().includes(needle),
      );
    }
    return [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [conversations, filter, query]);

  const counts = {
    all: conversations.length,
    unassigned: conversations.filter((conversation) => !conversation.project_id).length,
    assigned: conversations.filter((conversation) => conversation.project_id).length,
  };

  const classBreakdown = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const conversation of conversations) counts[conversation.evidence_class] = (counts[conversation.evidence_class] ?? 0) + 1;
    return counts;
  }, [conversations]);

  useEffect(() => {
    const status = clusterStatus.data?.status;
    if (!clusterJobId || clusterFinalized || !status) return;

    if (status === "complete") {
      const count = clusterStatus.data.result?.projects?.length ?? 0;
      setClusterFinalized(true);
      toast.success(`Created ${count} project${count === 1 ? "" : "s"}`);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["pool"] });
    }

    if (status === "failed") {
      setClusterFinalized(true);
      toast.error(clusterStatus.data.error_message || "Grouping failed");
    }
  }, [clusterFinalized, clusterJobId, clusterStatus.data, queryClient]);

  const resetClusterJob = () => {
    setClusterJobId(null);
    setClusterFinalized(false);
  };

  const clusterJobActive =
    !!clusterJobId &&
    !clusterFinalized &&
    clusterStatus.data?.status !== "complete" &&
    clusterStatus.data?.status !== "failed";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading upload pool...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Upload pool</div>
              <h1 className="mt-2 text-3xl tracking-tight">Parsed conversations waiting for structure.</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#5C5C5C]">
                Uploads land here after parsing. Cluster them into projects, assign manually, or remove anything
                that doesn't belong. Evidence class is visible per file.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/app/upload/new">
                <Button>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Upload more
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setClusterMode("rule");
                  setClusterOpen(true);
                }}
                disabled={counts.unassigned === 0}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Cluster unassigned
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setClusterMode("ai");
                  setClusterOpen(true);
                }}
                disabled={counts.unassigned === 0}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Try AI clustering
              </Button>
              <Button variant="ghost" onClick={() => setClearUnassignedOpen(true)} disabled={counts.unassigned === 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete unassigned
              </Button>
              <Button variant="ghost" onClick={() => setCleanupOpen(true)}>
                <Eraser className="mr-2 h-4 w-4" />
                Cleanup unparsed
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <SummaryTile label="Total" value={counts.all} />
            <SummaryTile label="Unassigned" value={counts.unassigned} accent="#8A5F10" />
            <SummaryTile label="Assigned" value={counts.assigned} accent="#1F6A3F" />
            <Card className="border border-[#D8D2C4] bg-white p-4">
              <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">Evidence mix</div>
              <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-[#EAE3CF]">
                {(["A", "B", "C", "D"] as const).map((k) =>
                  classBreakdown[k] ? (
                    <div
                      key={k}
                      className={CLASS_STYLE[k].split(" ")[0]}
                      style={{ width: `${(classBreakdown[k] / Math.max(counts.all, 1)) * 100}%` }}
                      title={`${classBreakdown[k]} × ${k}`}
                    />
                  ) : null,
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-[#6B6B66]">
                {(["A", "B", "C", "D"] as const).map((k) =>
                  classBreakdown[k] ? (
                    <span key={k}>
                      {k}:{classBreakdown[k]}
                    </span>
                  ) : null,
                )}
              </div>
            </Card>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {FILTERS.map((filterConfig) => {
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
            </div>
            <div className="relative ml-auto w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B6B66]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pool..."
                className="pl-7"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-10 text-center text-[14px] text-[#5C5C5C]">
              {conversations.length === 0 ? (
                <>
                  Nothing parsed yet.{" "}
                  <Link to="/app/upload/new" className="underline">
                    Upload files to get started.
                  </Link>
                </>
              ) : (
                <>No matches for the current filter.</>
              )}
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((conversation) => (
                <ConversationRow
                  key={conversation.upload_id}
                  conversation={conversation}
                  onRemove={() => removeUpload.mutate(conversation.upload_id)}
                  removePending={removeUpload.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={clusterOpen}
        onOpenChange={(open) => {
          setClusterOpen(open);
          if (!open && !clusterJobActive) resetClusterJob();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{clusterMode === "ai" ? "Try AI clustering" : "Cluster unassigned conversations"}</DialogTitle>
            <DialogDescription>
              {clusterMode === "ai"
                ? "Dissolves current suggested projects and asks the AI clusterer to regroup unassigned conversations. Confirmed work is untouched."
                : "The engine groups similar conversations into suggested projects. You confirm or rename each project before running an assessment."}
            </DialogDescription>
          </DialogHeader>
          {estimate.data ? (
            <div className="rounded-md border border-[#D8D2C4] bg-[#FBF8F1] p-3 text-[13px] text-[#5C5C5C]">
              <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">Estimate</div>
              <div className="mt-1">
                {estimate.data.conversation_count ?? 0} unassigned conversation{estimate.data.conversation_count === 1 ? "" : "s"} ready for grouping
              </div>
            </div>
          ) : null}
          {clusterJobId ? (
            <div className={`rounded-md border p-3 text-[13px] ${
              clusterStatus.data?.status === "failed"
                ? "border-[#E8B8B8] bg-[#FBEAEA] text-[#8B2F2F]"
                : clusterStatus.data?.status === "complete"
                  ? "border-[#BFD8C5] bg-[#EFF8F1] text-[#1F6A3F]"
                  : "border-[#D8D2C4] bg-[#FBF8F1] text-[#5C5C5C]"
            }`}>
              <div className="flex items-center gap-2">
                {clusterJobActive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                <span className="font-medium">
                  {clusterStatus.data?.status === "complete"
                    ? "Grouping complete"
                    : clusterStatus.data?.status === "failed"
                      ? "Grouping failed"
                      : clusterStatus.data?.status === "running"
                        ? "Grouping conversations"
                        : "Grouping queued"}
                </span>
              </div>
              {clusterStatus.data?.status === "complete" ? (
                <div className="mt-1 text-[12px]">
                  {clusterStatus.data.result?.projects?.length ?? 0} project{(clusterStatus.data.result?.projects?.length ?? 0) === 1 ? "" : "s"} created,
                  {" "}{clusterStatus.data.result?.unclustered_count ?? 0} left unclustered.
                </div>
              ) : null}
              {clusterStatus.data?.status === "failed" ? (
                <div className="mt-1 text-[12px]">
                  {clusterStatus.data.error_message || "The clustering job failed."}
                </div>
              ) : null}
            </div>
          ) : null}
          {(aiCluster.isPending || reclusterProjects.isPending) && !clusterJobId ? (
            <div className="rounded-md border border-[#D8D2C4] bg-[#FBF8F1] p-3 text-[13px] text-[#5C5C5C]">
              <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#315D8A]" />
                <span className="font-medium">Calling {clusterMode === "ai" ? "AI " : ""}clustering API...</span>
              </div>
              <div className="mt-1 text-[12px]">Waiting for the backend to accept the job.</div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setClusterOpen(false)} disabled={clusterJobActive}>
              {clusterStatus.data?.status === "complete" || clusterStatus.data?.status === "failed" ? "Close" : "Cancel"}
            </Button>
            <Button
              disabled={aiCluster.isPending || reclusterProjects.isPending || clusterJobActive}
              onClick={() => {
                toast.info(`Calling ${clusterMode === "ai" ? "AI " : ""}clustering API...`);
                const mutation = clusterMode === "ai" ? reclusterProjects : aiCluster;
                const body = clusterMode === "ai" ? { mode: "ai" as const, tier: "free" as const } : { tier: "free" as const };
                mutation.mutate(body as any, {
                  onSuccess: (result: any) => {
                    if (!result?.job_id) {
                      toast.error("Grouping did not return a job id");
                      return;
                    }
                    setClusterFinalized(false);
                    setClusterJobId(result.job_id);
                    toast.success(`${clusterMode === "ai" ? "AI " : ""}grouping job queued`);
                    if (result.dissolved_suggestions > 0) {
                      toast.success(`Dissolved ${result.dissolved_suggestions} suggested project${result.dissolved_suggestions === 1 ? "" : "s"}`);
                    }
                  },
                  onError: (error: any) => {
                    toast.error(error?.message ?? "Grouping failed");
                  },
                });
              }}
            >
              {aiCluster.isPending || reclusterProjects.isPending || clusterJobActive ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {aiCluster.isPending || reclusterProjects.isPending
                ? "Calling API..."
                : clusterJobActive
                  ? clusterMode === "ai" ? "AI thinking..." : "Grouping..."
                  : clusterMode === "ai" ? "Try AI clustering" : "Run grouping"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={clearUnassignedOpen} onOpenChange={setClearUnassignedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all unassigned conversations?</DialogTitle>
            <DialogDescription>
              This permanently deletes every upload that is not currently assigned to a project. Assigned
              conversations are skipped.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setClearUnassignedOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#8B2F2F] hover:bg-[#7A2525]"
              disabled={clearUnassignedPool.isPending || counts.unassigned === 0}
              onClick={() =>
                clearUnassignedPool.mutate(undefined, {
                  onSuccess: (result) => {
                    toast.success(`Deleted ${result.deleted} unassigned upload${result.deleted === 1 ? "" : "s"}`);
                    setClearUnassignedOpen(false);
                  },
                  onError: (error: any) => toast.error(error?.message ?? "Delete unassigned failed"),
                })
              }
            >
              {clearUnassignedPool.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete unassigned
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cleanupOpen} onOpenChange={setCleanupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cleanup unparsed uploads?</DialogTitle>
            <DialogDescription>
              This removes any upload still stuck at pending or failed parse. Successfully parsed conversations
              stay. Nothing is undoable.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCleanupOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#8B2F2F] hover:bg-[#7A2525]"
              disabled={cleanup.isPending}
              onClick={() => cleanup.mutate()}
            >
              {cleanup.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eraser className="mr-2 h-4 w-4" />}
              Clean up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryTile({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <Card className="border border-[#D8D2C4] bg-white p-4">
      <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">{label}</div>
      <div className="mt-1 text-3xl tracking-tight" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </Card>
  );
}

function ConversationRow({
  conversation,
  onRemove,
  removePending,
}: {
  conversation: PoolConversation;
  onRemove: () => void;
  removePending: boolean;
}) {
  const turnSplit = `${conversation.user_turn_count}u · ${conversation.assistant_turn_count}a`;
  return (
    <Card className="border border-[#D8D2C4] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${CLASS_STYLE[conversation.evidence_class] || ""}`}>
              Class {conversation.evidence_class}
            </span>
            <span className="rounded-full border border-[#D8D2C4] px-2 py-0.5 text-[10px] tracking-[0.08em] text-[#6B6B66]">
              {conversation.source_format || "unknown"}
            </span>
            {conversation.project_id ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#D3E9D9] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#1F6A3F]">
                <FolderKanban className="h-2.5 w-2.5" />
                Assigned
              </span>
            ) : (
              <span className="rounded-full bg-[#F8E5C2] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#8A5F10]">
                Unassigned
              </span>
            )}
          </div>

          <Link to={`/app/conversations/${conversation.upload_id}`} className="group mt-2 block">
            <div className="truncate text-[15px] text-[#161616] group-hover:text-[#315D8A]">
              {conversation.title}
            </div>
          </Link>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#6B6B66]">
            <span>{conversation.turn_count} turns · {turnSplit}</span>
            {conversation.model_slugs.length > 0 ? <span>{conversation.model_slugs.join(", ")}</span> : null}
            <span>added {dateTime(conversation.created_at)}</span>
            <span className="text-[#6B6B66]">{conversation.file_name}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <Link to={`/app/conversations/${conversation.upload_id}`}>
            <Button variant="outline" size="sm" className="w-full">
              Open
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </Link>
          {!conversation.project_id ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-[#8B2F2F] hover:bg-[#F3D1D1]/40 hover:text-[#8B2F2F]"
              onClick={onRemove}
              disabled={removePending}
            >
              {removePending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-2 h-3.5 w-3.5" />}
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
