import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Copy,
  Download,
  FolderKanban,
  Hash,
  Loader2,
  Search,
  Tag as TagIcon,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useConversation, useProjects } from "../../hooks/useApi";
import { apiDelete, apiPost } from "../../lib/api";
import { asArray, dateTime } from "../lib/poaw";

type Turn = {
  turn_index?: number;
  role: "user" | "assistant" | "system" | string;
  content: string;
  timestamp?: number | null;
  model?: string | null;
};

type Tag = {
  id: string;
  tag: string;
  turn_index: number | null;
  created_at: string;
};

type Conversation = {
  upload_id: string;
  title: string;
  source_format: string;
  model_slugs: string[];
  turn_count: number;
  user_turn_count: number;
  assistant_turn_count?: number;
  first_timestamp: number | null;
  project_id: string | null;
  evidence_class?: string;
  file_name?: string;
  turns: Turn[];
  tags: Tag[];
};

const CLASS_STYLE: Record<string, string> = {
  A: "bg-[#1F6A3F] text-white",
  B: "bg-[#486E9B] text-white",
  C: "bg-[#C18A2E] text-white",
  D: "bg-[#8B2F2F] text-white",
};

function roleIcon(role: string) {
  if (role === "assistant") return Bot;
  if (role === "user") return UserIcon;
  return Hash;
}

export default function ConversationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: conversation, isLoading } = useConversation(id ?? "") as { data?: Conversation; isLoading: boolean };
  const { data: projectsData } = useProjects();
  const [targetProjectId, setTargetProjectId] = useState<string>("");
  const [newTag, setNewTag] = useState("");
  const [tagTurnIndex, setTagTurnIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState(false);
  const turnRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const move = useMutation({
    mutationFn: (projectId: string) =>
      apiPost("/projects/move-conversation", { upload_id: id, target_project_id: projectId }),
    onSuccess: () => {
      toast.success("Moved");
      queryClient.invalidateQueries({ queryKey: ["conversation", id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Move failed"),
  });

  const addTag = useMutation({
    mutationFn: (body: { tag: string; turn_index?: number | null }) =>
      apiPost(`/conversations/${id}/tags`, {
        tag: body.tag,
        turn_index: body.turn_index ?? undefined,
      }),
    onSuccess: () => {
      setNewTag("");
      setTagTurnIndex(null);
      queryClient.invalidateQueries({ queryKey: ["conversation", id] });
      toast.success("Tag added");
    },
    onError: (error: any) => toast.error(error?.message ?? "Tag failed"),
  });

  const removeTag = useMutation({
    mutationFn: (tagId: string) => apiDelete(`/conversations/${id}/tags/${tagId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation", id] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Remove failed"),
  });

  const remove = useMutation({
    mutationFn: () => apiDelete(`/pool/${id}`),
    onSuccess: () => {
      toast.success("Removed from pool");
      navigate("/app/conversations");
      queryClient.invalidateQueries({ queryKey: ["pool"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Delete failed"),
  });

  const turns = conversation?.turns ?? [];
  const tags = conversation?.tags ?? [];
  const projects = asArray<{ id: string; title: string }>(projectsData);

  const filteredTurnIndices = useMemo(() => {
    if (!query.trim()) return null;
    const needle = query.trim().toLowerCase();
    return turns
      .map((turn, index) => ({ turn, index }))
      .filter(({ turn }) => turn.content?.toLowerCase().includes(needle))
      .map(({ index }) => index);
  }, [turns, query]);

  const scrollToTurn = (index: number) => {
    const node = turnRefs.current.get(index);
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
      node.classList.add("ring-2", "ring-[#315D8A]");
      setTimeout(() => node.classList.remove("ring-2", "ring-[#315D8A]"), 1400);
    }
  };

  const copyTranscript = () => {
    const text = turns.map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`).join("\n\n");
    navigator.clipboard.writeText(text).then(
      () => toast.success("Transcript copied"),
      () => toast.error("Copy failed"),
    );
  };

  const downloadJson = () => {
    if (!conversation) return;
    const blob = new Blob([JSON.stringify(conversation, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${conversation.upload_id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !conversation) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading conversation...
      </div>
    );
  }

  const assistantTurns = conversation.assistant_turn_count ?? (conversation.turn_count - conversation.user_turn_count);
  const projectTitle = projects.find((project) => project.id === conversation.project_id)?.title ?? null;

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-6">
          <Link to="/app/conversations" className="inline-flex items-center gap-2 text-[13px] text-[#5C5C5C] hover:text-[#161616]">
            <ArrowLeft className="h-4 w-4" />
            Back to conversations
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 max-w-3xl flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {conversation.evidence_class ? (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${CLASS_STYLE[conversation.evidence_class] || "bg-[#EAE3CF] text-[#6B6B66]"}`}>
                    Class {conversation.evidence_class}
                  </span>
                ) : null}
                {conversation.project_id && projectTitle ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#D3E9D9] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#1F6A3F]">
                    <FolderKanban className="h-2.5 w-2.5" />
                    {projectTitle}
                  </span>
                ) : (
                  <span className="rounded-full bg-[#F8E5C2] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#8A5F10]">
                    Unassigned
                  </span>
                )}
                <span className="rounded-full border border-[#D8D2C4] px-2 py-0.5 text-[10px] tracking-[0.08em] text-[#6B6B66]">
                  {conversation.source_format || "unknown"}
                </span>
              </div>
              <h1 className="mt-2 truncate text-2xl tracking-tight">{conversation.title}</h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#6B6B66]">
                <span>{conversation.turn_count} turns · {conversation.user_turn_count}u / {assistantTurns}a</span>
                {conversation.model_slugs.length > 0 ? <span>{conversation.model_slugs.join(", ")}</span> : null}
                {conversation.first_timestamp ? <span>{dateTime(conversation.first_timestamp * 1000)}</span> : null}
                {conversation.file_name ? <span>{conversation.file_name}</span> : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={copyTranscript}>
                <Copy className="mr-2 h-3.5 w-3.5" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={downloadJson}>
                <Download className="mr-2 h-3.5 w-3.5" />
                JSON
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#8B2F2F] hover:bg-[#F3D1D1]/40 hover:text-[#8B2F2F]"
                onClick={() => setDeleting(true)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-8 py-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_320px]">
          {/* Turns */}
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B6B66]" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search within transcript..."
                  className="pl-7"
                />
              </div>
              {filteredTurnIndices != null ? (
                <div className="text-[11px] text-[#6B6B66]">
                  {filteredTurnIndices.length} match{filteredTurnIndices.length === 1 ? "" : "es"}
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              {turns.map((turn, index) => {
                const Icon = roleIcon(turn.role);
                const turnTags = tags.filter((tag) => tag.turn_index === (turn.turn_index ?? index));
                const highlight = filteredTurnIndices?.includes(index);
                return (
                  <div
                    key={`${turn.turn_index ?? index}-${turn.role}`}
                    ref={(node) => {
                      if (node) turnRefs.current.set(index, node);
                      else turnRefs.current.delete(index);
                    }}
                    className={`rounded-lg border transition-shadow ${
                      turn.role === "assistant" ? "border-[#D8D2C4] bg-[#FBF8F1]" : "border-[#D8D2C4] bg-white"
                    } p-4 ${highlight ? "ring-2 ring-[#315D8A]" : ""}`}
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                          turn.role === "assistant" ? "bg-[#DCE4F0] text-[#315D8A]" : "bg-[#EAE3CF] text-[#6B6B66]"
                        }`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="text-[11px] uppercase tracking-[0.14em] text-[#6B6B66]">
                          {turn.role}
                        </div>
                        {turn.model ? (
                          <span className="text-[10px] text-[#6B6B66]">{turn.model}</span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#6B6B66]">
                        <span>turn {turn.turn_index ?? index + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 py-0 text-[10px]"
                          onClick={() => setTagTurnIndex(turn.turn_index ?? index)}
                          title="Tag this turn"
                        >
                          <TagIcon className="mr-1 h-3 w-3" />
                          Tag
                        </Button>
                      </div>
                    </div>
                    <div className="whitespace-pre-wrap text-[13px] leading-6 text-[#2A2A28]">
                      {turn.content}
                    </div>
                    {turnTags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {turnTags.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            className="group inline-flex items-center gap-1 rounded-full bg-[#DCE4F0] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#315D8A] hover:bg-[#EEF2F9]"
                            onClick={() => removeTag.mutate(tag.id)}
                          >
                            {tag.tag}
                            <X className="h-2.5 w-2.5 opacity-50 group-hover:opacity-100" />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right rail */}
          <div className="space-y-4">
            {filteredTurnIndices != null && filteredTurnIndices.length > 0 ? (
              <Card className="border border-[#D8D2C4] bg-white p-4">
                <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">Search results</div>
                <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                  {filteredTurnIndices.slice(0, 30).map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => scrollToTurn(idx)}
                      className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-[11px] text-[#5C5C5C] hover:bg-[#FBF8F1]"
                    >
                      <span>turn {(turns[idx]?.turn_index ?? idx) + 1}</span>
                      <ArrowRight className="h-3 w-3 text-[#6B6B66]" />
                    </button>
                  ))}
                </div>
              </Card>
            ) : null}

            <Card className="border border-[#D8D2C4] bg-white p-4">
              <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">Move to project</div>
              <div className="mt-2">
                <Select value={targetProjectId} onValueChange={setTargetProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="mt-2 w-full"
                size="sm"
                disabled={!targetProjectId || move.isPending}
                onClick={() => move.mutate(targetProjectId)}
              >
                {move.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Move
              </Button>
            </Card>

            <Card className="border border-[#D8D2C4] bg-white p-4">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">
                <TagIcon className="h-3 w-3" />
                Tags ({tags.length})
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  value={newTag}
                  onChange={(event) => setNewTag(event.target.value)}
                  placeholder="Add a tag"
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => addTag.mutate({ tag: newTag.trim(), turn_index: tagTurnIndex })}
                  disabled={!newTag.trim() || addTag.isPending}
                >
                  {addTag.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
                </Button>
              </div>
              {tagTurnIndex != null ? (
                <div className="mt-2 text-[11px] text-[#6B6B66]">
                  Will pin to turn {tagTurnIndex + 1}.{" "}
                  <button type="button" className="underline" onClick={() => setTagTurnIndex(null)}>
                    Clear
                  </button>
                </div>
              ) : null}

              {tags.length === 0 ? (
                <div className="mt-3 text-[11px] text-[#6B6B66]">No tags yet.</div>
              ) : (
                <div className="mt-3 space-y-1">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between gap-2 rounded-md border border-[#EAE3CF] bg-[#FBF8F1] px-2 py-1.5">
                      <div className="min-w-0 text-[11px]">
                        <span className="text-[#161616]">{tag.tag}</span>
                        {tag.turn_index != null ? (
                          <button
                            type="button"
                            onClick={() => scrollToTurn(tag.turn_index!)}
                            className="ml-1 text-[#6B6B66] hover:underline"
                          >
                            · turn {tag.turn_index + 1}
                          </button>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTag.mutate(tag.id)}
                        className="text-[#6B6B66] hover:text-[#8B2F2F]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this conversation?</DialogTitle>
            <DialogDescription>
              The upload is removed from your pool. Assessments that already evaluated it keep their observations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(false)}>Cancel</Button>
            <Button
              className="bg-[#8B2F2F] hover:bg-[#7A2525]"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              {remove.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
