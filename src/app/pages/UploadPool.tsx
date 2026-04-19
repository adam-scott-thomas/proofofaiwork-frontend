import { useMemo, useState } from "react";
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
import { useAiCluster, useAiClusterEstimate, usePool } from "../../hooks/useApi";
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
  const estimate = useAiClusterEstimate();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [clusterOpen, setClusterOpen] = useState(false);
  const [cleanupOpen, setCleanupOpen] = useState(false);

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
              <Button variant="outline" onClick={() => setClusterOpen(true)} disabled={counts.unassigned === 0}>
                <Sparkles className="mr-2 h-4 w-4" />
                Cluster unassigned
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

      <Dialog open={clusterOpen} onOpenChange={setClusterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cluster unassigned conversations</DialogTitle>
            <DialogDescription>
              The engine groups similar conversations into suggested projects. You confirm or rename each
              project before running an assessment.
            </DialogDescription>
          </DialogHeader>
          {estimate.data ? (
            <div className="rounded-md border border-[#D8D2C4] bg-[#FBF8F1] p-3 text-[13px] text-[#5C5C5C]">
              <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">Estimate</div>
              <div className="mt-1">
                ~{estimate.data.projected_projects ?? "?"} project{estimate.data.projected_projects === 1 ? "" : "s"}
                {estimate.data.free === true ? " · free until Friday" : ""}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setClusterOpen(false)}>Cancel</Button>
            <Button
              disabled={aiCluster.isPending}
              onClick={() =>
                aiCluster.mutate(undefined, {
                  onSuccess: (result: any) => {
                    setClusterOpen(false);
                    const count = result?.projects?.length ?? 0;
                    toast.success(`Created ${count} project${count === 1 ? "" : "s"}`);
                    queryClient.invalidateQueries({ queryKey: ["projects"] });
                    queryClient.invalidateQueries({ queryKey: ["pool"] });
                  },
                  onError: (error: any) => {
                    setClusterOpen(false);
                    toast.error(error?.message ?? "Cluster failed");
                  },
                })
              }
            >
              {aiCluster.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Run clustering
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
