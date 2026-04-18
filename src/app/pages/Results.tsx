import { useMemo } from "react";
import { ArrowLeft, Download, Globe, Loader2, Plus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { apiFetch, apiPost } from "../../lib/api";
import { assessmentTitle } from "../lib/poaw";
import { useAuthStore } from "../../stores/authStore";

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: assessment, isLoading: assessmentLoading } = useQuery({
    queryKey: ["assessment", id],
    queryFn: () => apiFetch<any>(`/assessments/${id}`),
    enabled: !!id,
  });
  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ["assessment-results", id],
    queryFn: () => apiFetch<any>(`/assessments/${id}/results`),
    enabled: !!id,
  });
  const { data: normalized } = useQuery({
    queryKey: ["assessment-normalized", id],
    queryFn: () => apiFetch<any>(`/assessments/${id}/normalized`),
    enabled: !!id,
  });

  const createProofPage = useMutation({
    mutationFn: () => apiPost<any>("/proof-pages", { assessment_id: id }),
  });

  const downloadJson = async () => {
    const token = useAuthStore.getState().token;
    const apiHost = import.meta.env.VITE_API_URL || "";
    const url = `${apiHost ? apiHost.replace(/\/$/, "") : ""}/api/v1/assessments/${id}/download?format=json`;
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error("Download failed");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `assessment-${id}.json`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  };

  const grouped = useMemo(() => {
    const observations = Array.isArray(results?.observations) ? results.observations : [];
    return {
      strong: observations.filter((obs: any) => !obs.skipped && obs.score != null && obs.score >= 0.7),
      weak: observations.filter((obs: any) => !obs.skipped && obs.score != null && obs.score < 0.4),
      rest: observations.filter((obs: any) => !obs.skipped && obs.score != null && obs.score >= 0.4 && obs.score < 0.7),
    };
  }, [results?.observations]);

  if (assessmentLoading || resultsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        Loading results...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-8">
          <Link to="/app/assessments" className="inline-flex items-center gap-2 text-[13px] text-[#5C5C5C] hover:text-[#161616]">
            <ArrowLeft className="h-4 w-4" />
            Back to assessments
          </Link>
          <div className="mt-5">
            <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Assessment results</div>
            <h1 className="mt-2 text-3xl tracking-tight">{assessmentTitle(assessment)}</h1>
            <p className="mt-2 text-[15px] text-[#5C5C5C]">
              status {assessment?.status} • {results?.dimensions_evaluated ?? 0} dimensions evaluated
            </p>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-3 gap-4">
            <Card className="border border-[#D8D2C4] bg-white p-5 shadow-sm">
              <div className="text-[12px] uppercase tracking-[0.12em] text-[#6B6B66]">Confidence</div>
              <div className="mt-2 text-3xl tracking-tight">{results?.overall_confidence || "—"}</div>
            </Card>
            <Card className="border border-[#D8D2C4] bg-white p-5 shadow-sm">
              <div className="text-[12px] uppercase tracking-[0.12em] text-[#6B6B66]">Evaluated</div>
              <div className="mt-2 text-3xl tracking-tight">{results?.dimensions_evaluated ?? 0}</div>
            </Card>
            <Card className="border border-[#D8D2C4] bg-white p-5 shadow-sm">
              <div className="text-[12px] uppercase tracking-[0.12em] text-[#6B6B66]">Skipped</div>
              <div className="mt-2 text-3xl tracking-tight">{results?.dimensions_skipped ?? 0}</div>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-[1.2fr_0.8fr] gap-6">
            <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
              <div className="text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Observations</div>
              <div className="mt-4 space-y-3">
                {(results?.observations ?? []).map((observation: any) => (
                  <div key={observation.dimension} className="rounded-md border border-[#D8D2C4] bg-[#FBF8F1] px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-[14px]">{observation.dimension}</div>
                      {observation.score != null ? (
                        <div className="text-[13px] text-[#315D8A]">{Math.round(observation.score * 100)}%</div>
                      ) : (
                        <div className="text-[12px] text-[#6B6B66]">{observation.skip_reason || "skipped"}</div>
                      )}
                    </div>
                    {observation.summary ? (
                      <div className="mt-1 text-[12px] text-[#5C5C5C]">{observation.summary}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
                <div className="text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Create proof page</div>
                <div className="mt-3 text-[14px] leading-8 text-[#5C5C5C]">
                  Turn this assessment into a public artifact.
                </div>
                <Button
                  className="mt-4 w-full"
                  onClick={() =>
                    createProofPage.mutate(undefined, {
                      onSuccess: () => {
                        toast.success("Proof page created");
                        navigate("/app/proof-pages");
                      },
                      onError: (error: any) => toast.error(error?.message ?? "Failed to create proof page"),
                    })
                  }
                  disabled={createProofPage.isPending}
                >
                  {createProofPage.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                  Create proof page
                </Button>
              </Card>

              <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
                <div className="text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Signals</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(results?.signals ?? []).map((signal: any) => (
                    <div key={signal.id} className="rounded-full border border-[#D8D2C4] bg-[#FBF8F1] px-3 py-1 text-[12px] text-[#5C5C5C]">
                      {signal.label}
                    </div>
                  ))}
                  {(!results?.signals || results.signals.length === 0) ? (
                    <div className="text-[13px] text-[#5C5C5C]">No public signals recorded.</div>
                  ) : null}
                </div>
              </Card>

              <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
                <div className="text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Normalized inputs</div>
                <div className="mt-3 space-y-2">
                  {(normalized?.files ?? []).map((file: any, index: number) => (
                    <div key={`${file.content_hash}-${index}`} className="rounded-md border border-[#D8D2C4] bg-[#FBF8F1] px-3 py-2 text-[12px] text-[#5C5C5C]">
                      {file.task_type || "mixed"} • {file.turn_count} turns • {file.iteration_count} iterations
                    </div>
                  ))}
                  {(!normalized?.files || normalized.files.length === 0) ? (
                    <div className="text-[13px] text-[#5C5C5C]">No normalized file summary.</div>
                  ) : null}
                </div>
              </Card>

              <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
                <div className="text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Export</div>
                <Button className="mt-4 w-full" variant="outline" onClick={() => downloadJson().catch((error) => toast.error(error.message))}>
                  <Download className="mr-2 h-4 w-4" />
                  Download JSON
                </Button>
              </Card>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <Card className="border border-[#D8D2C4] bg-white p-5 shadow-sm">
              <div className="text-[12px] uppercase tracking-[0.12em] text-[#6B6B66]">Strong</div>
              <div className="mt-2 text-3xl tracking-tight">{grouped.strong.length}</div>
            </Card>
            <Card className="border border-[#D8D2C4] bg-white p-5 shadow-sm">
              <div className="text-[12px] uppercase tracking-[0.12em] text-[#6B6B66]">Developing</div>
              <div className="mt-2 text-3xl tracking-tight">{grouped.rest.length}</div>
            </Card>
            <Card className="border border-[#D8D2C4] bg-white p-5 shadow-sm">
              <div className="text-[12px] uppercase tracking-[0.12em] text-[#6B6B66]">Weak</div>
              <div className="mt-2 text-3xl tracking-tight">{grouped.weak.length}</div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
