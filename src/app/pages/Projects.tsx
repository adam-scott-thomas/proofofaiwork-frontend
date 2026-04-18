import { FolderKanban, Loader2, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAiCluster, useCreateProject, useProjects } from "../../hooks/useApi";
import { apiFetch, apiPost } from "../../lib/api";
import { asArray, isoDate } from "../lib/poaw";

export default function Projects() {
  const qc = useQueryClient();
  const { data: projectsData, isLoading } = useProjects();
  const createProject = useCreateProject();
  const aiCluster = useAiCluster();
  const [creating, setCreating] = useState(false);
  const [clustering, setClustering] = useState(false);
  const [title, setTitle] = useState("");

  const [unassigned, setUnassigned] = useState<any[] | null>(null);
  const [loadingUnassigned, setLoadingUnassigned] = useState(false);

  const loadUnassigned = async () => {
    setLoadingUnassigned(true);
    try {
      const data = await apiFetch<any>("/projects/unassigned");
      setUnassigned(data?.conversations ?? []);
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to load unassigned conversations");
    } finally {
      setLoadingUnassigned(false);
    }
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    createProject.mutate(
      { title: title.trim() },
      {
        onSuccess: () => {
          setTitle("");
          setCreating(false);
          toast.success("Project created");
        },
        onError: (error: any) => toast.error(error?.message ?? "Failed to create project"),
      },
    );
  };

  const handleCluster = () => {
    setClustering(true);
    aiCluster.mutate(undefined, {
      onSuccess: (data: any) => {
        const count = data?.projects?.length ?? 0;
        toast.success(`AI clustering created ${count} project${count === 1 ? "" : "s"}`);
        qc.invalidateQueries({ queryKey: ["projects"] });
        qc.invalidateQueries({ queryKey: ["pool"] });
        loadUnassigned();
      },
      onError: (error: any) => toast.error(error?.message ?? "Clustering failed"),
      onSettled: () => setClustering(false),
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        Loading projects...
      </div>
    );
  }

  const projects = asArray<any>(projectsData);

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Projects</div>
              <h1 className="mt-2 text-3xl tracking-tight">Group conversations into real work.</h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#5C5C5C]">
                Suggested projects can be confirmed later. The key here is to make sure uploaded conversations
                land in the right work stream before you evaluate them.
              </p>
            </div>
            <Button variant="outline" onClick={loadUnassigned} disabled={loadingUnassigned}>
              {loadingUnassigned ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              View unassigned
            </Button>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="grid grid-cols-[1.4fr_1fr] gap-6">
          <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Existing projects</div>
                <div className="mt-1 text-[14px] text-[#5C5C5C]">{projects.length} work streams in the workspace</div>
              </div>
              <Button onClick={() => setCreating((value) => !value)}>
                <Plus className="mr-2 h-4 w-4" />
                Create project
              </Button>
            </div>

            {creating ? (
              <div className="mb-5 rounded-lg border border-[#D8D2C4] bg-[#FBF8F1] p-4">
                <div className="mb-2 text-[13px] text-[#5C5C5C]">Manual project title</div>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Example: March launch materials"
                  className="mb-3 w-full rounded-md border border-[#D8D2C4] bg-white px-3 py-2 text-sm outline-none"
                />
                <div className="flex gap-2">
                  <Button onClick={handleCreate} disabled={createProject.isPending || !title.trim()}>
                    Create
                  </Button>
                  <Button variant="outline" onClick={() => setCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            {projects.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#D8D2C4] bg-[#FBF8F1] px-5 py-8 text-[14px] text-[#5C5C5C]">
                No projects yet. Run clustering or create one manually.
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Link key={project.id} to={`/app/projects/${project.id}`} className="block">
                    <div className="rounded-lg border border-[#D8D2C4] bg-[#FBF8F1] px-4 py-4 transition-colors hover:bg-[#F3EEE2]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-[15px]">
                            <FolderKanban className="h-4 w-4 text-[#315D8A]" />
                            {project.title}
                          </div>
                          <div className="mt-1 text-[13px] text-[#5C5C5C]">
                            {project.conversation_count} conversations • {project.status}
                          </div>
                          {project.description ? (
                            <div className="mt-2 text-[13px] text-[#5C5C5C]">{project.description}</div>
                          ) : null}
                        </div>
                        <div className="text-right text-[12px] text-[#6B6B66]">
                          <div>{isoDate(project.created_at)}</div>
                          {project.cluster_confidence != null ? (
                            <div className="mt-1">confidence {Math.round(project.cluster_confidence * 100)}%</div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="border border-[#D8D2C4] bg-[#FBF8F1] p-6 shadow-sm">
            <div className="text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Tools</div>
            <div className="mt-4 rounded-lg border border-[#D8D2C4] bg-white p-4">
              <div className="flex items-center gap-2 text-[15px]">
                <Sparkles className="h-4 w-4 text-[#315D8A]" />
                AI clustering
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-[#5C5C5C]">
                This reads unassigned conversations and proposes projects. You still control the final structure.
              </p>
              <Button className="mt-4 w-full" onClick={handleCluster} disabled={clustering || aiCluster.isPending}>
                {clustering || aiCluster.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Run clustering
              </Button>
            </div>

            <div className="mt-4 rounded-lg border border-[#D8D2C4] bg-white p-4">
              <div className="text-[15px]">Unassigned conversations</div>
              {unassigned === null ? (
                <p className="mt-2 text-[13px] text-[#5C5C5C]">Load them to see what still needs to be placed.</p>
              ) : unassigned.length === 0 ? (
                <p className="mt-2 text-[13px] text-[#5C5C5C]">Everything is assigned.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {unassigned.slice(0, 6).map((conversation) => (
                    <div key={conversation.upload_id} className="rounded-md border border-[#D8D2C4] bg-[#FBF8F1] px-3 py-2">
                      <div className="text-[13px]">{conversation.title}</div>
                      <div className="mt-1 text-[12px] text-[#6B6B66]">{conversation.turn_count} turns</div>
                    </div>
                  ))}
                </div>
              )}
              {unassigned && unassigned.length > 6 ? (
                <div className="mt-3 text-[12px] text-[#6B6B66]">Showing 6 of {unassigned.length} unassigned conversations.</div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
