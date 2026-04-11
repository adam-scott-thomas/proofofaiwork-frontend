import { Plus, FolderKanban, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Link } from "react-router";
import { useState } from "react";
import { CreateProjectDialog } from "../components/CreateProjectDialog";
import { PaymentModal } from "../components/PaymentModal";
import { useProjects, useConversations } from "../../hooks/useApi";

export default function Projects() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [hasAISorted, setHasAISorted] = useState(false);

  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const { data: convsData, isLoading: convsLoading } = useConversations();

  const isLoading = hasAISorted ? projectsLoading : convsLoading;

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center text-[13px] text-[#717182]">Loading...</div>
  );

  const projects = Array.isArray(projectsData) ? projectsData : projectsData?.data ?? projectsData?.items ?? [];
  const conversations = Array.isArray(convsData) ? convsData : convsData?.data ?? convsData?.items ?? [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl tracking-tight">Projects</h1>
              <p className="mt-1 text-[13px] text-[#717182]">
                {!hasAISorted
                  ? "Your conversations are uploaded but not yet organized into structured work"
                  : "AI-organized work streams based on your conversation history"}
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </div>
        </div>
      </header>

      <div className="p-8">
        {!hasAISorted ? (
          <>
            {/* Raw Conversations (Pre-Sort) */}
            <div className="mb-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#C0C0C5]" />
                <h2 className="text-[15px] text-[#717182]">Raw Conversations (Pre-Sort)</h2>
              </div>
              <p className="mb-6 text-[13px] text-[#717182] max-w-2xl">
                These are your uploaded conversations. They are not yet organized or evaluated.
              </p>

              {conversations.length === 0 ? (
                <Card className="border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] p-8 text-center shadow-none">
                  <p className="text-[13px] text-[#717182]">No conversations uploaded yet.</p>
                </Card>
              ) : (
                <Card className="border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] shadow-none">
                  <div className="divide-y divide-[rgba(0,0,0,0.04)]">
                    {conversations.map((conv: any) => (
                      <div
                        key={conv.id}
                        className="px-6 py-3 hover:bg-white/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="text-[14px] text-[#717182]">{conv.title ?? conv.filename ?? conv.id}</div>
                          </div>
                          <div className="font-mono text-[12px] text-[#C0C0C5] whitespace-nowrap">
                            {new Date(conv.created_at ?? conv.timestamp ?? Date.now()).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <div className="mt-6 flex items-center justify-center">
                <Button size="lg" onClick={() => setPaymentModalOpen(true)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Run AI Sort — $7
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* AI-Organized Work (Post-Sort) */}
            <div className="mb-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'var(--score-execution)' }} />
                <h2 className="text-[15px]">AI-Organized Work (Post-Sort)</h2>
              </div>
              <p className="mb-6 text-[13px] text-[#3A3A3A] max-w-2xl">
                Your conversations have been analyzed and grouped into real work streams.
              </p>

              {projects.length === 0 ? (
                <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-8 text-center shadow-sm">
                  <p className="text-[13px] text-[#717182]">No projects yet. Create one to get started.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {projects.map((project: any) => (
                    <Link
                      key={project.id}
                      to={`/app/projects/${project.id}`}
                      className="block"
                    >
                      <Card className="border border-[rgba(0,0,0,0.08)] bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="px-6 py-5">
                          <div className="flex items-start justify-between gap-6">
                            <div className="flex-1">
                              <div className="mb-1 flex items-center gap-3">
                                <FolderKanban className="h-4 w-4" style={{ color: 'var(--score-execution)' }} />
                                <div className="text-[15px]">{project.name}</div>
                              </div>
                              <p className="mb-3 ml-7 text-[13px] text-[#717182]">{project.description ?? ""}</p>
                              <div className="ml-7 flex items-center gap-4 text-[13px] text-[#717182]">
                                <span>{project.conversation_count ?? 0} conversations</span>
                                <span className="font-mono">
                                  Created{" "}
                                  {new Date(project.created_at ?? Date.now()).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <ChevronRight className="h-5 w-5 text-[#717182]" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <CreateProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        onComplete={() => setHasAISorted(true)}
      />
    </div>
  );
}
