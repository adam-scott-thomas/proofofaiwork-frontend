import { ArrowLeft, Copy, Loader2, Tag } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useConversation, useProjects } from "../../hooks/useApi";
import { apiDelete, apiPost } from "../../lib/api";
import { asArray } from "../lib/poaw";

export default function ConversationDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: conversation, isLoading, refetch } = useConversation(id ?? "");
  const { data: projectsData } = useProjects();
  const [targetProjectId, setTargetProjectId] = useState<string>("");
  const [moving, setMoving] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [tagging, setTagging] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        Loading conversation...
      </div>
    );
  }

  const turns = Array.isArray(conversation?.turns) ? conversation.turns : [];
  const tags = Array.isArray(conversation?.tags) ? conversation.tags : [];
  const projects = asArray<any>(projectsData);

  const moveConversation = async () => {
    if (!id || !targetProjectId) return;
    setMoving(true);
    try {
      await apiPost("/projects/move-conversation", {
        upload_id: id,
        target_project_id: targetProjectId,
      });
      toast.success("Conversation moved");
      await refetch();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to move conversation");
    } finally {
      setMoving(false);
    }
  };

  const addTag = async () => {
    if (!id || !newTag.trim()) return;
    setTagging(true);
    try {
      await apiPost(`/conversations/${id}/tags`, { tag: newTag.trim() });
      setNewTag("");
      await refetch();
      toast.success("Tag added");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to add tag");
    } finally {
      setTagging(false);
    }
  };

  const removeTag = async (tagId: string) => {
    if (!id) return;
    try {
      await apiDelete(`/conversations/${id}/tags/${tagId}`);
      await refetch();
      toast.success("Tag removed");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to remove tag");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-8">
          <Link to="/app/conversations" className="inline-flex items-center gap-2 text-[13px] text-[#5C5C5C] hover:text-[#161616]">
            <ArrowLeft className="h-4 w-4" />
            Back to conversations
          </Link>
          <div className="mt-5 flex items-start justify-between gap-6">
            <div className="max-w-3xl">
              <h1 className="text-3xl tracking-tight">{conversation?.title}</h1>
              <p className="mt-2 text-[14px] text-[#5C5C5C]">
                {conversation?.turn_count} turns • {conversation?.source_format || "unknown format"} • {conversation?.project_id ? "assigned to a project" : "currently unassigned"}
              </p>
              <p className="mt-1 text-[12px] text-[#6B6B66]">
                Models: {(conversation?.model_slugs ?? []).join(", ") || "unknown"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const text = turns.map((turn: any) => `${turn.role}: ${turn.content}`).join("\n\n");
                navigator.clipboard.writeText(text);
                toast.success("Conversation copied");
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy transcript
            </Button>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="grid grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            {turns.map((turn: any, index: number) => (
              <Card
                key={`${turn.turn_index ?? index}-${turn.role}`}
                className={`border p-5 shadow-sm ${
                  turn.role === "assistant"
                    ? "border-[#D8D2C4] bg-[#FBF8F1]"
                    : "border-[#D8D2C4] bg-white"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">
                    {turn.role === "assistant" ? "Assistant" : "You"}
                  </div>
                  <div className="text-[12px] text-[#6B6B66]">turn {turn.turn_index ?? index + 1}</div>
                </div>
                <div className="whitespace-pre-wrap text-[14px] leading-7 text-[#2A2A28]">{turn.content}</div>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card className="border border-[#D8D2C4] bg-white p-5 shadow-sm">
              <div className="text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Add to project</div>
              <p className="mt-2 text-[13px] leading-relaxed text-[#5C5C5C]">
                This is the control that was missing. Choose a project and move the conversation directly.
              </p>
              <div className="mt-4">
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
              <Button className="mt-3 w-full" onClick={moveConversation} disabled={!targetProjectId || moving}>
                {moving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Move conversation
              </Button>
            </Card>

            <Card className="border border-[#D8D2C4] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">
                <Tag className="h-4 w-4" />
                Tags
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={newTag}
                  onChange={(event) => setNewTag(event.target.value)}
                  placeholder="Add a tag"
                  className="w-full rounded-md border border-[#D8D2C4] bg-[#FBF8F1] px-3 py-2 text-sm outline-none"
                />
                <Button onClick={addTag} disabled={!newTag.trim() || tagging}>Add</Button>
              </div>

              <div className="mt-3 space-y-2">
                {tags.length === 0 ? (
                  <div className="text-[13px] text-[#5C5C5C]">No tags yet.</div>
                ) : (
                  tags.map((tag: any) => (
                    <div key={tag.id} className="flex items-center justify-between rounded-md border border-[#D8D2C4] bg-[#FBF8F1] px-3 py-2">
                      <div className="text-[13px]">
                        {tag.tag}
                        {tag.turn_index != null ? <span className="text-[#6B6B66]"> • turn {tag.turn_index}</span> : null}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeTag(tag.id)}>Remove</Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
