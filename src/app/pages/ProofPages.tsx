import { ExternalLink, Globe, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAssessments, useCreateProofPage, useProofPages, usePublishProofPage } from "../../hooks/useApi";
import { apiPatch, apiPost } from "../../lib/api";
import { asArray, assessmentTitle, isPublishedProofPage, proofPagePath, proofPageTitle, proofPageUrl } from "../lib/poaw";

export default function ProofPages() {
  const { data: pagesData, isLoading, refetch } = useProofPages() as any;
  const { data: assessmentsData } = useAssessments();
  const createProofPage = useCreateProofPage();
  const publishProofPage = usePublishProofPage();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");

  const pages = asArray<any>(pagesData);
  const assessments = asArray<any>(assessmentsData);
  const pagedAssessmentIds = new Set(pages.map((page) => page.assessment_id).filter(Boolean));
  const availableAssessments = assessments.filter(
    (assessment) => (assessment.status === "complete" || assessment.status === "partial") && !pagedAssessmentIds.has(assessment.id),
  );

  const saveEdit = async (pageId: string) => {
    try {
      await apiPatch(`/proof-pages/${pageId}`, { headline, summary });
      setEditingId(null);
      setHeadline("");
      setSummary("");
      toast.success("Proof page updated");
      refetch?.();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to update proof page");
    }
  };

  const optIntoDirectory = async (pageId: string) => {
    try {
      await apiPost(`/directory/${pageId}/opt-in`, {});
      toast.success("Proof page opted into the directory");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to opt into directory");
    }
  };

  const optOutOfDirectory = async (pageId: string) => {
    try {
      await apiPost(`/directory/${pageId}/opt-out`, {});
      toast.success("Proof page removed from the directory");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to opt out of directory");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        Loading proof pages...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Proof pages</div>
              <h1 className="mt-2 text-3xl tracking-tight">Draft, publish, and list public proof.</h1>
              <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-[#5C5C5C]">
                Create a proof page from a completed assessment, edit the public headline and summary, publish it,
                then opt it into the directory so other people can browse it.
              </p>
            </div>
            <Button onClick={() => setCreating((value) => !value)}>
              <Plus className="mr-2 h-4 w-4" />
              Create proof page
            </Button>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        {creating ? (
          <Card className="mb-6 border border-[#D8D2C4] bg-white p-6 shadow-sm">
            <div className="mb-4 text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Available assessments</div>
            {availableAssessments.length === 0 ? (
              <div className="text-[14px] text-[#5C5C5C]">No completed assessments are available.</div>
            ) : (
              <div className="space-y-3">
                {availableAssessments.map((assessment) => (
                  <div key={assessment.id} className="flex items-center justify-between rounded-lg border border-[#D8D2C4] bg-[#FBF8F1] px-4 py-4">
                    <div>
                      <div className="text-[14px]">{assessmentTitle(assessment)}</div>
                      <div className="mt-1 text-[12px] text-[#6B6B66]">status {assessment.status}</div>
                    </div>
                    <Button
                      onClick={() => {
                        createProofPage.mutate(
                          { assessment_id: assessment.id },
                          {
                            onSuccess: () => {
                              toast.success("Proof page created");
                              setCreating(false);
                              refetch?.();
                            },
                            onError: (error: any) => toast.error(error?.message ?? "Failed to create proof page"),
                          },
                        );
                      }}
                      disabled={createProofPage.isPending}
                    >
                      {createProofPage.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Create
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : null}

        <div className="space-y-4">
          {pages.map((page) => {
            const path = proofPagePath(page);
            const url = proofPageUrl(page);
            const published = isPublishedProofPage(page);
            const isEditing = editingId === page.id;

            return (
              <Card key={page.id} className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          value={headline}
                          onChange={(event) => setHeadline(event.target.value)}
                          placeholder="Public headline"
                          className="w-full rounded-md border border-[#D8D2C4] px-3 py-2 text-sm outline-none"
                        />
                        <textarea
                          value={summary}
                          onChange={(event) => setSummary(event.target.value)}
                          placeholder="Public summary"
                          className="min-h-24 w-full rounded-md border border-[#D8D2C4] px-3 py-2 text-sm outline-none"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="text-[18px] tracking-tight">{proofPageTitle(page)}</div>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${
                            published ? "bg-[#E7F2E9] text-[#2F6B3B]" : "bg-[#F3EEE2] text-[#A8741A]"
                          }`}>
                            {page.status}
                          </span>
                        </div>
                        <div className="mt-2 text-[14px] leading-7 text-[#5C5C5C]">
                          {page.summary || "No summary yet."}
                        </div>
                      </>
                    )}
                    <div className="mt-3 text-[12px] text-[#6B6B66]">
                      assessment {String(page.assessment_id ?? "").slice(0, 8)} • views {page.view_count ?? 0}
                      {page.project_title ? ` • ${page.project_title}` : ""}
                    </div>
                    {url ? (
                      <div className="mt-2 text-[12px] text-[#315D8A]">{url}</div>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2">
                    {isEditing ? (
                      <>
                        <Button onClick={() => saveEdit(page.id)}>Save</Button>
                        <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingId(page.id);
                            setHeadline(page.headline ?? "");
                            setSummary(page.summary ?? "");
                          }}
                        >
                          Edit
                        </Button>
                        {!published ? (
                          <Button
                            onClick={() =>
                              publishProofPage.mutate(page.id, {
                                onSuccess: () => {
                                  toast.success("Proof page published");
                                  refetch?.();
                                },
                                onError: (error: any) => toast.error(error?.message ?? "Failed to publish"),
                              })
                            }
                            disabled={publishProofPage.isPending}
                          >
                            <Globe className="mr-2 h-4 w-4" />
                            Publish
                          </Button>
                        ) : (
                          <>
                            {path ? (
                              <a href={path} target="_blank" rel="noreferrer">
                                <Button variant="outline">
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Preview
                                </Button>
                              </a>
                            ) : null}
                            <Button variant="outline" onClick={() => optIntoDirectory(page.id)}>
                              Opt into directory
                            </Button>
                            <Button variant="outline" onClick={() => optOutOfDirectory(page.id)}>
                              Opt out
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {pages.length === 0 ? (
            <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-8 text-[14px] text-[#5C5C5C] shadow-sm">
              No proof pages yet.
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
