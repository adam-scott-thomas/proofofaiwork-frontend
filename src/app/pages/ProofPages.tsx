import { Copy, Globe, Share2, ExternalLink, CheckCircle2, Sparkles, Plus } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Link } from "react-router";
import { useState } from "react";
import { ShareDialog } from "../components/ShareDialog";
import { useProofPages, usePublishProofPage, useAssessments, useCreateProofPage } from "../../hooks/useApi";
import { toast } from "sonner";

function isCompletedStatus(status: string | undefined) {
  return status === "complete" || status === "completed";
}

function isPublished(page: any) {
  return page?.status === "published";
}

function publicPath(page: any) {
  const id = page?.slug ?? page?.public_token;
  return id ? `/p/${id}` : null;
}

function publicUrl(page: any) {
  const path = publicPath(page);
  return path ? `https://proofofaiwork.com${path}` : null;
}

function pageTitle(page: any) {
  return page?.headline ?? page?.project_title ?? page?.id;
}

export default function ProofPages() {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<any>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: pagesData, isLoading } = useProofPages();
  const { data: assessmentsData } = useAssessments();
  const publishMutation = usePublishProofPage();
  const createProofPage = useCreateProofPage();

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center text-[13px] text-[#717182]">Loading...</div>
  );

  const proofPages: any[] = Array.isArray(pagesData) ? pagesData : pagesData?.data ?? pagesData?.items ?? [];

  const handleShare = (page: any) => {
    const url = publicUrl(page);
    if (!url) {
      toast.error("Publish this page before sharing");
      return;
    }
    setSelectedProof({
      name: "",
      handle: "",
      hlsScore: page.hls ?? 0,
      aelScore: 0,
      caiScore: page.cai ?? 0,
      proofUrl: url,
      projectName: pageTitle(page) ?? "",
      conversationCount: 0,
      date: page.created_at ? new Date(page.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "",
    });
    setShareDialogOpen(true);
  };

  const publishedPages = proofPages.filter(isPublished);
  const draftPages = proofPages.filter((p: any) => !isPublished(p));
  const totalViews = proofPages.reduce((sum: number, p: any) => sum + (p.view_count ?? 0), 0);

  const allAssessments: any[] = Array.isArray(assessmentsData)
    ? assessmentsData
    : assessmentsData?.data ?? assessmentsData?.items ?? [];
  const pagedAssessmentIds = new Set(proofPages.map((p: any) => p.assessment_id).filter(Boolean));
  const unpagedAssessments = allAssessments.filter(
    (a: any) => isCompletedStatus(a.status) && !pagedAssessmentIds.has(a.id)
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h1 className="text-xl tracking-tight">Proof Pages</h1>
              <p className="mt-1 text-[13px] text-[#717182]">
                Shareable evidence pages based on AI-organized work streams.
                <Link to="/explore" className="ml-1 inline-flex items-center gap-1 text-[#030213] underline-offset-2 hover:underline">
                  Browse public profiles in Explore
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </p>
            </div>
            <Button onClick={() => {
              if (unpagedAssessments.length === 0) {
                toast.info("No completed assessments available. Run an assessment first.");
              } else {
                setCreateDialogOpen(true);
              }
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Proof Page
            </Button>
          </div>
        </div>
      </header>

      <div className="p-8">
        {proofPages.length === 0 ? (
              <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-8 text-center shadow-sm">
                <p className="text-[13px] text-[#717182]">No proof pages yet. Create one from an assessed project.</p>
              </Card>
        ) : (
          <>
                {/* Stats */}
                <div className="mb-6 grid grid-cols-3 gap-4">
                  <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-sm">
                    <div className="text-[13px] text-[#717182]">Total Pages</div>
                    <div className="mt-1 text-2xl tracking-tight">{proofPages.length}</div>
                  </Card>
                  <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-sm">
                    <div className="text-[13px] text-[#717182]">Published</div>
                    <div className="mt-1 text-2xl tracking-tight">{publishedPages.length}</div>
                  </Card>
                  <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-sm">
                    <div className="text-[13px] text-[#717182]">Total Views</div>
                    <div className="mt-1 text-2xl tracking-tight">{totalViews}</div>
                  </Card>
                </div>

                {/* Published Pages */}
                {publishedPages.length > 0 && (
                  <div className="mb-8">
                    <Card className="border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
                      <div className="border-b border-[rgba(0,0,0,0.06)] px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-[#717182]" />
                            <h3 className="text-[15px]">Published Proof Pages</h3>
                          </div>
                          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                            {publishedPages.length} live
                          </Badge>
                        </div>
                      </div>
                      <div className="divide-y divide-[rgba(0,0,0,0.04)]">
                        {publishedPages.map((page: any) => {
                          const path = publicPath(page);
                          const url = publicUrl(page);
                          const displayPath = page.slug ?? page.public_token;
                          return (
                          <div key={page.id} className="px-6 py-5 hover:bg-[#FAFAFA] transition-colors">
                            <div className="flex items-start justify-between gap-6">
                              <div className="flex-1">
                                <div className="mb-2 flex items-center gap-3">
                                  {path ? (
                                    <Link to={path} className="text-[14px] hover:underline">
                                      {pageTitle(page)}
                                    </Link>
                                  ) : (
                                    <span className="text-[14px]">{pageTitle(page)}</span>
                                  )}
                                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    Published
                                  </Badge>
                                  <Badge variant="outline" className="border-[rgba(0,0,0,0.08)] bg-white text-[11px] font-normal" style={{ color: 'var(--score-execution)' }}>
                                    <Sparkles className="mr-1 h-2.5 w-2.5" />
                                    AI-organized work
                                  </Badge>
                                </div>
                                {displayPath && (
                                  <div className="mb-3 flex items-center gap-2">
                                    <span className="font-mono text-[12px] text-[#717182]">
                                      proofofaiwork.com/p/{displayPath}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0"
                                      onClick={() => {
                                        if (url) {
                                          navigator.clipboard.writeText(url);
                                          toast.success("URL copied to clipboard");
                                        }
                                      }}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                                <div className="flex items-center gap-6">
                                  {page.cai != null && (
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="text-[11px] uppercase tracking-wider text-[#717182]">CAI</span>
                                      <span className="font-mono text-[15px]" style={{ color: 'var(--score-cai)' }}>
                                        {page.cai}
                                      </span>
                                    </div>
                                  )}
                                  {page.hls != null && (
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="text-[11px] uppercase tracking-wider text-[#717182]">HLS</span>
                                      <span className="font-mono text-[15px]" style={{ color: 'var(--score-hls)' }}>
                                        {page.hls}
                                      </span>
                                    </div>
                                  )}
                                  {page.view_count != null && <span className="text-[13px] text-[#717182]">{page.view_count} views</span>}
                                  {page.published_at && (
                                    <span className="text-[13px] text-[#717182] font-mono">
                                      Published {new Date(page.published_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {path && (
                                  <a href={path} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm">
                                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                      Preview
                                    </Button>
                                  </a>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => handleShare(page)}>
                                  <Share2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (url) {
                                      navigator.clipboard.writeText(url);
                                      toast.success("URL copied to clipboard");
                                    }
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Draft Pages */}
                {draftPages.length > 0 && (
                  <Card className="border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
                    <div className="border-b border-[rgba(0,0,0,0.06)] px-6 py-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[15px]">Drafts</h3>
                        <span className="text-[13px] text-[#717182]">{draftPages.length} unpublished</span>
                      </div>
                    </div>
                    <div className="divide-y divide-[rgba(0,0,0,0.04)]">
                      {draftPages.map((page: any) => (
                        <div key={page.id} className="px-6 py-5 hover:bg-[#FAFAFA] transition-colors">
                          <div className="flex items-start justify-between gap-6">
                            <div className="flex-1">
                              <div className="mb-2 flex items-center gap-3">
                                <span className="text-[14px]">{pageTitle(page)}</span>
                                <Badge variant="secondary" className="bg-[#F5F5F7] text-[#717182]">
                                  Draft
                                </Badge>
                              </div>
                              <div className="flex items-center gap-6">
                                {page.cai != null && (
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-[11px] uppercase tracking-wider text-[#717182]">CAI</span>
                                    <span className="font-mono text-[15px]" style={{ color: 'var(--score-cai)' }}>
                                      {page.cai}
                                    </span>
                                  </div>
                                )}
                                {page.hls != null && (
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-[11px] uppercase tracking-wider text-[#717182]">HLS</span>
                                    <span className="font-mono text-[15px]" style={{ color: 'var(--score-hls)' }}>
                                      {page.hls}
                                    </span>
                                  </div>
                                )}
                                {page.created_at && (
                                  <span className="text-[13px] text-[#717182] font-mono">
                                    Created {new Date(page.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toast.info("Publish first to preview the public page")}
                              >
                                Preview
                              </Button>
                              <Button
                                size="sm"
                                disabled={publishingId === page.id}
                                onClick={() => {
                                  setPublishingId(page.id);
                                  publishMutation.mutate(page.id, {
                                    onSuccess: () => {
                                      setPublishingId(null);
                                      toast.success("Proof page published!");
                                    },
                                    onError: (err: any) => {
                                      setPublishingId(null);
                                      toast.error(err?.message ?? "Failed to publish");
                                    },
                                  });
                                }}
                              >
                                <Globe className="mr-2 h-4 w-4" />
                                {publishingId === page.id ? "Publishing…" : "Publish"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
          </>
        )}
      </div>

      {selectedProof && (
        <ShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} data={selectedProof} />
      )}

      {/* Create Proof Page Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Proof Page</DialogTitle>
            <DialogDescription>
              Choose a completed assessment to create a public proof page from.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {unpagedAssessments.length === 0 ? (
              <p className="text-[13px] text-[#717182] py-4 text-center">
                No completed assessments available.
              </p>
            ) : (
              unpagedAssessments.map((a: any) => (
                <button
                  key={a.id}
                  className="w-full rounded-md border border-[rgba(0,0,0,0.08)] bg-white px-4 py-3 text-left text-[13px] hover:bg-[#F5F5F7] transition-colors"
                  onClick={() => {
                    createProofPage.mutate(
                      { assessment_id: a.id },
                      {
                        onSuccess: () => {
                          setCreateDialogOpen(false);
                          toast.success("Proof page created!");
                        },
                        onError: (err: any) => toast.error(err?.message ?? "Failed to create proof page"),
                      }
                    );
                  }}
                  disabled={createProofPage.isPending}
                >
                  <div className="font-medium">{a.name ?? a.id}</div>
                  {a.created_at && (
                    <div className="text-[12px] text-[#717182] mt-0.5">
                      {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
