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
  User as UserIcon,
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
import { apiPost } from "../../lib/api";
import { asArray, dateTime } from "../lib/poaw";

type Turn = {
  turn_index?: number;
  role: "user" | "assistant" | "system" | string;
  content: string;
  timestamp?: number | null;
  model?: string | null;
  flags?: Array<{
    kind: "role" | "output" | string;
    label: string;
    confidence?: string | null;
  }>;
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
  const [query, setQuery] = useState("");
  const [turnJump, setTurnJump] = useState("");
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

  const finderResults = useMemo(() => {
    const indices = filteredTurnIndices ?? turns.map((_, index) => index);
    return indices.slice(0, 40).map((index) => {
      const turn = turns[index];
      const turnNumber = (turn?.turn_index ?? index) + 1;
      const preview = (turn?.content ?? "").replace(/\s+/g, " ").trim();
      return {
        index,
        turnNumber,
        role: turn?.role ?? "unknown",
        preview: preview.length > 120 ? `${preview.slice(0, 120)}...` : preview,
      };
    });
  }, [filteredTurnIndices, turns]);

  const flaggedTurns = useMemo(
    () =>
      turns
        .map((turn, index) => ({
          index,
          turnNumber: (turn.turn_index ?? index) + 1,
          role: turn.role,
          flags: turn.flags ?? [],
          preview: (turn.content ?? "").replace(/\s+/g, " ").trim().slice(0, 120),
        }))
        .filter((turn) => turn.flags.length > 0),
    [turns],
  );

  const scrollToTurn = (index: number) => {
    const node = turnRefs.current.get(index);
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
      node.classList.add("ring-2", "ring-[#315D8A]");
      setTimeout(() => node.classList.remove("ring-2", "ring-[#315D8A]"), 1400);
    }
  };

  const goToTurn = () => {
    const parsed = Number.parseInt(turnJump, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      toast.error("Enter a valid turn number");
      return;
    }
    const targetIndex = turns.findIndex((turn, index) => ((turn.turn_index ?? index) + 1) === parsed);
    if (targetIndex === -1) {
      toast.error("That turn does not exist in this transcript");
      return;
    }
    scrollToTurn(targetIndex);
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
            </div>
          </div>
        </div>
      </header>

      <div className="px-8 py-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_320px]">
          {/* Turns */}
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B6B66]" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find words, prompts, or decisions..."
                  className="pl-7"
                />
              </div>
              <div className="flex w-full max-w-[220px] gap-2">
                <Input
                  value={turnJump}
                  onChange={(event) => setTurnJump(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") goToTurn();
                  }}
                  inputMode="numeric"
                  placeholder="Jump to turn #"
                />
                <Button type="button" variant="outline" onClick={goToTurn}>
                  Go
                </Button>
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
                const turnFlags = turn.flags ?? [];
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
                      </div>
                    </div>
                    <div className="whitespace-pre-wrap text-[13px] leading-6 text-[#2A2A28]">
                      {turn.content}
                    </div>
                    {turnFlags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {turnFlags.map((flag, flagIndex) => (
                          <span
                            key={`${flag.kind}-${flag.label}-${flagIndex}`}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${
                              flag.kind === "role"
                                ? "bg-[#DCE4F0] text-[#315D8A]"
                                : "bg-[#E9F2E1] text-[#1F6A3F]"
                            }`}
                          >
                            <span>{flag.kind}</span>
                            <span className="text-[#161616]">{flag.label.replace(/_/g, " ")}</span>
                            {flag.confidence ? <span className="opacity-70">{flag.confidence}</span> : null}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {turnTags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {turnTags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 rounded-full bg-[#DCE4F0] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#315D8A]"
                          >
                            {tag.tag}
                          </span>
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
            {flaggedTurns.length > 0 ? (
              <Card className="border border-[#D8D2C4] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">Flagged turns</div>
                    <div className="mt-1 text-[12px] leading-relaxed text-[#5C5C5C]">
                      Parser labels and output signals attached to this transcript.
                    </div>
                  </div>
                  <div className="text-[11px] text-[#6B6B66]">{flaggedTurns.length} found</div>
                </div>
                <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                  {flaggedTurns.map((turn) => (
                    <button
                      key={turn.index}
                      type="button"
                      onClick={() => scrollToTurn(turn.index)}
                      className="block w-full rounded-md border border-transparent px-2 py-2 text-left hover:border-[#D8D2C4] hover:bg-[#FBF8F1]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px] uppercase tracking-[0.08em] text-[#6B6B66]">
                          turn {turn.turnNumber} · {turn.role}
                        </div>
                        <ArrowRight className="h-3 w-3 text-[#6B6B66]" />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {turn.flags.map((flag, flagIndex) => (
                          <span
                            key={`${flag.kind}-${flag.label}-${flagIndex}`}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${
                              flag.kind === "role"
                                ? "bg-[#DCE4F0] text-[#315D8A]"
                                : "bg-[#E9F2E1] text-[#1F6A3F]"
                            }`}
                          >
                            <span>{flag.label.replace(/_/g, " ")}</span>
                          </span>
                        ))}
                      </div>
                      {turn.preview ? (
                        <div className="mt-1 text-[12px] leading-relaxed text-[#2A2A28]">
                          {turn.preview}{turn.preview.length >= 120 ? "..." : ""}
                        </div>
                      ) : null}
                    </button>
                  ))}
                </div>
              </Card>
            ) : null}

            <Card className="border border-[#D8D2C4] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">Turn finder</div>
                  <div className="mt-1 text-[12px] leading-relaxed text-[#5C5C5C]">
                    Jump straight to turns instead of losing the thread in a long transcript.
                  </div>
                </div>
                <div className="text-right text-[11px] text-[#6B6B66]">
                  <div>{turns.length} total</div>
                  <div>{finderResults.length} visible</div>
                </div>
              </div>
              <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
                {finderResults.map((result) => (
                  <button
                    key={result.index}
                    type="button"
                    onClick={() => scrollToTurn(result.index)}
                    className="block w-full rounded-md border border-transparent px-2 py-2 text-left hover:border-[#D8D2C4] hover:bg-[#FBF8F1]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] uppercase tracking-[0.08em] text-[#6B6B66]">
                        turn {result.turnNumber} · {result.role}
                      </div>
                      <ArrowRight className="h-3 w-3 text-[#6B6B66]" />
                    </div>
                    <div className="mt-1 text-[12px] leading-relaxed text-[#2A2A28]">
                      {result.preview || "No content"}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

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

          </div>
        </div>
      </div>

    </div>
  );
}
