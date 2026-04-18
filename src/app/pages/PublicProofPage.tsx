import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Globe, ShieldCheck } from "lucide-react";
import { Card } from "../components/ui/card";
import { apiFetch } from "../../lib/api";
import { dateTime } from "../lib/poaw";

export default function PublicProofPage() {
  const { slug } = useParams<{ slug?: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-proof", slug],
    queryFn: () => apiFetch<any>(`/p/${slug}`),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F4ED] text-[13px] text-[#6B6B66]">
        Loading proof page...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F7F4ED] px-8 text-center">
        <AlertCircle className="h-8 w-8 text-[#8E3B34]" />
        <div className="text-2xl tracking-tight text-[#161616]">Proof page not found.</div>
        <div className="max-w-md text-[14px] leading-7 text-[#5C5C5C]">
          This page may have been unpublished or the link may be invalid.
        </div>
      </div>
    );
  }

  const observations = Array.isArray(data?.observations) ? data.observations : [];
  const excerpts = Array.isArray(data?.excerpts) ? data.excerpts : [];
  const githubPanels = Array.isArray(data?.github_panels) ? data.github_panels : [];
  const trustPanel = data?.trust_panel ?? {};

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <div className="mx-auto max-w-5xl px-8 py-12">
        <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Public proof</div>
        <div className="mt-4 flex items-start justify-between gap-6">
          <div className="max-w-3xl">
            <h1 className="text-5xl leading-[1] tracking-tight">{data.headline || data.project_title || "Proof of AI Work"}</h1>
            <div className="mt-4 text-[18px] leading-9 text-[#5C5C5C]">
              {data.summary || data.project_description || "No summary provided."}
            </div>
            <div className="mt-4 text-[13px] text-[#6B6B66]">
              published {dateTime(data.published_at)} • {data.view_count ?? 0} views
            </div>
          </div>
          <div className="rounded-full border border-[#D8D2C4] bg-white px-4 py-2 text-[13px] text-[#315D8A]">
            <Globe className="mr-2 inline h-4 w-4" />
            public
          </div>
        </div>

        <div className="mt-8 grid grid-cols-[1.3fr_0.7fr] gap-6">
          <div className="space-y-6">
            <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
              <div className="text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Observations</div>
              <div className="mt-4 space-y-3">
                {observations.map((observation: any, index: number) => (
                  <div key={`${observation.dimension}-${index}`} className="rounded-md border border-[#D8D2C4] bg-[#FBF8F1] px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-[14px]">{observation.dimension}</div>
                      {observation.score != null ? (
                        <div className="text-[13px] text-[#315D8A]">{Math.round(observation.score * 100)}%</div>
                      ) : (
                        <div className="text-[12px] text-[#6B6B66]">{observation.label || "skipped"}</div>
                      )}
                    </div>
                    {observation.summary ? (
                      <div className="mt-1 text-[12px] text-[#5C5C5C]">{observation.summary}</div>
                    ) : null}
                  </div>
                ))}
                {observations.length === 0 ? (
                  <div className="text-[14px] text-[#5C5C5C]">No public observations available.</div>
                ) : null}
              </div>
            </Card>

            <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
              <div className="text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Excerpts</div>
              <div className="mt-4 space-y-3">
                {excerpts.map((excerpt: any, index: number) => (
                  <div key={excerpt.id ?? index} className="rounded-md border border-[#D8D2C4] bg-[#FBF8F1] px-4 py-3 text-[14px] leading-7 text-[#2A2A28]">
                    {excerpt.text || excerpt.content || JSON.stringify(excerpt)}
                  </div>
                ))}
                {excerpts.length === 0 ? (
                  <div className="text-[14px] text-[#5C5C5C]">No excerpts published.</div>
                ) : null}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">
                <ShieldCheck className="h-4 w-4" />
                Trust panel
              </div>
              <div className="mt-4 space-y-2 text-[13px] text-[#5C5C5C]">
                <div>dimensions evaluated: {trustPanel.dimensions_evaluated ?? 0}</div>
                <div>dimensions skipped: {trustPanel.dimensions_skipped ?? 0}</div>
                <div>hash integrity: {trustPanel.hash_integrity ? "verified" : "not verified"}</div>
                <div>page version: {trustPanel.page_version ?? 1}</div>
                <div>sample uploads: {trustPanel.sample_size?.uploads ?? 0}</div>
              </div>
            </Card>

            <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
              <div className="text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">GitHub evidence</div>
              <div className="mt-4 space-y-3">
                {githubPanels.map((panel: any, index: number) => (
                  <a key={`${panel.repo_owner}-${panel.repo_name}-${index}`} href={panel.repo_url} target="_blank" rel="noreferrer" className="block rounded-md border border-[#D8D2C4] bg-[#FBF8F1] px-4 py-3">
                    <div className="text-[14px]">{panel.repo_owner}/{panel.repo_name}</div>
                    <div className="mt-1 text-[12px] text-[#5C5C5C]">
                      {panel.language || "unknown language"} • correlation {panel.correlation_score ?? "—"}
                    </div>
                  </a>
                ))}
                {githubPanels.length === 0 ? (
                  <div className="text-[14px] text-[#5C5C5C]">No GitHub evidence attached.</div>
                ) : null}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
