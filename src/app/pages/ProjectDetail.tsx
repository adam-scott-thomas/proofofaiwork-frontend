import {
  ArrowLeft,
  FolderKanban,
  Play,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Link, useParams, useNavigate } from "react-router";
import { useProject, useTriggerEvaluation } from "../../hooks/useApi";
import { apiFetch, apiPost } from "../../lib/api";
import { useState } from "react";
import { toast } from "sonner";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id ?? "");
  const triggerEvaluation = useTriggerEvaluation();
  const [evaluating, setEvaluating] = useState(false);

  const handleRunAssessment = async () => {
    if (!id) return;
    setEvaluating(true);
    try {
      // Check if a brief exists; if not, auto-create a minimal one
      try {
        await apiFetch(`/intake/${id}`);
      } catch {
        // No brief — create one from project data. Backend requires:
        //   goal_statement (≥10 chars), solo_time_estimate_hours (>0),
        //   starting_point ∈ {"from_scratch","iterating"}
        const projectName = project?.title ?? project?.name ?? "this project";
        const goalStatement = project?.description && project.description.length >= 10
          ? project.description
          : `Evaluate the work captured in ${projectName} and assess human/AI collaboration quality.`;
        await apiPost("/intake", {
          project_id: id,
          goal_statement: goalStatement,
          solo_time_estimate_hours: 10,
          starting_point: "from_scratch",
          role_declaration: "individual_contributor",
          difficulty_self_rating: 3,
        });
      }

      // Now run the evaluation
      triggerEvaluation.mutate(id, {
        onSuccess: () => {
          toast.success("Assessment started — check Assessments page for results");
          navigate("/app/assessments");
        },
        onError: (err: any) => {
          toast.error(err?.message ?? "Failed to start assessment");
          setEvaluating(false);
        },
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to start assessment");
      setEvaluating(false);
    }
  };

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center text-[13px] text-[#717182]">Loading...</div>
  );

  const conversations = Array.isArray(project?.conversations) ? project.conversations : [];
  const workProfile = project?.work_profile ?? project?.workProfile ?? null;
  const hasAssessment = !!workProfile;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="px-8 py-6">
          <div className="mb-4">
            <Link to="/app/projects">
              <Button variant="ghost" size="sm" className="-ml-3">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Button>
            </Link>
          </div>
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <FolderKanban className="h-5 w-5 text-[#717182]" />
                <h1 className="text-xl tracking-tight">{project?.title ?? project?.name ?? "Project"}</h1>
                {hasAssessment && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    Assessed
                  </Badge>
                )}
              </div>
              <p className="mb-3 text-[14px] text-[#717182]">{project?.description ?? ""}</p>
              <div className="flex items-center gap-4 text-[13px] text-[#717182]">
                <span>{project?.conversation_count ?? conversations.length} conversations</span>
                {project?.created_at && (
                  <span className="font-mono">
                    Created {new Date(project.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                disabled={evaluating || triggerEvaluation.isPending}
                onClick={handleRunAssessment}
              >
                <Play className="mr-2 h-4 w-4" />
                {evaluating || triggerEvaluation.isPending ? "Starting…" : "Run Assessment"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Work Profile Scores (if assessed) */}
        {hasAssessment && (
          <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
            <div className="mb-4 text-[13px] uppercase tracking-wider text-[#717182]">
              Project Work Profile
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div className="border-r border-[rgba(0,0,0,0.06)] pr-8">
                <div className="mb-1 text-[13px] text-[#717182]">Human Leadership</div>
                <div className="text-5xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--score-hls)' }}>
                  {workProfile.hls ?? workProfile.human_leadership_score ?? "—"}
                </div>
              </div>
              <div className="border-r border-[rgba(0,0,0,0.06)] pr-8">
                <div className="mb-1 text-[13px] text-[#717182]">AI Execution Load</div>
                <div className="text-5xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--score-execution)' }}>
                  {workProfile.ai_execution_load != null
                    ? `${(workProfile.ai_execution_load * 100).toFixed(0)}%`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="mb-1 text-[13px] text-[#717182]">Cognitive Amplification Index</div>
                <div className="text-5xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--score-cai)' }}>
                  {workProfile.cai ?? "—"}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-6">
          {/* Conversations */}
          <div className="space-y-4">
            <Card className="border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
              <div className="border-b border-[rgba(0,0,0,0.06)] px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px]">Project Conversations</h3>
                </div>
              </div>
              {conversations.length === 0 ? (
                <div className="px-6 py-8 text-center text-[13px] text-[#717182]">
                  No conversations in this project yet.
                </div>
              ) : (
                <div className="divide-y divide-[rgba(0,0,0,0.04)]">
                  {conversations.map((conv: any) => (
                    <Link
                      key={conv.id}
                      to={`/app/conversations/${conv.id}`}
                      className="block px-6 py-5 hover:bg-[#FAFAFA] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="mb-1 text-[14px]">{conv.title ?? conv.filename ?? conv.id}</div>
                          <div className="mb-2 flex items-center gap-4 text-[13px] text-[#717182]">
                            {conv.turn_count != null && <span>{conv.turn_count} turns</span>}
                            {conv.model && <span>{conv.model}</span>}
                            {conv.created_at && (
                              <span className="font-mono">
                                {new Date(conv.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                          </div>
                          {Array.isArray(conv.tags) && conv.tags.length > 0 && (
                            <div className="flex items-center gap-2">
                              {conv.tags.map((tag: string) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="border-[rgba(0,0,0,0.08)] bg-white text-[11px] font-mono"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

