import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Loader2, Plus, Search, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useAiCluster, useClusterStatus, useCreateProject, useProjects } from "../../hooks/useApi";
import { apiPost } from "../../lib/api";
import { asArray, isoDate } from "../lib/poaw";

type Project = {
  id: string;
  title: string;
  description: string | null;
  status: "suggested" | "confirmed" | "scuttled" | string;
  conversation_count: number;
  cluster_confidence: number | null;
  created_at: string;
};

type FilterKey = "all" | "confirmed" | "suggested";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "confirmed", label: "Confirmed" },
  { key: "suggested", label: "Suggested" },
];

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-[#D3E9D9] text-[#1F6A3F]",
  suggested: "bg-[#DCE4F0] text-[#315D8A]",
  scuttled: "bg-[#EAE3CF] text-[#6B6B66]",
};

const statusKey = (status: string | null | undefined) => (status ?? "").toLowerCase();

export default function Projects() {
  const queryClient = useQueryClient();
  const { data: projectsData, isLoading } = useProjects();
  const createProject = useCreateProject();
  const aiCluster = useAiCluster();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [clusterOpen, setClusterOpen] = useState(false);
  const [clusterJobId, setClusterJobId] = useState<string | null>(null);
  const [clusterFinalized, setClusterFinalized] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const clusterStatus = useClusterStatus(clusterJobId, !clusterFinalized);

  const confirmProject = useMutation({
    mutationFn: (project: Project) => apiPost(`/projects/${project.id}/confirm`, { title: project.title, description: project.description }),
    onSuccess: () => {
      toast.success("Project confirmed");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["state"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Confirm failed"),
  });

  const projects = asArray<Project>(projectsData);

  const filtered = useMemo(() => {
    let result = projects;
    if (filter !== "all") result = result.filter((project) => statusKey(project.status) === filter);
    if (query.trim()) {
      const needle = query.trim().toLowerCase();
      result = result.filter((project) => project.title.toLowerCase().includes(needle) || (project.description?.toLowerCase() ?? "").includes(needle));
    }
    return [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [projects, filter, query]);

  const counts: Record<FilterKey, number> = {
    all: projects.length,
    confirmed: projects.filter((project) => statusKey(project.status) === "confirmed").length,
    suggested: projects.filter((project) => statusKey(project.status) === "suggested").length,
  };

  useEffect(() => {
    const status = clusterStatus.data?.status;
    if (!clusterJobId || clusterFinalized || !status) return;
    if (status === "complete") {
      setClusterFinalized(true);
      toast.success("AI group conversations complete");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["pool"] });
      queryClient.invalidateQueries({ queryKey: ["state"] });
    }
    if (status === "failed") {
      setClusterFinalized(true);
      toast.error(clusterStatus.data.error_message || "AI group conversations failed");
    }
  }, [clusterFinalized, clusterJobId, clusterStatus.data, queryClient]);

  const clusterJobActive = !!clusterJobId && !clusterFinalized && clusterStatus.data?.status !== "complete" && clusterStatus.data?.status !== "failed";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading projects...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Projects</div>
              <h1 className="mt-2 text-3xl tracking-tight">Group conversations into work streams.</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#5C5C5C]">
                Confirm suggested projects that feel right. Confirmed projects feed assessments.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setCreating(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New project
              </Button>
              <Button variant="outline" onClick={() => setClusterOpen(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                AI group conversations
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {FILTERS.map((filterConfig) => {
                const active = filter === filterConfig.key;
                return (
                  <button
                    key={filterConfig.key}
                    type="button"
                    onClick={() => setFilter(filterConfig.key)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] transition-colors ${
                      active ? "border-[#315D8A] bg-[#EEF2F9] text-[#161616]" : "border-[#D8D2C4] bg-white text-[#5C5C5C] hover:bg-[#FBF8F1]"
                    }`}
                  >
                    <span>{filterConfig.label}</span>
                    <span className="rounded-full bg-[#F3EEE2] px-1.5 py-0.5 text-[10px] text-[#6B6B66]">{counts[filterConfig.key]}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative ml-auto w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B6B66]" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects..." className="pl-7" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-10 text-center text-[14px] text-[#5C5C5C]">
              {projects.length === 0 ? <>No projects yet. Use AI group conversations or create one manually.</> : <>No projects match this filter.</>}
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((project) => (
                <ProjectCard key={project.id} project={project} onConfirm={() => confirmProject.mutate(project)} confirmPending={confirmProject.isPending} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>Manual projects start confirmed. Add conversations from the pool afterwards.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Project title" />
            <Textarea value={newDescription} onChange={(event) => setNewDescription(event.target.value)} placeholder="Description" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            <Button
              disabled={createProject.isPending || !newTitle.trim()}
              onClick={() => {
                createProject.mutate(
                  { title: newTitle.trim(), description: newDescription.trim() || undefined },
                  {
                    onSuccess: () => {
                      toast.success("Project created");
                      setCreating(false);
                      setNewTitle("");
                      setNewDescription("");
                      queryClient.invalidateQueries({ queryKey: ["state"] });
                    },
                    onError: (error: any) => toast.error(error?.message ?? "Create failed"),
                  },
                );
              }}
            >
              {createProject.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={clusterOpen} onOpenChange={(open) => {
        setClusterOpen(open);
        if (!open && !clusterJobActive) {
          setClusterJobId(null);
          setClusterFinalized(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI group conversations</DialogTitle>
            <DialogDescription>Ask the AI grouping service to organize unassigned conversations into suggested projects.</DialogDescription>
          </DialogHeader>
          {clusterJobId ? (
            <div className="rounded-md border border-[#D8D2C4] bg-[#FBF8F1] p-3 text-[13px] text-[#5C5C5C]">
              {clusterStatus.data?.status === "complete"
                ? "AI group conversations complete."
                : clusterStatus.data?.status === "failed"
                  ? "AI group conversations failed."
                  : clusterStatus.data?.status === "running"
                    ? "AI is grouping conversations..."
                    : "AI group conversations queued."}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setClusterOpen(false)} disabled={clusterJobActive}>Cancel</Button>
            <Button
              disabled={aiCluster.isPending || clusterJobActive}
              onClick={() => {
                toast.info("Calling AI group conversations API...");
                aiCluster.mutate({ tier: "free" }, {
                  onSuccess: (result) => {
                    setClusterFinalized(false);
                    setClusterJobId(result.job_id);
                    toast.success("AI group conversations queued");
                  },
                  onError: (error: any) => toast.error(error?.message ?? "AI group conversations failed"),
                });
              }}
            >
              {aiCluster.isPending || clusterJobActive ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {aiCluster.isPending ? "Calling API..." : clusterJobActive ? "AI thinking..." : "AI group conversations"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectCard({ project, onConfirm, confirmPending }: { project: Project; onConfirm: () => void; confirmPending: boolean }) {
  const status = statusKey(project.status);
  return (
    <Card className="group border border-[#D8D2C4] bg-white p-4 transition-colors hover:border-[#A88F5F] hover:bg-[#FBF8F1]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${STATUS_STYLE[status] ?? "bg-[#EAE3CF] text-[#6B6B66]"}`}>{project.status}</span>
            <span className="text-[11px] text-[#6B6B66]">{isoDate(project.created_at)}</span>
          </div>
          <Link to={`/app/projects/${project.id}`} className="mt-2 block">
            <div className="truncate text-[15px] text-[#161616] group-hover:text-[#315D8A]">{project.title}</div>
          </Link>
          {project.description ? <div className="mt-1 line-clamp-2 text-[12px] leading-snug text-[#5C5C5C]">{project.description}</div> : null}
          <div className="mt-3 text-[11px] text-[#6B6B66]">{project.conversation_count ?? 0} conversations</div>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          {status === "suggested" ? (
            <Button size="sm" onClick={onConfirm} disabled={confirmPending}>
              {confirmPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-2 h-3.5 w-3.5" />}
              Confirm
            </Button>
          ) : null}
          <Link to={`/app/projects/${project.id}`}>
            <Button variant="outline" size="sm">
              Open
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
