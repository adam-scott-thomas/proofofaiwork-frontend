import { ArrowLeft, ArrowRight, CheckCircle2, FileBarChart, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useMemo } from "react";
import { useAssessments, useProject, useTriggerEvaluation } from "../../hooks/useApi";
import { apiPost } from "../../lib/api";
import { asArray, dateTime } from "../lib/poaw";

type ProjectConversation = {
  upload_id: string;
  title: string;
  turn_count: number;
  evidence_class?: string;
};

type Project = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  cluster_confidence?: number | null;
  conversations: ProjectConversation[];
  created_at: string;
  updated_at: string;
};

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-[#D3E9D9] text-[#1F6A3F]",
  suggested: "bg-[#DCE4F0] text-[#315D8A]",
  scuttled: "bg-[#EAE3CF] text-[#6B6B66]",
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: project, isLoading } = useProject(id ?? "") as { data?: Project; isLoading: boolean };
  const { data: assessmentsData } = useAssessments();
  const triggerEvaluation = useTriggerEvaluation();

  const projectAssessments = useMemo(() => {
    const all = asArray<any>(assessmentsData);
    return all
      .filter((assessment) => assessment.project_id === id)
      .sort((a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime());
  }, [assessmentsData, id]);

  const confirmProject = useMutation({
    mutationFn: () => apiPost(`/projects/${id}/confirm`, { title: project?.title, description: project?.description }),
    onSuccess: () => {
      toast.success("Project confirmed");
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Confirm failed"),
  });

  if (isLoading || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading project...
      </div>
    );
  }

  const status = String(project.status ?? "").toLowerCase();
  const canConfirm = status === "suggested";
  const canEvaluate = status === "confirmed";

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-7">
          <Link to="/app/projects" className="mb-4 inline-flex items-center gap-2 text-[13px] text-[#5C5C5C] hover:text-[#161616]">
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${STATUS_STYLE[status] ?? "bg-[#EAE3CF] text-[#6B6B66]"}`}>
                  {project.status}
                </span>
                <span className="text-[12px] text-[#6B6B66]">{project.conversations?.length ?? 0} conversations</span>
              </div>
              <h1 className="mt-3 text-3xl tracking-tight">{project.title}</h1>
              {project.description ? <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#5C5C5C]">{project.description}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {canConfirm ? (
                <Button disabled={confirmProject.isPending} onClick={() => confirmProject.mutate()}>
                  {confirmProject.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Confirm
                </Button>
              ) : null}
              <Button
                disabled={!canEvaluate || triggerEvaluation.isPending}
                onClick={() =>
                  triggerEvaluation.mutate(project.id, {
                    onSuccess: () => {
                      toast.success("Assessment started");
                      queryClient.invalidateQueries({ queryKey: ["assessments"] });
                    },
                    onError: (error: any) => toast.error(error?.message ?? "Assessment failed"),
                  })
                }
              >
                {triggerEvaluation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileBarChart className="mr-2 h-4 w-4" />}
                Run assessment
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section>
            <div className="mb-3 text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Conversations</div>
            <Card className="border border-[#D8D2C4] bg-white p-0">
              {(project.conversations ?? []).length > 0 ? (
                <div className="divide-y divide-[#EAE3CF]">
                  {project.conversations.map((conversation) => (
                    <Link key={conversation.upload_id} to={`/app/conversations/${conversation.upload_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#FBF8F1]">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] text-[#161616]">{conversation.title || conversation.upload_id}</div>
                        <div className="mt-0.5 text-[11px] text-[#6B6B66]">{conversation.turn_count ?? 0} turns</div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-[#6B6B66]" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-5 text-center text-[13px] text-[#6B6B66]">No conversations assigned yet.</div>
              )}
            </Card>
          </section>

          <aside className="space-y-4">
            <Card className="border border-[#D8D2C4] bg-white p-4">
              <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">Project facts</div>
              <dl className="mt-3 space-y-2 text-[12px]">
                <div className="flex justify-between gap-3"><dt className="text-[#6B6B66]">Created</dt><dd>{dateTime(project.created_at)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[#6B6B66]">Updated</dt><dd>{dateTime(project.updated_at)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[#6B6B66]">Assessments</dt><dd>{projectAssessments.length}</dd></div>
              </dl>
            </Card>
            <Card className="border border-[#D8D2C4] bg-white p-4">
              <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">Recent assessments</div>
              <div className="mt-3 space-y-2">
                {projectAssessments.slice(0, 5).map((assessment) => (
                  <Link key={assessment.id} to={`/app/assessment/${assessment.id}/results`} className="block rounded-md border border-[#EAE3CF] px-3 py-2 text-[12px] hover:bg-[#FBF8F1]">
                    <div className="text-[#161616]">{assessment.status}</div>
                    <div className="text-[11px] text-[#6B6B66]">{dateTime(assessment.updated_at ?? assessment.created_at)}</div>
                  </Link>
                ))}
                {projectAssessments.length === 0 ? <div className="text-[12px] text-[#6B6B66]">No assessments yet.</div> : null}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
