import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Eraser,
  FolderKanban,
  Loader2,
  MessagesSquare,
  PlayCircle,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Link } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
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
  useAiClusterEstimate,
  useBulkDeleteProjects,
  useClearSuggestedProjects,
  useClusterStatus,
  useCreateProject,
  useDeleteProject,
  useProjects,
  useReclusterProjects,
} from "../../hooks/useApi";
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
  raw_data_scuttled?: boolean;
  scuttled_at?: string | null;
};

type FilterKey = "all" | "confirmed" | "suggested" | "scuttled";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "confirmed", label: "Confirmed" },
  { key: "suggested", label: "Suggested" },
  { key: "scuttled", label: "Archived" },
];

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-[#D3E9D9] text-[#1F6A3F]",
  suggested: "bg-[#DCE4F0] text-[#315D8A]",
  scuttled: "bg-[#EAE3CF] text-[#6B6B66]",
};

const projectStatusKey = (status: string | null | undefined) => (status ?? "").toLowerCase();

export default function Projects() {
  const queryClient = useQueryClient();
  const { data: projectsData, isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const bulkDeleteProjects = useBulkDeleteProjects();
  const clearSuggestedProjects = useClearSuggestedProjects();
  const reclusterProjects = useReclusterProjects();
  const estimate = useAiClusterEstimate();

  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [clusterOpen, setClusterOpen] = useState(false);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [clearSuggestedOpen, setClearSuggestedOpen] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [clusterJobId, setClusterJobId] = useState<string | null>(null);
  const [clusterFinalized, setClusterFinalized] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const clusterStatus = useClusterStatus(clusterJobId, !clusterFinalized);

  const confirmProject = useMutation({
    mutationFn: (project: Project) =>
      apiPost(`/projects/${project.id}/confirm`, {
        title: project.title,
        description: project.description,
      }),
    onSuccess: () => {
      toast.success("Project confirmed");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Confirm failed"),
  });

  const projects = asArray<Project>(projectsData);

  const filtered = useMemo(() => {
    let result = projects;
    if (filter !== "all") result = result.filter((project) => projectStatusKey(project.status) === filter);
    if (query.trim()) {
      const needle = query.trim().toLowerCase();
      result = result.filter((project) =>
        project.title.toLowerCase().includes(needle) ||
        (project.description?.toLowerCase() ?? "").includes(needle),
      );
    }
    return [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [projects, filter, query]);

  const counts: Record<FilterKey, number> = {
    all: projects.length,
    confirmed: projects.filter((project) => projectStatusKey(project.status) === "confirmed").length,
    suggested: projects.filter((project) => projectStatusKey(project.status) === "suggested").length,
    scuttled: projects.filter((project) => projectStatusKey(project.status) === "scuttled").length,
  };

  useEffect(() => {
    const status = clusterStatus.data?.status;
    if (!clusterJobId || clusterFinalized || !status) return;

    if (status === "complete") {
      const count = clusterStatus.data.result?.projects?.length ?? 0;
      setClusterFinalized(true);
      toast.success(`Created ${count} project${count === 1 ? "" : "s"}`);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["pool"] });
    }

    if (status === "failed") {
      setClusterFinalized(true);
      toast.error(clusterStatus.data.error_message || "AI clustering failed");
    }
  }, [clusterFinalized, clusterJobId, clusterStatus.data, queryClient]);

  const resetClusterJob = () => {
    setClusterJobId(null);
    setClusterFinalized(false);
  };

  const clusterJobActive =
    !!clusterJobId &&
    !clusterFinalized &&
    clusterStatus.data?.status !== "complete" &&
    clusterStatus.data?.status !== "failed";

  const selectedCount = selectedProjectIds.length;
  const visibleSelected = filtered.length > 0 && filtered.every((project) => selectedProjectIds.includes(project.id));

  const toggleProjectSelection = (projectId: string, checked: boolean) => {
    setSelectedProjectIds((current) =>
      checked ? Array.from(new Set([...current, projectId])) : current.filter((id) => id !== projectId),
    );
  };

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
              <h1 className="mt-2 text-3xl tracking-tight">Group conversations into real work streams.</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#5C5C5C]">
                Suggested projects come from clustering. Confirm ones that feel right, rename, merge, or delete the rest.
                Only confirmed projects feed assessments.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setCreating(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New project
              </Button>
              <Button
                variant="outline"
                onClick={() => setClearSuggestedOpen(true)}
                disabled={counts.suggested === 0}
              >
                <Eraser className="mr-2 h-4 w-4" />
                Clear suggested
              </Button>
              <Button
                variant="outline"
                onClick={() => setBulkDeleteOpen(true)}
                disabled={selectedCount === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Dissolve selected
              </Button>
              <Button variant="outline" onClick={() => setClusterOpen(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Try AI clustering
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
                      active
                        ? "border-[#315D8A] bg-[#EEF2F9] text-[#161616]"
                        : "border-[#D8D2C4] bg-white text-[#5C5C5C] hover:bg-[#FBF8F1]"
                    }`}
                  >
                    <span>{filterConfig.label}</span>
                    <span className="rounded-full bg-[#F3EEE2] px-1.5 py-0.5 text-[10px] text-[#6B6B66]">
                      {counts[filterConfig.key]}
                    </span>
                  </button>
                );
              })}
              {filtered.length > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (visibleSelected) {
                      setSelectedProjectIds((current) =>
                        current.filter((id) => !filtered.some((project) => project.id === id)),
                      );
                    } else {
                      setSelectedProjectIds((current) =>
                        Array.from(new Set([...current, ...filtered.map((project) => project.id)])),
                      );
                    }
                  }}
                >
                  {visibleSelected ? "Clear visible" : "Select visible"}
                </Button>
              ) : null}
              {selectedCount > 0 ? (
                <span className="text-[12px] text-[#6B6B66]">{selectedCount} selected</span>
              ) : null}
            </div>
            <div className="relative ml-auto w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B6B66]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects..."
                className="pl-7"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-10 text-center text-[14px] text-[#5C5C5C]">
              {projects.length === 0 ? (
                <>
                  No projects yet.{" "}
                  <button type="button" onClick={() => setClusterOpen(true)} className="underline">
                    Run clustering
                  </button>{" "}
                  or create one manually.
                </>
              ) : (
                <>No projects match this filter.</>
              )}
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  selected={selectedProjectIds.includes(project.id)}
                  onSelect={(checked) => toggleProjectSelection(project.id, checked)}
                  onConfirm={() => confirmProject.mutate(project)}
                  onDelete={() => setDeleting(project)}
                  confirmPending={confirmProject.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              Manual projects start confirmed. Add conversations from the pool afterwards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">Title</label>
              <Input
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="March launch materials"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">Description (optional)</label>
              <Textarea
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
                placeholder="What is this work stream about?"
                rows={3}
                className="mt-1"
              />
            </div>
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

      <Dialog
        open={clusterOpen}
        onOpenChange={(open) => {
          setClusterOpen(open);
          if (!open && !clusterJobActive) resetClusterJob();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Try AI clustering</DialogTitle>
            <DialogDescription>
              Dissolves current suggested projects and asks the AI clusterer to regroup unassigned conversations.
              Confirmed work is untouched.
            </DialogDescription>
          </DialogHeader>
          {estimate.data ? (
            <div className="rounded-md border border-[#D8D2C4] bg-[#FBF8F1] p-3 text-[13px] text-[#5C5C5C]">
              <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">Estimate</div>
              <div className="mt-1">
                {estimate.data.conversation_count ?? 0} unassigned conversation{estimate.data.conversation_count === 1 ? "" : "s"} ready for grouping
              </div>
            </div>
          ) : null}
          {clusterJobId ? (
            <div className={`rounded-md border p-3 text-[13px] ${
              clusterStatus.data?.status === "failed"
                ? "border-[#E8B8B8] bg-[#FBEAEA] text-[#8B2F2F]"
                : clusterStatus.data?.status === "complete"
                  ? "border-[#BFD8C5] bg-[#EFF8F1] text-[#1F6A3F]"
                  : "border-[#D8D2C4] bg-[#FBF8F1] text-[#5C5C5C]"
            }`}>
              <div className="flex items-center gap-2">
                {clusterJobActive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                <span className="font-medium">
                  {clusterStatus.data?.status === "complete"
                    ? "AI clustering complete"
                    : clusterStatus.data?.status === "failed"
                      ? "AI clustering failed"
                      : clusterStatus.data?.status === "running"
                        ? "AI clustering conversations"
                        : "AI clustering queued"}
                </span>
              </div>
              {clusterStatus.data?.status === "complete" ? (
                <div className="mt-1 text-[12px]">
                  {clusterStatus.data.result?.projects?.length ?? 0} project{(clusterStatus.data.result?.projects?.length ?? 0) === 1 ? "" : "s"} created,
                  {" "}{clusterStatus.data.result?.unclustered_count ?? 0} left unclustered.
                </div>
              ) : null}
              {clusterStatus.data?.status === "failed" ? (
                <div className="mt-1 text-[12px]">
                  {clusterStatus.data.error_message || "The AI clustering job failed."}
                </div>
              ) : null}
            </div>
          ) : null}
          {reclusterProjects.isPending && !clusterJobId ? (
            <div className="rounded-md border border-[#D8D2C4] bg-[#FBF8F1] p-3 text-[13px] text-[#5C5C5C]">
              <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#315D8A]" />
                <span className="font-medium">Calling AI clustering API...</span>
              </div>
              <div className="mt-1 text-[12px]">Waiting for the backend to accept the job.</div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setClusterOpen(false)} disabled={clusterJobActive}>
              {clusterStatus.data?.status === "complete" || clusterStatus.data?.status === "failed" ? "Close" : "Cancel"}
            </Button>
            <Button
              disabled={reclusterProjects.isPending || clusterJobActive}
              onClick={() => {
                toast.info("Calling AI clustering API...");
                reclusterProjects.mutate({ mode: "ai", tier: "free" }, {
                  onSuccess: (result) => {
                    if (!result?.job_id) {
                      toast.error("AI clustering did not return a job id");
                      return;
                    }
                    setClusterFinalized(false);
                    setClusterJobId(result.job_id);
                    toast.success("AI clustering job queued");
                    if (result.dissolved_suggestions > 0) {
                      toast.success(`Dissolved ${result.dissolved_suggestions} suggested project${result.dissolved_suggestions === 1 ? "" : "s"}`);
                    }
                  },
                  onError: (error: any) => {
                    toast.error(error?.message ?? "AI clustering failed");
                  },
                });
              }}
            >
              {reclusterProjects.isPending || clusterJobActive ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {reclusterProjects.isPending ? "Calling API..." : clusterJobActive ? "AI thinking..." : "Try AI clustering"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dissolve selected projects?</DialogTitle>
            <DialogDescription>
              Conversations from dissolvable projects move back to the pool. Confirmed, evaluating, and published
              projects are skipped automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBulkDeleteOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#8B2F2F] hover:bg-[#7A2525]"
              disabled={bulkDeleteProjects.isPending || selectedCount === 0}
              onClick={() =>
                bulkDeleteProjects.mutate(selectedProjectIds, {
                  onSuccess: (result) => {
                    toast.success(`Dissolved ${result.dissolved} project${result.dissolved === 1 ? "" : "s"}${result.skipped ? `, skipped ${result.skipped}` : ""}`);
                    setSelectedProjectIds([]);
                    setBulkDeleteOpen(false);
                  },
                  onError: (error: any) => toast.error(error?.message ?? "Dissolve failed"),
                })
              }
            >
              {bulkDeleteProjects.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Dissolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={clearSuggestedOpen} onOpenChange={setClearSuggestedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all suggested projects?</DialogTitle>
            <DialogDescription>
              Removes every suggested project and returns its conversations to the unassigned pool. Confirmed work
              is untouched.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setClearSuggestedOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#8B2F2F] hover:bg-[#7A2525]"
              disabled={clearSuggestedProjects.isPending || counts.suggested === 0}
              onClick={() =>
                clearSuggestedProjects.mutate(undefined, {
                  onSuccess: (result) => {
                    toast.success(`Cleared ${result.dissolved} suggested project${result.dissolved === 1 ? "" : "s"}`);
                    setSelectedProjectIds([]);
                    setClearSuggestedOpen(false);
                  },
                  onError: (error: any) => toast.error(error?.message ?? "Clear suggested failed"),
                })
              }
            >
              {clearSuggestedProjects.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eraser className="mr-2 h-4 w-4" />}
              Clear suggested
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.title ?? "this project"}?</DialogTitle>
            <DialogDescription>
              Conversations linked to this project are moved back to the pool. Assessments linked to this project
              are kept but lose their project reference.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              className="bg-[#8B2F2F] hover:bg-[#7A2525]"
              disabled={deleteProject.isPending}
              onClick={() =>
                deleting &&
                deleteProject.mutate(deleting.id, {
                  onSuccess: () => {
                    toast.success("Project deleted");
                    setDeleting(null);
                  },
                  onError: (error: any) => toast.error(error?.message ?? "Delete failed"),
                })
              }
            >
              {deleteProject.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectCard({
  project,
  selected,
  onSelect,
  onConfirm,
  onDelete,
  confirmPending,
}: {
  project: Project;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onConfirm: () => void;
  onDelete: () => void;
  confirmPending: boolean;
}) {
  const statusKey = projectStatusKey(project.status);
  const isSuggested = statusKey === "suggested";
  const isConfirmed = statusKey === "confirmed";
  const isScuttled = statusKey === "scuttled";
  const confidencePct = project.cluster_confidence != null ? Math.round(project.cluster_confidence * 100) : null;

  return (
    <Card className="border border-[#D8D2C4] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Checkbox checked={selected} onCheckedChange={(checked) => onSelect(checked === true)} />
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase ${STATUS_STYLE[statusKey] || "bg-[#EAE3CF] text-[#6B6B66]"}`}>
            {project.status}
          </span>
        </div>
        <span className="text-[11px] text-[#6B6B66]">{isoDate(project.created_at)}</span>
      </div>

      <Link to={`/app/projects/${project.id}`} className="group mt-2 block">
        <div className="flex items-start gap-2">
          <FolderKanban className="mt-0.5 h-4 w-4 shrink-0 text-[#6B6B66] group-hover:text-[#315D8A]" />
          <div className="min-w-0">
            <div className="truncate text-[15px] text-[#161616] group-hover:text-[#315D8A]">
              {project.title}
            </div>
            {project.description ? (
              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#6B6B66]">
                {project.description}
              </p>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#6B6B66]">
        <span className="inline-flex items-center gap-1">
          <MessagesSquare className="h-3 w-3" />
          {project.conversation_count} conversation{project.conversation_count === 1 ? "" : "s"}
        </span>
        {confidencePct != null ? (
          <span>cluster confidence {confidencePct}%</span>
        ) : null}
        {project.raw_data_scuttled ? <span>raw data archived</span> : null}
      </div>

      {isSuggested && confidencePct != null ? (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#EAE3CF]">
          <div className="h-full bg-[#315D8A]" style={{ width: `${confidencePct}%` }} />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/app/projects/${project.id}`}>
          <Button variant="outline" size="sm">
            Open
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Button>
        </Link>
        {isSuggested ? (
          <Button variant="ghost" size="sm" onClick={onConfirm} disabled={confirmPending}>
            {confirmPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-2 h-3.5 w-3.5" />}
            Confirm
          </Button>
        ) : null}
        {isConfirmed && project.conversation_count > 0 ? (
          <Link to={`/app/projects/${project.id}`}>
            <Button variant="ghost" size="sm">
              <PlayCircle className="mr-2 h-3.5 w-3.5" />
              Run
            </Button>
          </Link>
        ) : null}
        {!isScuttled ? (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-[#8B2F2F] hover:bg-[#F3D1D1]/40 hover:text-[#8B2F2F]"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
