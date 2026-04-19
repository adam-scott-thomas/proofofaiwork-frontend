import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileBarChart,
  FolderKanban,
  Hash,
  Loader2,
  MessagesSquare,
  Network,
  Pencil,
  PlayCircle,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  useAssessments,
  useDeleteProject,
  useProject,
  useTriggerEvaluation,
} from "../../hooks/useApi";
import { apiPatch, apiPost } from "../../lib/api";
import { asArray, dateTime } from "../lib/poaw";

type ProjectConversation = {
  upload_id: string;
  title: string;
  turn_count: number;
  assigned_by?: string;
  cluster_score?: number | null;
  evidence_class?: string;
};

type Project = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  cluster_method?: string;
  cluster_confidence?: number | null;
  conversations: ProjectConversation[];
  created_at: string;
  updated_at: string;
};

const CLASS_STYLE: Record<string, string> = {
  A: "bg-[#1F6A3F] text-white",
  B: "bg-[#486E9B] text-white",
  C: "bg-[#C18A2E] text-white",
  D: "bg-[#8B2F2F] text-white",
};

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-[#D3E9D9] text-[#1F6A3F]",
  suggested: "bg-[#DCE4F0] text-[#315D8A]",
  scuttled: "bg-[#EAE3CF] text-[#6B6B66]",
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: project, isLoading } = useProject(id ?? "") as { data?: Project; isLoading: boolean };
  const { data: assessmentsData } = useAssessments();
  const triggerEvaluation = useTriggerEvaluation();
  const deleteProject = useDeleteProject();

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = useMutation({
    mutationFn: (body: { title: string; description: string | null }) =>
      apiPatch(`/projects/${id}`, body),
    onSuccess: () => {
      toast.success("Project updated");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["project", id] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Update failed"),
  });

  const confirmProject = useMutation({
    mutationFn: () =>
      apiPost(`/projects/${id}/confirm`, {
        title: project?.title,
        description: project?.description,
      }),
    onSuccess: () => {
      toast.success("Project confirmed");
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Confirm failed"),
  });

  const projectAssessments = useMemo(() => {
    if (!id) return [];
    const all = asArray<any>(assessmentsData);
    return all
      .filter((assessment) => assessment.project_id === id)
      .sort((a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime());
  }, [assessmentsData, id]);

  if (isLoading || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading project...
      </div>
    );
  }

  const conversations = project.conversations ?? [];
  const isConfirmed = project.status === "confirmed";
  const isSuggested = project.status === "suggested";
  const clusterPct = project.cluster_confidence != null ? Math.round(project.cluster_confidence * 100) : null;

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-7">
          <Link to="/app/projects" className="inline-flex items-center gap-2 text-[13px] text-[#5C5C5C] hover:text-[#161616]">
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 max-w-3xl flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase ${STATUS_STYLE[project.status] || "bg-[#EAE3CF] text-[#6B6B66]"}`}>
                  {project.status}
                </span>
                {project.cluster_method ? (
                  <span className="rounded-full border border-[#D8D2C4] px-2 py-0.5 text-[10px] tracking-[0.08em] text-[#6B6B66]">
                    {project.cluster_method}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-2 flex items-start gap-2 text-3xl tracking-tight">
                <FolderKanban className="mt-1.5 h-6 w-6 shrink-0 text-[#6B6B66]" />
                <span className="min-w-0 truncate">{project.title}</span>
              </h1>
              {project.description ? (
                <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#5C5C5C]">
                  {project.description}
                </p>
              ) : (
                <p className="mt-2 text-[13px] text-[#A88F5F]">
                  No description yet. Add one so the evaluator knows the context.
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#6B6B66]">
                <span>{conversations.length} conversation{conversations.length === 1 ? "" : "s"}</span>
                <span>created {dateTime(project.created_at)}</span>
                {project.updated_at && project.updated_at !== project.created_at ? (
                  <span>updated {dateTime(project.updated_at)}</span>
                ) : null}
              </div>
              {isSuggested && clusterPct != null ? (
                <div className="mt-3 max-w-sm">
                  <div className="flex items-center justify-between text-[11px] text-[#6B6B66]">
                    <span>Cluster confidence</span>
                    <span>{clusterPct}%</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#EAE3CF]">
                    <div className="h-full bg-[#315D8A]" style={{ width: `${clusterPct}%` }} />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              {isSuggested ? (
                <Button onClick={() => confirmProject.mutate()} disabled={confirmProject.isPending}>
                  {confirmProject.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Confirm
                </Button>
              ) : null}
              {isConfirmed ? (
                <Button
                  onClick={() =>
                    triggerEvaluation.mutate(id!, {
                      onSuccess: (data: any) => {
                        toast.success("Assessment started");
                        navigate(`/app/assessment/${data.assessment_id}/processing`);
                      },
                      onError: (error: any) => toast.error(error?.message ?? "Failed to start assessment"),
                    })
                  }
                  disabled={triggerEvaluation.isPending || conversations.length === 0}
                >
                  {triggerEvaluation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                  Run assessment
                </Button>
              ) : null}
              <Button
                variant="ghost"
                className="text-[#8B2F2F] hover:bg-[#F3D1D1]/40 hover:text-[#8B2F2F]"
                onClick={() => setDeleting(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Assessments for this project */}
          {projectAssessments.length > 0 ? (
            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <div>
                  <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Assessments</div>
                  <h2 className="text-xl tracking-tight">Evaluations from this project</h2>
                </div>
                <Link to="/app/assessments" className="text-[12px] text-[#6B6B66] hover:text-[#161616]">
                  All →
                </Link>
              </div>
              <div className="space-y-2">
                {projectAssessments.slice(0, 5).map((assessment) => {
                  const isFinal = assessment.status === "complete" || assessment.status === "partial";
                  const href = isFinal
                    ? `/app/assessment/${assessment.id}/results`
                    : `/app/assessment/${assessment.id}/processing`;
                  return (
                    <Link key={assessment.id} to={href}>
                      <Card className="group flex items-center justify-between gap-3 border border-[#D8D2C4] bg-white p-3 transition-colors hover:border-[#A88F5F] hover:bg-[#FBF8F1]">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileBarChart className="h-4 w-4 shrink-0 text-[#6B6B66]" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase ${
                                assessment.status === "complete" ? "bg-[#D3E9D9] text-[#1F6A3F]" :
                                assessment.status === "partial" ? "bg-[#F8E5C2] text-[#8A5F10]" :
                                assessment.status === "failed" ? "bg-[#F3D1D1] text-[#8B2F2F]" :
                                "bg-[#EDE3FF] text-[#5D3FA0]"
                              }`}>
                                {assessment.status}
                              </span>
                              <span className="text-[13px] text-[#161616]">
                                {assessment.task_context || `Run ${String(assessment.id).slice(0, 8)}`}
                              </span>
                            </div>
                            <div className="mt-0.5 text-[11px] text-[#6B6B66]">
                              {dateTime(assessment.updated_at || assessment.created_at)}
                              {assessment.confidence ? <> · {assessment.confidence} confidence</> : null}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[#6B6B66] opacity-0 transition-opacity group-hover:opacity-100" />
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* Conversations */}
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <div>
                <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Conversations</div>
                <h2 className="text-xl tracking-tight">
                  {conversations.length} in this project
                </h2>
              </div>
              <div className="flex gap-2">
                {id ? (
                  <Link to={`/app/projects/${id}/knowledge-map`} onClick={(event) => event.preventDefault()}>
                    <Button variant="ghost" size="sm" className="text-[#6B6B66]" disabled>
                      <Network className="mr-2 h-3.5 w-3.5" />
                      Knowledge map
                    </Button>
                  </Link>
                ) : null}
                <Link to="/app/upload">
                  <Button variant="outline" size="sm">
                    Add from pool
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {conversations.length === 0 ? (
              <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-8 text-center text-[13px] text-[#5C5C5C]">
                No conversations assigned yet.{" "}
                <Link to="/app/upload" className="underline">
                  Assign from the pool
                </Link>{" "}
                or cluster unassigned ones.
              </Card>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <Card key={conversation.upload_id} className="border border-[#D8D2C4] bg-white p-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <MessagesSquare className="h-4 w-4 shrink-0 text-[#315D8A]" />
                      <div className="min-w-0 flex-1">
                        <Link to={`/app/conversations/${conversation.upload_id}`} className="block">
                          <div className="truncate text-[13px] text-[#161616] hover:text-[#315D8A]">
                            {conversation.title}
                          </div>
                        </Link>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#6B6B66]">
                          <span className="inline-flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {conversation.turn_count} turns
                          </span>
                          {conversation.assigned_by ? <span>via {conversation.assigned_by}</span> : null}
                          {conversation.cluster_score != null ? (
                            <span>cluster fit {Math.round(conversation.cluster_score * 100)}%</span>
                          ) : null}
                        </div>
                      </div>
                      {conversation.evidence_class ? (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${CLASS_STYLE[conversation.evidence_class] || "bg-[#EAE3CF] text-[#6B6B66]"}`}>
                          {conversation.evidence_class}
                        </span>
                      ) : null}
                      <Link to={`/app/conversations/${conversation.upload_id}`}>
                        <Button variant="ghost" size="sm">
                          Open
                          <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <EditDialog
        open={editing}
        project={project}
        onClose={() => setEditing(false)}
        onSave={(next) => save.mutate(next)}
        saving={save.isPending}
      />

      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {project.title}?</DialogTitle>
            <DialogDescription>
              Conversations move back to the pool. Assessments keep their data but lose the project reference.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(false)}>Cancel</Button>
            <Button
              className="bg-[#8B2F2F] hover:bg-[#7A2525]"
              disabled={deleteProject.isPending}
              onClick={() =>
                deleteProject.mutate(project.id, {
                  onSuccess: () => {
                    toast.success("Project deleted");
                    navigate("/app/projects");
                  },
                  onError: (error: any) => toast.error(error?.message ?? "Delete failed"),
                })
              }
            >
              {deleteProject.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditDialog({
  open,
  project,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  project: Project;
  onClose: () => void;
  onSave: (next: { title: string; description: string | null }) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description ?? "");

  useMemo(() => {
    if (open) {
      setTitle(project.title);
      setDescription(project.description ?? "");
    }
  }, [open, project.id]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>Title and description are internal — they don't appear on proof pages.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">Title</label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">Description</label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="mt-1"
              placeholder="Context for the evaluator."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={saving || !title.trim()}
            onClick={() => onSave({ title: title.trim(), description: description.trim() || null })}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
