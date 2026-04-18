import { ArrowLeft, CheckCircle2, FileBarChart, Loader2, Pencil } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useProject, useTriggerEvaluation } from "../../hooks/useApi";
import { apiPatch, apiPost } from "../../lib/api";
import { dateTime } from "../lib/poaw";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading, refetch } = useProject(id ?? "");
  const triggerEvaluation = useTriggerEvaluation();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        Loading project...
      </div>
    );
  }

  const conversations = Array.isArray(project?.conversations) ? project.conversations : [];
  const isConfirmed = project?.status === "confirmed";

  const startEditing = () => {
    setTitle(project?.title ?? "");
    setDescription(project?.description ?? "");
    setEditing(true);
  };

  const saveProject = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await apiPatch(`/projects/${id}`, { title, description });
      toast.success("Project updated");
      setEditing(false);
      await refetch();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  const confirmProject = async () => {
    if (!id) return;
    setConfirming(true);
    try {
      await apiPost(`/projects/${id}/confirm`, {
        title: project?.title,
        description: project?.description,
      });
      toast.success("Project confirmed");
      await refetch();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to confirm project");
    } finally {
      setConfirming(false);
    }
  };

  const runAssessment = () => {
    if (!id) return;
    triggerEvaluation.mutate(id, {
      onSuccess: (data: any) => {
        toast.success("Assessment started");
        navigate(`/app/assessment/${data.assessment_id}/processing`);
      },
      onError: (error: any) => toast.error(error?.message ?? "Failed to start assessment"),
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-8">
          <Link to="/app/projects" className="inline-flex items-center gap-2 text-[13px] text-[#5C5C5C] hover:text-[#161616]">
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Link>

          <div className="mt-5 flex items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl tracking-tight">{project?.title}</h1>
                <span className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${
                  isConfirmed ? "bg-[#E7F2E9] text-[#2F6B3B]" : "bg-[#F3EEE2] text-[#A8741A]"
                }`}>
                  {project?.status}
                </span>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-[#5C5C5C]">
                {project?.description || "No description yet. Give this project a clean title and description before evaluation."}
              </p>
              <div className="mt-3 text-[13px] text-[#6B6B66]">
                {conversations.length} conversations • created {dateTime(project?.created_at)}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={startEditing}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              {!isConfirmed ? (
                <Button onClick={confirmProject} disabled={confirming}>
                  {confirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Confirm project
                </Button>
              ) : (
                <Button onClick={runAssessment} disabled={triggerEvaluation.isPending}>
                  {triggerEvaluation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileBarChart className="mr-2 h-4 w-4" />}
                  Evaluate project
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        {editing ? (
          <Card className="mb-6 border border-[#D8D2C4] bg-white p-6 shadow-sm">
            <div className="mb-4 text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Edit project</div>
            <div className="grid gap-4">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="rounded-md border border-[#D8D2C4] px-3 py-2 text-sm outline-none"
                placeholder="Project title"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-28 rounded-md border border-[#D8D2C4] px-3 py-2 text-sm outline-none"
                placeholder="What this project covers"
              />
              <div className="flex gap-2">
                <Button onClick={saveProject} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          </Card>
        ) : null}

        <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
          <div className="mb-4 text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Conversations in this project</div>
          {conversations.length === 0 ? (
            <div className="text-[14px] text-[#5C5C5C]">No conversations assigned yet.</div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation: any) => (
                <Link key={conversation.upload_id} to={`/app/conversations/${conversation.upload_id}`} className="block">
                  <div className="rounded-lg border border-[#D8D2C4] bg-[#FBF8F1] px-4 py-4 transition-colors hover:bg-[#F3EEE2]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[14px]">{conversation.title}</div>
                        <div className="mt-1 text-[12px] text-[#6B6B66]">
                          {conversation.turn_count} turns • assigned by {conversation.assigned_by}
                        </div>
                      </div>
                      {conversation.cluster_score != null ? (
                        <div className="text-[12px] text-[#6B6B66]">
                          cluster {Math.round(conversation.cluster_score * 100)}%
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
