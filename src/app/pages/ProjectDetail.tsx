import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileBarChart,
  Flame,
  FolderKanban,
  Github,
  Hash,
  Loader2,
  MessagesSquare,
  Network,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  useCreateIntake,
  useDeleteProject,
  useEvaluateWorkProfile,
  useIntake,
  useProject,
  useTriggerEvaluation,
  useUpdateIntake,
  useWorkProfile,
} from "../../hooks/useApi";
import { apiFetch, apiPatch, apiPost } from "../../lib/api";
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

type ProjectBrief = {
  id: string;
  project_id: string;
  goal_statement: string;
  solo_time_estimate_hours: number;
  starting_point: "from_scratch" | "iterating";
  role_declaration?: string | null;
  team_context?: string | null;
  outcome_statement?: string | null;
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
  const briefQuery = useIntake(id ?? "") as { data?: ProjectBrief; isLoading: boolean; error?: Error | null };
  const workProfileQuery = useWorkProfile(id ?? "") as { data?: any; isLoading: boolean; error?: Error | null };
  const triggerEvaluation = useTriggerEvaluation();
  const triggerWorkProfile = useEvaluateWorkProfile();
  const createIntake = useCreateIntake();
  const updateIntake = useUpdateIntake();
  const deleteProject = useDeleteProject();

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [scuttleOpen, setScuttleOpen] = useState(false);
  const [goalStatement, setGoalStatement] = useState("");
  const [soloTimeEstimateHours, setSoloTimeEstimateHours] = useState("8");
  const [startingPoint, setStartingPoint] = useState<"from_scratch" | "iterating">("from_scratch");
  const [roleDeclaration, setRoleDeclaration] = useState("");
  const [teamContext, setTeamContext] = useState("");
  const [outcomeStatement, setOutcomeStatement] = useState("");

  const scuttle = useMutation({
    mutationFn: () => apiPost(`/projects/${id}/scuttle`, {}),
    onSuccess: (result: any) => {
      const files = result?.upload_count ?? 0;
      const bytes = result?.bytes_destroyed ?? 0;
      toast.success(`Scuttled ${files} upload${files === 1 ? "" : "s"} (${(bytes / 1024).toFixed(1)} KB)`);
      setScuttleOpen(false);
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Scuttle failed"),
  });

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

  useEffect(() => {
    const brief = briefQuery.data;
    if (!brief) return;
    setGoalStatement(brief.goal_statement ?? "");
    setSoloTimeEstimateHours(String(brief.solo_time_estimate_hours ?? "8"));
    setStartingPoint(brief.starting_point ?? "from_scratch");
    setRoleDeclaration(brief.role_declaration ?? "");
    setTeamContext(brief.team_context ?? "");
    setOutcomeStatement(brief.outcome_statement ?? "");
  }, [briefQuery.data]);

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
  const hasFinishedAssessment = projectAssessments.some(
    (assessment) => assessment.status === "complete" || assessment.status === "partial",
  );
  const hasBrief = !!briefQuery.data;
  const workProfileErrorMessage = workProfileQuery.error?.message ?? "";
  const workProfileMissing = !workProfileQuery.data && /no completed profile found/i.test(workProfileErrorMessage);
  const workProfileReady = !!workProfileQuery.data;
  const canBuildWorkProfile = isConfirmed && hasBrief && hasFinishedAssessment;
  const briefSavePending = createIntake.isPending || updateIntake.isPending;
  const validGoalStatement = goalStatement.trim().length >= 10;
  const validSoloTime = Number(soloTimeEstimateHours) > 0;

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
              {!project.raw_data_scuttled ? (
                <Button
                  variant="ghost"
                  className="text-[#8A5F10] hover:bg-[#FDF4DC] hover:text-[#8A5F10]"
                  onClick={() => setScuttleOpen(true)}
                  title="Destroy the raw uploaded files (observations and scores are kept)"
                >
                  <Flame className="mr-2 h-4 w-4" />
                  Scuttle raw data
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

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <div>
                <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Project brief</div>
                <h2 className="text-xl tracking-tight">Give the evaluator real context</h2>
              </div>
              <div className="text-[11px] text-[#6B6B66]">
                Required before building the work profile
              </div>
            </div>

            <Card className="border border-[#D8D2C4] bg-white p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">
                    Goal statement
                  </label>
                  <Textarea
                    value={goalStatement}
                    onChange={(event) => setGoalStatement(event.target.value)}
                    rows={4}
                    className="mt-1"
                    placeholder="What were you trying to ship, solve, or prove?"
                  />
                </div>
                <div>
                  <label className="text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">
                    Solo time estimate (hours)
                  </label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={soloTimeEstimateHours}
                    onChange={(event) => setSoloTimeEstimateHours(event.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">
                    Starting point
                  </label>
                  <select
                    value={startingPoint}
                    onChange={(event) => setStartingPoint(event.target.value as "from_scratch" | "iterating")}
                    className="mt-1 flex h-10 w-full rounded-md border border-[#D8D2C4] bg-white px-3 text-sm text-[#161616]"
                  >
                    <option value="from_scratch">From scratch</option>
                    <option value="iterating">Iterating on existing work</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">
                    Your role
                  </label>
                  <Input
                    value={roleDeclaration}
                    onChange={(event) => setRoleDeclaration(event.target.value)}
                    className="mt-1"
                    placeholder="Founder, engineer, designer, operator..."
                  />
                </div>
                <div>
                  <label className="text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">
                    Team context
                  </label>
                  <Input
                    value={teamContext}
                    onChange={(event) => setTeamContext(event.target.value)}
                    className="mt-1"
                    placeholder="Solo, pair, team of 4..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">
                    Outcome statement
                  </label>
                  <Textarea
                    value={outcomeStatement}
                    onChange={(event) => setOutcomeStatement(event.target.value)}
                    rows={3}
                    className="mt-1"
                    placeholder="What happened when this work landed?"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  disabled={briefSavePending || !validGoalStatement || !validSoloTime}
                  onClick={() => {
                    const body = {
                      project_id: project.id,
                      goal_statement: goalStatement.trim(),
                      solo_time_estimate_hours: Number(soloTimeEstimateHours),
                      starting_point: startingPoint,
                      role_declaration: roleDeclaration.trim() || undefined,
                      team_context: teamContext.trim() || undefined,
                      outcome_statement: outcomeStatement.trim() || undefined,
                    };
                    const onSuccess = () => {
                      toast.success(hasBrief ? "Brief updated" : "Brief saved");
                      queryClient.invalidateQueries({ queryKey: ["intake", project.id] });
                    };
                    const onError = (error: any) => toast.error(error?.message ?? "Brief save failed");

                    if (briefQuery.data?.id) {
                      updateIntake.mutate({ briefId: briefQuery.data.id, body }, { onSuccess, onError });
                    } else {
                      createIntake.mutate(body, { onSuccess, onError });
                    }
                  }}
                >
                  {briefSavePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {hasBrief ? "Update brief" : "Save brief"}
                </Button>
                <div className="text-[12px] text-[#6B6B66]">
                  {hasBrief ? "Brief is on file." : "No brief saved yet."}
                </div>
              </div>
            </Card>
          </section>

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <div>
                <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Work profile</div>
                <h2 className="text-xl tracking-tight">Turn the finished assessment into a profile</h2>
              </div>
            </div>

            <Card className="border border-[#D8D2C4] bg-white p-5">
              <div className="grid gap-3 md:grid-cols-3">
                <RequirementChip label="Confirmed project" met={isConfirmed} />
                <RequirementChip label="Saved brief" met={hasBrief} />
                <RequirementChip label="Finished assessment" met={hasFinishedAssessment} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {workProfileReady ? (
                  <Link to={`/app/work-profile?project_id=${project.id}`}>
                    <Button>
                      Open work profile
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    disabled={!canBuildWorkProfile || triggerWorkProfile.isPending}
                    onClick={() =>
                      triggerWorkProfile.mutate(project.id, {
                        onSuccess: () => {
                          toast.success("Work profile started");
                          navigate(`/app/work-profile?project_id=${project.id}`);
                        },
                        onError: (error: any) => toast.error(error?.message ?? "Work profile failed to start"),
                      })
                    }
                  >
                    {triggerWorkProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Build work profile
                  </Button>
                )}
                <div className="text-[12px] text-[#6B6B66]">
                  {workProfileReady
                    ? "A project-scoped work profile already exists."
                    : workProfileMissing
                      ? "No project-scoped work profile yet."
                      : workProfileErrorMessage
                        ? workProfileErrorMessage
                        : "Complete the three requirements, then build it."}
                </div>
              </div>
            </Card>
          </section>

          {/* Repos */}
          <ReposSection projectId={project.id} />

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
                <Button variant="ghost" size="sm" onClick={() => setKnowledgeOpen(true)}>
                  <Network className="mr-2 h-3.5 w-3.5" />
                  Knowledge map
                </Button>
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

      <KnowledgeMapDialog
        open={knowledgeOpen}
        projectId={project.id}
        onClose={() => setKnowledgeOpen(false)}
      />

      <Dialog open={scuttleOpen} onOpenChange={setScuttleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scuttle raw data for {project.title}?</DialogTitle>
            <DialogDescription>
              Destroys the raw uploaded files on disk. Canonical excerpts, observations, assessment scores,
              and the audit log are preserved. This is a compliance-grade burn — not reversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setScuttleOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#8A5F10] hover:bg-[#6F4E0D]"
              disabled={scuttle.isPending}
              onClick={() => scuttle.mutate()}
            >
              {scuttle.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flame className="mr-2 h-4 w-4" />}
              Scuttle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

function RequirementChip({ label, met }: { label: string; met: boolean }) {
  return (
    <div className={`rounded-md border px-3 py-2 text-[12px] ${
      met
        ? "border-[#BFD8C5] bg-[#EFF8F1] text-[#1F6A3F]"
        : "border-[#D8D2C4] bg-[#FBF8F1] text-[#6B6B66]"
    }`}>
      <div className="flex items-center gap-2">
        {met ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Hash className="h-3.5 w-3.5" />}
        {label}
      </div>
    </div>
  );
}

type RepoSummary = {
  id: string;
  repo_url: string;
  repo_owner: string;
  repo_name: string;
  description: string | null;
  language: string | null;
  stars: number | null;
  commit_count: number | null;
  correlation_score: number | null;
  parse_status: string;
  created_at: string;
};

function ReposSection({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [attachOpen, setAttachOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");

  const listQuery = useQuery<RepoSummary[]>({
    queryKey: ["project-repos", projectId],
    queryFn: () => apiFetch<RepoSummary[]>(`/projects/${projectId}/repos`),
    retry: false,
  });

  const attach = useMutation({
    mutationFn: (url: string) => apiPost<RepoSummary>(`/projects/${projectId}/repos`, { repo_url: url }),
    onSuccess: () => {
      toast.success("Repo attached");
      setAttachOpen(false);
      setRepoUrl("");
      queryClient.invalidateQueries({ queryKey: ["project-repos", projectId] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Attach failed"),
  });

  const detach = useMutation({
    mutationFn: (repoId: string) => apiFetch(`/projects/${projectId}/repos/${repoId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Repo detached");
      queryClient.invalidateQueries({ queryKey: ["project-repos", projectId] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Detach failed"),
  });

  const repos = listQuery.data ?? [];

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Repos</div>
          <h2 className="text-xl tracking-tight">
            Linked code
            {repos.length > 0 ? <span className="ml-2 text-[13px] font-normal text-[#6B6B66]">({repos.length})</span> : null}
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAttachOpen(true)}>
          <Plus className="mr-2 h-3.5 w-3.5" />
          Attach repo
        </Button>
      </div>

      {listQuery.isLoading ? (
        <Card className="border border-[#D8D2C4] bg-white p-4 text-[13px] text-[#6B6B66]">
          <Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin" />
          Loading repos...
        </Card>
      ) : repos.length === 0 ? (
        <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-6 text-center text-[13px] text-[#5C5C5C]">
          <Github className="mx-auto mb-2 h-4 w-4 text-[#6B6B66]" />
          No repos attached. Link a GitHub repo to cross-reference your chat timeline with commit history.
        </Card>
      ) : (
        <div className="space-y-2">
          {repos.map((repo) => (
            <Card key={repo.id} className="border border-[#D8D2C4] bg-white p-3">
              <div className="flex flex-wrap items-center gap-3">
                <Github className="h-4 w-4 shrink-0 text-[#161616]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={repo.repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-[14px] text-[#315D8A] hover:underline"
                    >
                      <span className="text-[#6B6B66]">{repo.repo_owner}/</span>
                      {repo.repo_name}
                    </a>
                    <ExternalLink className="h-3 w-3 shrink-0 text-[#6B6B66]" />
                    {repo.language ? (
                      <span className="rounded-full border border-[#D8D2C4] px-2 py-0.5 text-[10px] tracking-[0.08em] text-[#6B6B66]">
                        {repo.language}
                      </span>
                    ) : null}
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase ${
                      repo.parse_status === "parsed" ? "bg-[#D3E9D9] text-[#1F6A3F]" :
                      repo.parse_status === "failed" ? "bg-[#F3D1D1] text-[#8B2F2F]" :
                      "bg-[#EAE3CF] text-[#6B6B66]"
                    }`}>
                      {repo.parse_status}
                    </span>
                  </div>
                  {repo.description ? (
                    <div className="mt-1 line-clamp-1 text-[12px] text-[#5C5C5C]">{repo.description}</div>
                  ) : null}
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#6B6B66]">
                    {repo.stars != null ? <span>★ {repo.stars}</span> : null}
                    {repo.commit_count != null ? <span>{repo.commit_count} commits</span> : null}
                    {repo.correlation_score != null ? (
                      <span>correlation {Math.round(repo.correlation_score * 100)}%</span>
                    ) : null}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#8B2F2F] hover:bg-[#F3D1D1]/40 hover:text-[#8B2F2F]"
                  onClick={() => detach.mutate(repo.id)}
                  disabled={detach.isPending}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Detach
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={attachOpen} onOpenChange={setAttachOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach a GitHub repo</DialogTitle>
            <DialogDescription>
              Paste a public repo URL. The backend parses commits and correlates them with this project's
              conversation timeline, so the public proof page can show a correlation score.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Input
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              placeholder="https://github.com/owner/repo"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAttachOpen(false)}>Cancel</Button>
            <Button
              onClick={() => attach.mutate(repoUrl.trim())}
              disabled={attach.isPending || !repoUrl.trim().startsWith("http")}
            >
              {attach.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Github className="mr-2 h-4 w-4" />}
              Attach
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function KnowledgeMapDialog({
  open,
  projectId,
  onClose,
}: {
  open: boolean;
  projectId: string;
  onClose: () => void;
}) {
  const query = useQuery<any>({
    queryKey: ["knowledge-map", projectId],
    queryFn: () => apiFetch<any>(`/projects/${projectId}/knowledge-map`),
    enabled: open,
  });

  const data = query.data;
  const entities = Array.isArray(data?.entities) ? data.entities : [];
  const topics = Array.isArray(data?.topics) ? data.topics : [];
  const fingerprints = Array.isArray(data?.code_fingerprints) ? data.code_fingerprints : [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Knowledge map</DialogTitle>
          <DialogDescription>
            Entities, topics, and code fingerprints the parser pulled out of this project's conversations.
          </DialogDescription>
        </DialogHeader>
        {query.isLoading ? (
          <div className="flex items-center gap-2 p-4 text-[13px] text-[#6B6B66]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Building map...
          </div>
        ) : query.error ? (
          <div className="rounded-md border border-[#E8B8B8] bg-[#FBEAEA] p-3 text-[13px] text-[#8B2F2F]">
            Could not build the knowledge map right now.
          </div>
        ) : !data ? (
          <div className="text-[13px] text-[#6B6B66]">No data yet.</div>
        ) : (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto">
            {entities.length > 0 ? (
              <MapSection title="Entities" items={entities} />
            ) : null}
            {topics.length > 0 ? (
              <MapSection title="Topics" items={topics} />
            ) : null}
            {fingerprints.length > 0 ? (
              <MapSection title="Code fingerprints" items={fingerprints} />
            ) : null}
            {entities.length === 0 && topics.length === 0 && fingerprints.length === 0 ? (
              <div className="rounded-md border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-4 text-center text-[13px] text-[#6B6B66]">
                Map is empty. Parse more conversations to populate it.
              </div>
            ) : null}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MapSection({ title, items }: { title: string; items: any[] }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">{title} ({items.length})</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.slice(0, 60).map((item, index) => {
          const label = typeof item === "string" ? item : item?.label || item?.name || item?.value || item?.text || JSON.stringify(item);
          const count = typeof item === "object" ? (item.count ?? item.frequency ?? null) : null;
          return (
            <span
              key={index}
              className="inline-flex items-center gap-1 rounded-full border border-[#D8D2C4] bg-[#FBF8F1] px-2 py-0.5 text-[11px] text-[#5C5C5C]"
            >
              {String(label)}
              {count != null ? (
                <span className="text-[10px] text-[#A88F5F]">×{count}</span>
              ) : null}
            </span>
          );
        })}
        {items.length > 60 ? (
          <span className="inline-flex items-center rounded-full bg-[#F3EEE2] px-2 py-0.5 text-[10px] text-[#6B6B66]">
            +{items.length - 60}
          </span>
        ) : null}
      </div>
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
