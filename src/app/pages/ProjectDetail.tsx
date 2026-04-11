import {
  ArrowLeft,
  FolderKanban,
  MessageSquare,
  GitBranch,
  Shield,
  Eye,
  Settings,
  Play,
  Trash2,
  MoreVertical
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Link, useParams, useNavigate } from "react-router";
import { useProject, useTriggerEvaluation } from "../../hooks/useApi";
import { toast } from "sonner";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id ?? "");
  const triggerEvaluation = useTriggerEvaluation();

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center text-[13px] text-[#717182]">Loading...</div>
  );

  const conversations = Array.isArray(project?.conversations) ? project.conversations : [];
  const repos = Array.isArray(project?.repos) ? project.repos : [];
  const masks = Array.isArray(project?.masks) ? project.masks : [];
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
                <h1 className="text-xl tracking-tight">{project?.name ?? "Project"}</h1>
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
                disabled={triggerEvaluation.isPending}
                onClick={() => {
                  if (!id) return;
                  triggerEvaluation.mutate(id, {
                    onSuccess: () => {
                      toast.success("Assessment started — check Assessments page for results");
                      navigate("/app/assessments");
                    },
                    onError: (err: any) => toast.error(err?.message ?? "Failed to start assessment"),
                  });
                }}
              >
                <Play className="mr-2 h-4 w-4" />
                {triggerEvaluation.isPending ? "Starting…" : "Run Assessment"}
              </Button>
              <Button variant="outline" onClick={() => toast.info("Project settings coming soon")}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={() => toast.info("Coming soon")}>
                <MoreVertical className="h-4 w-4" />
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

        <Tabs defaultValue="conversations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="conversations">
              <MessageSquare className="mr-2 h-4 w-4" />
              Conversations
            </TabsTrigger>
            <TabsTrigger value="repos">
              <GitBranch className="mr-2 h-4 w-4" />
              Repositories
            </TabsTrigger>
            <TabsTrigger value="censorship">
              <Shield className="mr-2 h-4 w-4" />
              Censorship
            </TabsTrigger>
          </TabsList>

          {/* Conversations Tab */}
          <TabsContent value="conversations" className="space-y-4">
            <Card className="border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
              <div className="border-b border-[rgba(0,0,0,0.06)] px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px]">Project Conversations</h3>
                  <Button variant="outline" size="sm" onClick={() => toast.info("Coming soon")}>
                    Add Conversation
                  </Button>
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
          </TabsContent>

          {/* Repositories Tab */}
          <TabsContent value="repos" className="space-y-4">
            <Card className="border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
              <div className="border-b border-[rgba(0,0,0,0.06)] px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px]">Attached Repositories</h3>
                  <Button variant="outline" size="sm" onClick={() => toast.info("Repository attachment coming soon")}>
                    <GitBranch className="mr-2 h-4 w-4" />
                    Attach Repository
                  </Button>
                </div>
              </div>
              {repos.length === 0 ? (
                <div className="px-6 py-8 text-center text-[13px] text-[#717182]">
                  No repositories attached yet.
                </div>
              ) : (
                <div className="divide-y divide-[rgba(0,0,0,0.04)]">
                  {repos.map((repo: any) => (
                    <div key={repo.id} className="px-6 py-5">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-3">
                            <GitBranch className="h-4 w-4 text-[#717182]" />
                            <span className="font-mono text-[14px]">{repo.url}</span>
                          </div>
                          <div className="ml-7 flex items-center gap-4 text-[13px] text-[#717182]">
                            {repo.branch && <span>Branch: {repo.branch}</span>}
                            {repo.commits != null && <span>{repo.commits} commits analyzed</span>}
                            {repo.added_at && (
                              <span className="font-mono">
                                Added {new Date(repo.added_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => toast.info("Correlation view coming soon")}>
                            View Correlations
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => toast.info("Repository removal coming soon")}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="border border-blue-200 bg-blue-50 p-6 shadow-sm">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 flex-shrink-0">
                  <GitBranch className="h-5 w-5 text-blue-700" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-[15px] text-blue-900">Repository Correlation</h3>
                  <p className="text-[13px] text-blue-800">
                    Attached repositories are analyzed to correlate code commits with conversation timestamps,
                    providing evidence of conversation-to-output validation.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Censorship Tab */}
          <TabsContent value="censorship" className="space-y-4">
            <Card className="border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
              <div className="border-b border-[rgba(0,0,0,0.06)] px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px]">Censorship Masks</h3>
                  <Button variant="outline" size="sm" onClick={() => toast.info("Content masking coming soon")}>
                    <Shield className="mr-2 h-4 w-4" />
                    Add Mask
                  </Button>
                </div>
              </div>
              {masks.length === 0 ? (
                <div className="px-6 py-8 text-center text-[13px] text-[#717182]">
                  No censorship masks configured.
                </div>
              ) : (
                <div className="divide-y divide-[rgba(0,0,0,0.04)]">
                  {masks.map((mask: any) => (
                    <div key={mask.id} className="px-6 py-5">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-3">
                            <Shield className="h-4 w-4 text-[#717182]" />
                            <span className="font-mono text-[14px]">{mask.pattern}</span>
                            <Badge variant="secondary" className="bg-[#F5F5F7]">
                              {mask.type}
                            </Badge>
                          </div>
                          {mask.created_at && (
                            <div className="ml-7 text-[13px] text-[#717182] font-mono">
                              Created {new Date(mask.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => toast.info("Mask removal coming soon")}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 flex-shrink-0">
                  <Shield className="h-5 w-5 text-amber-700" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-[15px] text-amber-900">Content Masking</h3>
                  <p className="text-[13px] text-amber-800">
                    Masks allow you to redact sensitive information (API keys, credentials, proprietary data)
                    before generating proof pages. Patterns use regex syntax. Preview censored content before publishing.
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => toast.info("Content preview coming soon")}>
                <Eye className="mr-2 h-4 w-4" />
                Preview Censored Content
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
