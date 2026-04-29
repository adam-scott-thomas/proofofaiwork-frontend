import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Eye,
  ExternalLink,
  EyeOff,
  FileText,
  Globe,
  Link as LinkIcon,
  Loader2,
  Lock,
  Plus,
  Quote,
  Scissors,
  Settings2,
  Share2,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import {
  useAssessments,
  useCreateProofPage,
  useProofPages,
} from "../../hooks/useApi";
import { apiDelete, apiFetch, apiPatch, apiPost } from "../../lib/api";
import {
  asArray,
  assessmentTitle,
  isPublishedProofPage,
  proofPagePath,
  proofPageTitle,
  proofPageUrl,
} from "../lib/poaw";

type ProofPage = {
  id: string;
  public_token: string;
  slug: string | null;
  visibility: "private" | "link" | "public";
  status: "draft" | "published" | "disabled";
  version: number;
  headline: string | null;
  summary: string | null;
  custom_meta: Record<string, any>;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  assessment_id: string | null;
  project_id: string | null;
  project_title?: string | null;
};

type PageConfig = {
  display_name?: string;
  show_weaknesses?: boolean;
  show_skipped_dimensions?: boolean;
  contact_enabled?: boolean;
  visible_dimensions?: string[];
  visible_strengths?: string[];
};

const VISIBILITY_META: Record<ProofPage["visibility"], { icon: React.ComponentType<any>; label: string; description: string }> = {
  private: { icon: Lock, label: "Private", description: "Owner only, not accessible via public URL." },
  link: { icon: LinkIcon, label: "Link", description: "Anyone with the URL can view. Not indexed, not listed." },
  public: { icon: Globe, label: "Public", description: "Discoverable in the directory (post-MVP)." },
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-[#EAE3CF] text-[#6B6B66]",
  published: "bg-[#D3E9D9] text-[#1F6A3F]",
  disabled: "bg-[#F3D1D1] text-[#8B2F2F]",
};

type Warning = { severity: "low" | "medium" | "info"; text: string };

function publishWarnings(page: ProofPage): Warning[] {
  const warnings: Warning[] = [];
  if (!page.headline || page.headline.trim().length < 4) {
    warnings.push({ severity: "medium", text: "No headline. Viewers won't know what they're looking at." });
  }
  if (!page.summary || page.summary.trim().length < 10) {
    warnings.push({ severity: "medium", text: "No summary. Add a one-sentence framing." });
  }
  if (page.visibility !== "public") {
    warnings.push({ severity: "info", text: "Publishing will switch this page to public visibility and list it in discovery." });
  }
  if (!page.assessment_id) {
    warnings.push({ severity: "medium", text: "No assessment linked. Results pages can't render trust metadata." });
  }
  return warnings;
}

export default function ProofPages() {
  const { data: pagesData, isLoading, refetch } = useProofPages() as any;
  const { data: assessmentsData } = useAssessments();
  const createProofPage = useCreateProofPage();
  const queryClient = useQueryClient();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ProofPage | null>(null);
  const [deleting, setDeleting] = useState<ProofPage | null>(null);
  const [curating, setCurating] = useState<ProofPage | null>(null);

  const pages: ProofPage[] = asArray<ProofPage>(pagesData);
  const assessments = asArray<any>(assessmentsData);
  const pagedAssessmentIds = new Set(pages.map((page) => page.assessment_id).filter(Boolean));
  const availableAssessments = assessments.filter(
    (assessment) => (assessment.status === "complete" || assessment.status === "partial") && !pagedAssessmentIds.has(assessment.id),
  );

  const unpublish = useMutation({
    mutationFn: (pageId: string) => apiPost(`/proof-pages/${pageId}/unpublish`, {}),
    onSuccess: () => {
      toast.success("Proof page unpublished");
      queryClient.invalidateQueries({ queryKey: ["proof-pages"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Unpublish failed"),
  });

  const removePage = useMutation({
    mutationFn: (pageId: string) => apiDelete(`/proof-pages/${pageId}`),
    onSuccess: () => {
      toast.success("Proof page deleted");
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["proof-pages"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Delete failed"),
  });

  const directoryToggle = useMutation({
    mutationFn: ({ pageId, optIn }: { pageId: string; optIn: boolean }) =>
      apiPost(`/directory/${pageId}/${optIn ? "opt-in" : "opt-out"}`, {}),
    onSuccess: (_data, vars) => {
      toast.success(vars.optIn ? "Listed in directory" : "Removed from directory");
      queryClient.invalidateQueries({ queryKey: ["proof-pages"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Directory update failed"),
  });

  const publishPage = async (page: ProofPage) => {
    if (page.visibility !== "public") {
      await apiPatch(`/proof-pages/${page.id}`, {
        visibility: "public",
      });
    }
    await apiPost(`/proof-pages/${page.id}/publish`, {});
    await apiPost(`/directory/${page.id}/opt-in`, {});
  };

  const publishProofPage = useMutation({
    mutationFn: publishPage,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading proof pages...
      </div>
    );
  }

  const published = pages.filter(isPublishedProofPage);
  const drafts = pages.filter((page) => page.status === "draft");

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-7">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Proof pages</div>
              <h1 className="mt-2 text-3xl tracking-tight">Curate what's visible.</h1>
              <p className="mt-2 text-[14px] leading-relaxed text-[#5C5C5C]">
                Turn a completed assessment into a public artifact. You choose the headline, summary,
                which dimensions are visible, and whether viewers can contact you. Uploads never leave private.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setCreating(true)} disabled={availableAssessments.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                New proof page
              </Button>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-[12px]">
            <SummaryTile label="Total" value={pages.length} />
            <SummaryTile label="Published" value={published.length} />
            <SummaryTile label="Drafts" value={drafts.length} />
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-5xl">
          {pages.length === 0 ? (
            <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-10 text-center text-[14px] text-[#5C5C5C]">
              <FileText className="mx-auto mb-3 h-6 w-6 text-[#6B6B66]" />
              <div className="text-[#161616]">No proof pages yet.</div>
              <div className="mt-1">Complete an assessment first, then turn it into a page here.</div>
            </Card>
          ) : (
            <div className="space-y-3">
              {pages.map((page) => (
                <PageRow
                  key={page.id}
                  page={page}
                  onEdit={() => setEditing(page)}
                  onCurate={() => setCurating(page)}
                  onDelete={() => setDeleting(page)}
                  onPublish={() => {
                    publishProofPage.mutate(page, {
                      onSuccess: () => {
                        toast.success("Proof page published and listed in discovery");
                        queryClient.invalidateQueries({ queryKey: ["proof-pages"] });
                        queryClient.invalidateQueries({ queryKey: ["directory-status"] });
                      },
                      onError: (error: any) => toast.error(error?.message ?? "Publish failed"),
                    });
                  }}
                  onUnpublish={() => unpublish.mutate(page.id)}
                  onDirectory={(optIn) => directoryToggle.mutate({ pageId: page.id, optIn })}
                  publishPending={publishProofPage.isPending}
                  unpublishPending={unpublish.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New proof page</DialogTitle>
            <DialogDescription>
              Pick a completed or partial assessment. You can edit headline, summary, and visibility next.
            </DialogDescription>
          </DialogHeader>
          {availableAssessments.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-5 text-center text-[13px] text-[#6B6B66]">
              No assessments are available. Every assessment already has a proof page or is still running.
            </div>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {availableAssessments.map((assessment) => (
                <button
                  key={assessment.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-md border border-[#D8D2C4] bg-[#FBF8F1] px-3 py-3 text-left transition-colors hover:border-[#A88F5F] hover:bg-white"
                  onClick={() => {
                    createProofPage.mutate(
                      { assessment_id: assessment.id },
                      {
                        onSuccess: (newPage: any) => {
                          toast.success("Proof page created");
                          setCreating(false);
                          queryClient.invalidateQueries({ queryKey: ["proof-pages"] });
                          if (newPage) setEditing(newPage as ProofPage);
                        },
                        onError: (error: any) => toast.error(error?.message ?? "Create failed"),
                      },
                    );
                  }}
                  disabled={createProofPage.isPending}
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13px]">{assessmentTitle(assessment)}</div>
                    <div className="mt-0.5 text-[11px] text-[#6B6B66]">status {assessment.status}</div>
                  </div>
                  {createProofPage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 text-[#6B6B66]" />}
                </button>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditDialog page={editing} onClose={() => setEditing(null)} onSaved={() => queryClient.invalidateQueries({ queryKey: ["proof-pages"] })} />

      <ExcerptApprovalDialog page={curating} onClose={() => setCurating(null)} />

      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this proof page?</DialogTitle>
            <DialogDescription>
              The public URL will 404 immediately. The underlying assessment and uploads are unaffected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              className="bg-[#8B2F2F] hover:bg-[#7A2525]"
              disabled={removePage.isPending}
              onClick={() => deleting && removePage.mutate(deleting.id)}
            >
              {removePage.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[#D8D2C4] bg-white px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">{label}</div>
      <div className="mt-0.5 text-xl tracking-tight">{value}</div>
    </div>
  );
}

function ogImageUrl(slugOrToken: string, version?: number, updatedAt?: string | null) {
  const apiHost = import.meta.env.VITE_API_URL || "";
  const stamp = updatedAt ? Date.parse(updatedAt) || updatedAt : version || "1";
  return `${apiHost.replace(/\/$/, "")}/api/v1/p/${slugOrToken}/og.png?v=${encodeURIComponent(String(stamp))}`;
}

function PageRow({
  page,
  onEdit,
  onCurate,
  onDelete,
  onPublish,
  onUnpublish,
  onDirectory,
  publishPending,
  unpublishPending,
}: {
  page: ProofPage;
  onEdit: () => void;
  onCurate: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDirectory: (optIn: boolean) => void;
  publishPending: boolean;
  unpublishPending: boolean;
}) {
  const VisibilityIcon = VISIBILITY_META[page.visibility].icon;
  const published = isPublishedProofPage(page);
  const path = proofPagePath(page);
  const url = proofPageUrl(page);
  const warnings = publishWarnings(page);
  const config: PageConfig = (page.custom_meta || {}) as PageConfig;
  const copyUrl = () => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied"),
      () => toast.error("Copy failed"),
    );
  };

  return (
    <Card className="border border-[#D8D2C4] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {published ? (
          <a
            href={path || "#"}
            target="_blank"
            rel="noreferrer"
            title="Open public page"
            className="relative block h-20 w-36 shrink-0 overflow-hidden rounded-md border border-[#D8D2C4] bg-[#FBF8F1]"
          >
            <img
              src={ogImageUrl(page.slug || page.public_token, page.version, page.updated_at)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
              onError={(event) => {
                const target = event.currentTarget as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </a>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase ${STATUS_STYLE[page.status] || "bg-[#EAE3CF] text-[#6B6B66]"}`}>
              {page.status}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#D8D2C4] px-2 py-0.5 text-[11px] text-[#6B6B66]">
              <VisibilityIcon className="h-3 w-3" />
              {VISIBILITY_META[page.visibility].label}
            </span>
            <span className="text-[11px] text-[#6B6B66]">v{page.version}</span>
          </div>

          <div className="mt-2 text-[16px] tracking-tight">{proofPageTitle(page)}</div>
          {page.summary ? (
            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#5C5C5C]">{page.summary}</p>
          ) : (
            <p className="mt-1 text-[13px] text-[#A88F5F]">No public summary yet.</p>
          )}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#6B6B66]">
            <span>{page.view_count} views</span>
            {page.assessment_id ? <span>assessment {page.assessment_id.slice(0, 8)}…</span> : null}
            {page.project_title ? <span>project {page.project_title}</span> : null}
            {page.published_at ? <span>published {formatDate(page.published_at)}</span> : null}
          </div>

          {url && (page.visibility === "link" || page.visibility === "public") ? (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-[#EAE3CF] bg-[#FBF8F1] px-3 py-2 text-[12px] text-[#5C5C5C]">
              <LinkIcon className="h-3.5 w-3.5 text-[#6B6B66]" />
              <span className="truncate">{url}</span>
              <button type="button" onClick={copyUrl} className="ml-auto inline-flex items-center gap-1 text-[#315D8A] hover:underline">
                <Copy className="h-3 w-3" />
                Copy
              </button>
            </div>
          ) : null}

          {!published && warnings.length > 0 ? (
            <div className="mt-3 space-y-1">
              {warnings.map((warning, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 rounded-md px-2.5 py-1.5 text-[11px] leading-relaxed ${
                    warning.severity === "medium"
                      ? "bg-[#FDF4DC] text-[#8A5F10]"
                      : warning.severity === "low"
                      ? "bg-[#EAE3CF] text-[#6B6B66]"
                      : "bg-[#DCE4F0] text-[#315D8A]"
                  }`}
                >
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{warning.text}</span>
                </div>
              ))}
            </div>
          ) : null}

          {(config.show_weaknesses ||
            config.show_skipped_dimensions ||
            config.contact_enabled !== false ||
            (config.visible_dimensions && config.visible_dimensions.length > 0)) ? (
            <div className="mt-3 flex flex-wrap gap-1">
              {config.show_weaknesses ? <ConfigChip>Weaknesses shown</ConfigChip> : null}
              {config.show_skipped_dimensions ? <ConfigChip>Skipped shown</ConfigChip> : null}
              {config.contact_enabled === false ? <ConfigChip tone="muted">Contact off</ConfigChip> : null}
              {(config.visible_dimensions?.length ?? 0) > 0 ? (
                <ConfigChip>{config.visible_dimensions!.length} dims visible</ConfigChip>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Settings2 className="mr-2 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onCurate}>
            <Scissors className="mr-2 h-3.5 w-3.5" />
            Approve excerpts
          </Button>
          {!published ? (
            <Button size="sm" onClick={onPublish} disabled={publishPending || !page.assessment_id}>
              {publishPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Globe className="mr-2 h-3.5 w-3.5" />}
              Publish
            </Button>
          ) : (
            <>
              {path ? (
                <a href={path} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    Open
                  </Button>
                </a>
              ) : null}
              <Button variant="outline" size="sm" onClick={onUnpublish} disabled={unpublishPending}>
                {unpublishPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <EyeOff className="mr-2 h-3.5 w-3.5" />}
                Unpublish
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDirectory(true)}>
                <Users className="mr-2 h-3.5 w-3.5" />
                List publicly
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDirectory(false)}>
                <EyeOff className="mr-2 h-3.5 w-3.5" />
                Unlist
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" className="text-[#8B2F2F] hover:bg-[#F3D1D1]/40 hover:text-[#8B2F2F]" onClick={onDelete}>
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ConfigChip({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "muted" }) {
  const style = tone === "muted" ? "bg-[#EAE3CF] text-[#6B6B66]" : "bg-[#DCE4F0] text-[#315D8A]";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase ${style}`}>
      {children}
    </span>
  );
}

function EditDialog({
  page,
  onClose,
  onSaved,
}: {
  page: ProofPage | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = !!page;
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [visibility, setVisibility] = useState<ProofPage["visibility"]>("private");
  const [displayName, setDisplayName] = useState("");
  const [showWeaknesses, setShowWeaknesses] = useState(false);
  const [showSkipped, setShowSkipped] = useState(false);
  const [contactEnabled, setContactEnabled] = useState(true);
  const [visibleDimensions, setVisibleDimensions] = useState<string>("");

  // Seed state from page when it opens
  useMemo(() => {
    if (!page) return;
    const config = (page.custom_meta || {}) as PageConfig;
    setHeadline(page.headline ?? "");
    setSummary(page.summary ?? "");
    setVisibility(page.visibility);
    setDisplayName(config.display_name ?? "");
    setShowWeaknesses(!!config.show_weaknesses);
    setShowSkipped(!!config.show_skipped_dimensions);
    setContactEnabled(config.contact_enabled !== false);
    setVisibleDimensions((config.visible_dimensions ?? []).join(", "));
  }, [page?.id]);

  const save = useMutation({
    mutationFn: async () => {
      if (!page) return;
      const custom_meta: PageConfig = {
        ...(page.custom_meta || {}),
        display_name: displayName.trim() || undefined,
        show_weaknesses: showWeaknesses,
        show_skipped_dimensions: showSkipped,
        contact_enabled: contactEnabled,
        visible_dimensions: visibleDimensions
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      return apiPatch<ProofPage>(`/proof-pages/${page.id}`, {
        headline: headline.trim() || null,
        summary: summary.trim() || null,
        visibility,
        custom_meta,
      });
    },
    onSuccess: () => {
      toast.success("Proof page saved");
      onSaved();
      onClose();
    },
    onError: (error: any) => toast.error(error?.message ?? "Save failed"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit proof page</DialogTitle>
          <DialogDescription>
            Everything here is viewer-facing. Nothing uploads or raw transcripts appear publicly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">Display name</Label>
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="What viewers see above the headline."
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">Headline</Label>
            <Input
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              placeholder="One line. What is this proof about?"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">Summary</Label>
            <Textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="A short framing paragraph. This appears above the observations."
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">Visibility</Label>
            <div className="mt-2 grid gap-2">
              {(Object.keys(VISIBILITY_META) as Array<ProofPage["visibility"]>).map((key) => {
                const meta = VISIBILITY_META[key];
                const Icon = meta.icon;
                const active = visibility === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setVisibility(key)}
                    className={`flex items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
                      active
                        ? "border-[#315D8A] bg-[#EEF2F9]"
                        : "border-[#D8D2C4] bg-white hover:border-[#A88F5F]"
                    }`}
                  >
                    <Icon className={`mt-0.5 h-4 w-4 ${active ? "text-[#315D8A]" : "text-[#6B6B66]"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] text-[#161616]">{meta.label}</div>
                      <div className="text-[11px] text-[#6B6B66]">{meta.description}</div>
                    </div>
                    {active ? <Check className="h-4 w-4 text-[#315D8A]" /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 rounded-md border border-[#D8D2C4] bg-[#FBF8F1] p-3">
            <div className="text-[11px] uppercase tracking-[0.1em] text-[#6B6B66]">Viewer controls</div>
            <ToggleRow label="Show weaknesses" help="Opt-in. Off by default per spec." checked={showWeaknesses} onChange={setShowWeaknesses} />
            <ToggleRow label="Show skipped dimensions" help="Transparency about what the quality gate skipped." checked={showSkipped} onChange={setShowSkipped} />
            <ToggleRow label="Viewer can request contact" help="Adds a contact button. No email is exposed." checked={contactEnabled} onChange={setContactEnabled} />
          </div>

          <div>
            <Label className="text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">Visible dimensions</Label>
            <Input
              value={visibleDimensions}
              onChange={(event) => setVisibleDimensions(event.target.value)}
              placeholder="clarity, iteration_discipline, output_judgment"
              className="mt-1"
            />
            <div className="mt-1 text-[11px] text-[#6B6B66]">
              Comma-separated dimension ids. Leave empty to show every evaluated dimension.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({ label, help, checked, onChange }: { label: string; help?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <div>
        <div className="text-[13px] text-[#161616]">{label}</div>
        {help ? <div className="text-[11px] text-[#6B6B66]">{help}</div> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type ExcerptDetail = {
  id: string;
  evidence_note_id: string;
  observation_dimension: string | null;
  claim: string | null;
  excerpt_text: string;
  redacted_text: string | null;
  annotation: string | null;
  is_visible: boolean;
  display_order: number;
  file_index: number | null;
  source_file: string | null;
};

type ExcerptDraft = {
  is_visible: boolean;
  redacted_text: string;
  annotation: string;
  display_order: number;
};

function ExcerptApprovalDialog({ page, onClose }: { page: ProofPage | null; onClose: () => void }) {
  const open = !!page;
  const [drafts, setDrafts] = useState<Record<string, ExcerptDraft>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  const query = useQuery<ExcerptDetail[]>({
    queryKey: ["proof-excerpts", page?.id],
    queryFn: () => apiFetch<ExcerptDetail[]>(`/proof-pages/${page!.id}/excerpts`),
    enabled: open && !!page,
  });

  useEffect(() => {
    if (!query.data) return;
    const next: Record<string, ExcerptDraft> = {};
    for (const excerpt of query.data) {
      next[excerpt.id] = {
        is_visible: excerpt.is_visible,
        redacted_text: excerpt.redacted_text ?? "",
        annotation: excerpt.annotation ?? "",
        display_order: excerpt.display_order,
      };
    }
    setDrafts(next);
    setDirty(new Set());
  }, [query.data]);

  const save = useMutation({
    mutationFn: () => {
      if (!page) return Promise.reject(new Error("No page"));
      const updates = Array.from(dirty)
        .map((id) => {
          const draft = drafts[id];
          if (!draft) return null;
          return {
            id,
            is_visible: draft.is_visible,
            redacted_text: draft.redacted_text,
            annotation: draft.annotation,
            display_order: draft.display_order,
          };
        })
        .filter(Boolean);
      return apiPatch<ExcerptDetail[]>(`/proof-pages/${page.id}/excerpts`, { updates });
    },
    onSuccess: () => {
      toast.success("Excerpts saved");
      setDirty(new Set());
      query.refetch();
    },
    onError: (error: any) => toast.error(error?.message ?? "Save failed"),
  });

  const patchDraft = (id: string, patch: Partial<ExcerptDraft>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    setDirty((prev) => new Set(prev).add(id));
  };

  const swapOrder = (idA: string, idB: string) => {
    const draftA = drafts[idA];
    const draftB = drafts[idB];
    if (!draftA || !draftB) return;
    setDrafts((prev) => ({
      ...prev,
      [idA]: { ...draftA, display_order: draftB.display_order },
      [idB]: { ...draftB, display_order: draftA.display_order },
    }));
    setDirty((prev) => new Set(prev).add(idA).add(idB));
  };

  const excerpts = query.data ?? [];
  const grouped = useMemo(() => {
    const groups = new Map<string, ExcerptDetail[]>();
    for (const excerpt of excerpts) {
      const key = excerpt.source_file || (excerpt.file_index != null ? `file ${excerpt.file_index}` : "Unsourced");
      const list = groups.get(key) ?? [];
      list.push(excerpt);
      groups.set(key, list);
    }
    // Sort each group by current draft.display_order so reordered items move live
    for (const list of groups.values()) {
      list.sort((a, b) => {
        const orderA = drafts[a.id]?.display_order ?? a.display_order;
        const orderB = drafts[b.id]?.display_order ?? b.display_order;
        return orderA - orderB;
      });
    }
    return Array.from(groups.entries());
  }, [excerpts, drafts]);

  const visibleCount = excerpts.filter((excerpt) => drafts[excerpt.id]?.is_visible).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Approve excerpts</DialogTitle>
          <DialogDescription>
            Grouped by source file. Each excerpt is hidden by default — check "Show publicly" to include it.
            Redacted text replaces the original on the public page (must be ≤ original length).
          </DialogDescription>
        </DialogHeader>

        {query.isLoading ? (
          <div className="flex items-center gap-2 p-4 text-[13px] text-[#6B6B66]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading excerpts...
          </div>
        ) : excerpts.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-6 text-center text-[13px] text-[#5C5C5C]">
            No excerpts yet. They're generated during assessment as evidence notes. If an assessment completed
            with zero evidence notes, there's nothing to approve.
          </div>
        ) : (
          <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-2">
            {grouped.map(([source, group]) => (
              <div key={source}>
                <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">
                  <FileText className="h-3 w-3" />
                  {source}
                  <span className="rounded-full bg-[#F3EEE2] px-1.5 py-0.5 text-[10px] text-[#6B6B66]">
                    {group.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.map((excerpt, index) => {
                    const draft = drafts[excerpt.id] ?? {
                      is_visible: excerpt.is_visible,
                      redacted_text: excerpt.redacted_text ?? "",
                      annotation: excerpt.annotation ?? "",
                      display_order: excerpt.display_order,
                    };
                    const isDirty = dirty.has(excerpt.id);
                    const tooLong = draft.redacted_text.length > excerpt.excerpt_text.length;
                    const canMoveUp = index > 0;
                    const canMoveDown = index < group.length - 1;
                    return (
                      <Card
                        key={excerpt.id}
                        className={`border p-3 ${draft.is_visible ? "border-[#A88F5F] bg-white" : "border-[#D8D2C4] bg-[#FBF8F1]"}`}
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              className="rounded p-0.5 text-[#6B6B66] hover:bg-[#EAE3CF] disabled:opacity-30"
                              disabled={!canMoveUp}
                              onClick={() => swapOrder(excerpt.id, group[index - 1].id)}
                              title="Move up"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              className="rounded p-0.5 text-[#6B6B66] hover:bg-[#EAE3CF] disabled:opacity-30"
                              disabled={!canMoveDown}
                              onClick={() => swapOrder(excerpt.id, group[index + 1].id)}
                              title="Move down"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-[10px] tracking-[0.08em] text-[#6B6B66]">
                            #{draft.display_order}
                          </span>
                          {excerpt.observation_dimension ? (
                            <span className="rounded-full bg-[#DCE4F0] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#315D8A]">
                              {excerpt.observation_dimension}
                            </span>
                          ) : null}
                          {excerpt.claim ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#6B6B66]">
                              <Quote className="h-3 w-3" />
                              {excerpt.claim}
                            </span>
                          ) : null}
                          <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-[11px] text-[#161616]">
                            <input
                              type="checkbox"
                              checked={draft.is_visible}
                              onChange={(event) => patchDraft(excerpt.id, { is_visible: event.target.checked })}
                            />
                            <span className="inline-flex items-center gap-1">
                              {draft.is_visible ? <Eye className="h-3 w-3 text-[#1F6A3F]" /> : <EyeOff className="h-3 w-3 text-[#6B6B66]" />}
                              {draft.is_visible ? "Show publicly" : "Hidden"}
                            </span>
                          </label>
                        </div>
                        <blockquote className="whitespace-pre-wrap rounded-md border border-[#EAE3CF] bg-[#FBF8F1] p-2 text-[12px] leading-relaxed text-[#2A2A28]">
                          {excerpt.excerpt_text}
                        </blockquote>
                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                          <div>
                            <label className="text-[10px] uppercase tracking-[0.1em] text-[#6B6B66]">
                              Redacted replacement (optional)
                            </label>
                            <Textarea
                              value={draft.redacted_text}
                              onChange={(event) => patchDraft(excerpt.id, { redacted_text: event.target.value })}
                              rows={3}
                              placeholder="Strip sensitive detail. Leave blank to show the original."
                              className={`mt-1 text-[12px] ${tooLong ? "border-[#8B2F2F]" : ""}`}
                            />
                            <div className={`mt-1 text-[10px] ${tooLong ? "text-[#8B2F2F]" : "text-[#6B6B66]"}`}>
                              {draft.redacted_text.length} / {excerpt.excerpt_text.length} chars
                              {tooLong ? " · too long — redacted text must be ≤ original" : null}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-[0.1em] text-[#6B6B66]">Annotation</label>
                            <Textarea
                              value={draft.annotation}
                              onChange={(event) => patchDraft(excerpt.id, { annotation: event.target.value })}
                              rows={3}
                              placeholder="Optional context you want viewers to see with this excerpt."
                              className="mt-1 text-[12px]"
                            />
                          </div>
                        </div>
                        {isDirty ? (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#A8741A]">
                            <AlertTriangle className="h-3 w-3" />
                            Unsaved
                          </div>
                        ) : null}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <div className="mr-auto text-[11px] text-[#6B6B66]">
            {visibleCount} of {excerpts.length} visible ·{" "}
            {dirty.size > 0 ? `${dirty.size} unsaved` : "saved"}
          </div>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button disabled={save.isPending || dirty.size === 0} onClick={() => save.mutate()}>
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Save {dirty.size > 0 ? `(${dirty.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
