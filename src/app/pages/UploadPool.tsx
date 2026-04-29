import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, FolderKanban, Loader2, Search, Sparkles, Upload as UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useAiCluster, useClusterStatus, usePool } from "../../hooks/useApi";
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
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [clusterOpen, setClusterOpen] = useState(false);
  const [clusterJobId, setClusterJobId] = useState<string | null>(null);
  const [clusterFinalized, setClusterFinalized] = useState(false);
  const clusterStatus = useClusterStatus(clusterJobId, !clusterFinalized);

  const conversations: PoolConversation[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.conversations)
      ? data.conversations
      : Array.isArray(data?.items)
        ? data.items
        : [];

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

  useEffect(() => {
    const status = clusterStatus.data?.status;
    if (!clusterJobId || clusterFinalized || !status) return;
    if (status === "complete") {
      setClusterFinalized(true);
      toast.success("AI group conversations complete");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["state"] });
    }
    if (status === "failed") {
      setClusterFinalized(true);
      toast.error(clusterStatus.data.error_message || "AI group conversations failed");
    }
  }, [clusterFinalized, clusterJobId, clusterStatus.data, queryClient]);

  const clusterJobActive = !!clusterJobId && !clusterFinalized && clusterStatus.data?.status !== "complete" && clusterStatus.data?.status !== "failed";

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
                Uploads land here after parsing. Review conversations or group unassigned work into projects.
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
                AI group conversations
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <SummaryTile label="Total" value={counts.all} />
            <SummaryTile label="Unassigned" value={counts.unassigned} accent="#8A5F10" />
            <SummaryTile label="Assigned" value={counts.assigned} accent="#1F6A3F" />
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
                      active ? "border-[#315D8A] bg-[#EEF2F9] text-[#161616]" : "border-[#D8D2C4] bg-white text-[#5C5C5C] hover:bg-[#FBF8F1]"
                    }`}
                  >
                    <span>{filterConfig.label}</span>
                    <span className="rounded-full bg-[#F3EEE2] px-1.5 py-0.5 text-[10px] text-[#6B6B66]">{counts[filterConfig.key]}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative ml-auto w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B6B66]" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pool..." className="pl-7" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-10 text-center text-[14px] text-[#5C5C5C]">
              {conversations.length === 0 ? (
                <>
                  Nothing parsed yet. <Link to="/app/upload/new" className="underline">Upload files to get started.</Link>
                </>
              ) : <>No matches for the current filter.</>}
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((conversation) => <ConversationRow key={conversation.upload_id} conversation={conversation} />)}
            </div>
          )}
        </div>
      </div>

      <Dialog open={clusterOpen} onOpenChange={(open) => {
        setClusterOpen(open);
        if (!open && !clusterJobActive) {
          setClusterJobId(null);
          setClusterFinalized(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI group conversations</DialogTitle>
            <DialogDescription>Ask the AI grouping service to organize unassigned conversations into suggested projects.</DialogDescription>
          </DialogHeader>
          {clusterJobId ? (
            <div className="rounded-md border border-[#D8D2C4] bg-[#FBF8F1] p-3 text-[13px] text-[#5C5C5C]">
              <div className="flex items-center gap-2">
                {clusterJobActive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                <span className="font-medium">
                  {clusterStatus.data?.status === "complete"
                    ? "AI group conversations complete"
                    : clusterStatus.data?.status === "failed"
                      ? "AI group conversations failed"
                      : clusterStatus.data?.status === "running"
                        ? "AI is grouping conversations"
                        : "AI group conversations queued"}
                </span>
              </div>
            </div>
          ) : null}
          {aiCluster.isPending && !clusterJobId ? (
            <div className="rounded-md border border-[#D8D2C4] bg-[#FBF8F1] p-3 text-[13px] text-[#5C5C5C]">
              <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#315D8A]" />
                <span className="font-medium">Calling AI group conversations API...</span>
              </div>
              <div className="mt-1 text-[12px]">Waiting for the backend to accept the job.</div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setClusterOpen(false)} disabled={clusterJobActive}>
              {clusterStatus.data?.status === "complete" || clusterStatus.data?.status === "failed" ? "Close" : "Cancel"}
            </Button>
            <Button
              disabled={aiCluster.isPending || clusterJobActive}
              onClick={() => {
                toast.info("Calling AI group conversations API...");
                aiCluster.mutate({ tier: "free" }, {
                  onSuccess: (result) => {
                    setClusterFinalized(false);
                    setClusterJobId(result.job_id);
                    toast.success("AI group conversations queued");
                  },
                  onError: (error: any) => toast.error(error?.message ?? "AI group conversations failed"),
                });
              }}
            >
              {aiCluster.isPending || clusterJobActive ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {aiCluster.isPending ? "Calling API..." : clusterJobActive ? "AI thinking..." : "AI group conversations"}
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
      <div className="mt-1 text-3xl tracking-tight" style={accent ? { color: accent } : undefined}>{value}</div>
    </Card>
  );
}

function ConversationRow({ conversation }: { conversation: PoolConversation }) {
  const turnSplit = `${conversation.user_turn_count}u · ${conversation.assistant_turn_count}a`;
  return (
    <Card className="border border-[#D8D2C4] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${CLASS_STYLE[conversation.evidence_class] || ""}`}>
              Class {conversation.evidence_class}
            </span>
            <span className="rounded-full border border-[#D8D2C4] px-2 py-0.5 text-[10px] tracking-[0.08em] text-[#6B6B66]">{conversation.source_format || "unknown"}</span>
            {conversation.project_id ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#D3E9D9] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#1F6A3F]">
                <FolderKanban className="h-2.5 w-2.5" />
                Assigned
              </span>
            ) : (
              <span className="rounded-full bg-[#F8E5C2] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#8A5F10]">Unassigned</span>
            )}
          </div>
          <Link to={`/app/conversations/${conversation.upload_id}`} className="group mt-2 block">
            <div className="truncate text-[15px] text-[#161616] group-hover:text-[#315D8A]">{conversation.title}</div>
          </Link>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#6B6B66]">
            <span>{conversation.turn_count} turns · {turnSplit}</span>
            {conversation.model_slugs.length > 0 ? <span>{conversation.model_slugs.join(", ")}</span> : null}
            <span>added {dateTime(conversation.created_at)}</span>
            <span>{conversation.file_name}</span>
          </div>
        </div>
        <Link to={`/app/conversations/${conversation.upload_id}`}>
          <Button variant="outline" size="sm">
            Open
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
