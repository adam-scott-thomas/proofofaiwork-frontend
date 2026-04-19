import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ExternalLink, FolderKanban, Github, Layers, ShieldCheck } from "lucide-react";
import { apiFetch } from "../../lib/api";

type ProjectCard = {
  project_id: string;
  title: string;
  description: string | null;
  top_observations: Array<{ dimension?: string; label?: string; summary?: string; score?: number | null }>;
  conversation_count: number;
  github_repos: Array<{ repo_name?: string; repo_owner?: string; language?: string | null; correlation_score?: number | null; repo_url?: string }>;
  evidence_class_summary: Record<string, number>;
  proof_page_token: string | null;
};

type PortfolioPublicResponse = {
  public_token: string;
  slug: string | null;
  title: string;
  headline: string | null;
  summary: string | null;
  total_projects: number;
  total_conversations: number;
  total_repos: number;
  projects: ProjectCard[];
  trust_panel: Record<string, any>;
};

const CLASS_STYLE: Record<string, string> = {
  A: "bg-[#1F6A3F]",
  A_plus: "bg-[#1F6A3F]",
  B: "bg-[#486E9B]",
  C: "bg-[#C18A2E]",
  D: "bg-[#8B2F2F]",
};

function fmtInt(value?: number | null) {
  return (value ?? 0).toLocaleString("en-US");
}

export default function PublicPortfolio() {
  const { slug } = useParams<{ slug?: string }>();
  const { data, isLoading, error } = useQuery<PortfolioPublicResponse>({
    queryKey: ["public-portfolio", slug],
    queryFn: () => apiFetch<PortfolioPublicResponse>(`/u/${slug}`),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] text-[13px] text-[#717182]">
        Loading portfolio...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#FAFAFA] text-[#030213]">
        <AlertCircle className="h-6 w-6 text-[#8B2F2F]" />
        <h1 className="text-3xl tracking-tight">Portfolio not found.</h1>
        <p className="text-[13px] text-[#717182]">This portfolio may have been unpublished or the link is invalid.</p>
      </div>
    );
  }

  const totalEvidenceClasses = data.projects.reduce<Record<string, number>>((acc, project) => {
    for (const [cls, count] of Object.entries(project.evidence_class_summary ?? {})) {
      acc[cls] = (acc[cls] ?? 0) + (count as number);
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#030213]">
      {/* Topbar */}
      <div className="sticky top-0 z-30 border-b border-[rgba(0,0,0,0.06)] bg-[rgba(250,250,250,0.9)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-3">
          <div className="flex items-center gap-3">
            <Layers className="h-4 w-4 text-[#6B46C1]" />
            <span className="text-[12px] tracking-[0.06em] text-[#030213]">Proof of AI Work</span>
            <span className="text-[11px] text-[#717182]">
              · proofofaiwork.com/u/<span className="text-[#030213]">{data.slug || data.public_token.slice(0, 10)}</span>
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-8 py-16">
        {/* Hero */}
        <section>
          <div className="text-[11px] uppercase tracking-[0.16em] text-[#717182]">Portfolio</div>
          <h1 className="mt-3 text-5xl leading-[1.02] tracking-tight md:text-6xl">{data.title}</h1>
          {data.headline ? (
            <p className="mt-4 max-w-2xl text-[18px] leading-[1.55] text-[#3a3a3a]">{data.headline}</p>
          ) : null}
          {data.summary ? (
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#717182]">{data.summary}</p>
          ) : null}

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <Tile label="Projects" value={fmtInt(data.total_projects)} />
            <Tile label="Conversations" value={fmtInt(data.total_conversations)} />
            <Tile label="Linked repos" value={fmtInt(data.total_repos)} />
          </div>
        </section>

        {/* Trust panel */}
        <section className="mt-14">
          <div className="text-[11px] uppercase tracking-[0.16em] text-[#717182]">Trust panel</div>
          <h2 className="mt-2 text-2xl tracking-tight">Aggregate evidence across the collection.</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[#717182]">
                <ShieldCheck className="h-3 w-3" />
                Evidence mix
              </div>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[#EAE3CF]">
                {["A_plus", "A", "B", "C", "D"].map((cls) => {
                  const count = totalEvidenceClasses[cls] ?? 0;
                  if (!count) return null;
                  const total = Object.values(totalEvidenceClasses).reduce((a, b) => a + b, 0) || 1;
                  return (
                    <div
                      key={cls}
                      className={CLASS_STYLE[cls] ?? "bg-[#EAE3CF]"}
                      style={{ width: `${(count / total) * 100}%` }}
                      title={`${count} × class ${cls.replace("_plus", "+")}`}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#717182]">
                {["A_plus", "A", "B", "C", "D"].map((cls) => {
                  const count = totalEvidenceClasses[cls];
                  if (!count) return null;
                  return (
                    <span key={cls} className="inline-flex items-center gap-1">
                      <span className={`h-2 w-2 rounded-full ${CLASS_STYLE[cls] ?? "bg-[#EAE3CF]"}`} />
                      {count} × {cls.replace("_plus", "+")}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-sm">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#717182]">Portfolio metadata</div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
                {Object.entries(data.trust_panel || {}).slice(0, 6).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-[10px] uppercase tracking-[0.1em] text-[#717182]">{key.replace(/_/g, " ")}</dt>
                    <dd className="mt-0.5 truncate text-[13px] text-[#030213]">
                      {typeof value === "object" && value !== null
                        ? JSON.stringify(value).slice(0, 40)
                        : String(value ?? "—")}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Projects */}
        <section className="mt-14">
          <div className="text-[11px] uppercase tracking-[0.16em] text-[#717182]">Projects</div>
          <h2 className="mt-2 text-2xl tracking-tight">{data.projects.length} pieces of work</h2>

          {data.projects.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-[rgba(0,0,0,0.12)] bg-white p-10 text-center text-[13px] text-[#717182]">
              This portfolio has no projects yet.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {data.projects.map((project) => (
                <ProjectRow key={project.project_id} project={project} />
              ))}
            </div>
          )}
        </section>

        <footer className="mt-16 border-t border-[rgba(0,0,0,0.06)] pt-6 text-[11px] text-[#717182]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>This is a public portfolio page. Projects link to their individual proof pages.</div>
            <div>
              Token <span className="font-mono text-[#030213]">{data.public_token.slice(0, 10)}…</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4 shadow-sm">
      <div className="text-[11px] uppercase tracking-[0.12em] text-[#717182]">{label}</div>
      <div className="mt-1 text-3xl tracking-tight">{value}</div>
    </div>
  );
}

function ProjectRow({ project }: { project: ProjectCard }) {
  const proofHref = project.proof_page_token ? `/p/${project.proof_page_token}` : null;
  return (
    <article className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <FolderKanban className="mt-1 h-4 w-4 shrink-0 text-[#6B46C1]" />
          <div className="min-w-0">
            {proofHref ? (
              <Link to={proofHref} className="text-[16px] text-[#030213] hover:underline">
                {project.title}
                <ExternalLink className="ml-1 inline h-3 w-3 text-[#717182]" />
              </Link>
            ) : (
              <div className="text-[16px] text-[#030213]">{project.title}</div>
            )}
            {project.description ? (
              <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[#717182]">{project.description}</p>
            ) : null}
          </div>
        </div>
        <div className="text-[11px] text-[#717182]">
          {project.conversation_count} conversation{project.conversation_count === 1 ? "" : "s"}
        </div>
      </div>

      {project.top_observations.length > 0 ? (
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {project.top_observations.slice(0, 3).map((observation, index) => (
            <div key={`${observation.dimension ?? "obs"}-${index}`} className="rounded-md border border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] p-3">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.1em] text-[#717182]">
                  {observation.dimension || "observation"}
                </div>
                {observation.score != null ? (
                  <div className="text-[11px] font-medium text-[#030213]">
                    {observation.score <= 1 ? Math.round(observation.score * 100) : Math.round(observation.score)}%
                  </div>
                ) : null}
              </div>
              <div className="mt-1 text-[12px] text-[#030213]">{observation.label || "—"}</div>
              {observation.summary ? (
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#717182]">{observation.summary}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {project.github_repos.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {project.github_repos.map((repo, index) => {
            const label = repo.repo_owner && repo.repo_name ? `${repo.repo_owner}/${repo.repo_name}` : repo.repo_name || "repo";
            const corr = repo.correlation_score != null ? Math.round(repo.correlation_score * 100) : null;
            return (
              <a
                key={`${label}-${index}`}
                href={repo.repo_url || "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-2 py-0.5 text-[11px] text-[#3a3a3a] hover:border-[#6B46C1]"
              >
                <Github className="h-3 w-3" />
                {label}
                {repo.language ? <span className="text-[10px] text-[#717182]">· {repo.language}</span> : null}
                {corr != null ? <span className="text-[10px] text-[#6B46C1]">· {corr}%</span> : null}
              </a>
            );
          })}
        </div>
      ) : null}

      {Object.values(project.evidence_class_summary ?? {}).some((count) => (count as number) > 0) ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-[#717182]">
          <span className="uppercase tracking-[0.1em]">Evidence</span>
          {Object.entries(project.evidence_class_summary).map(([cls, count]) => (
            count ? (
              <span key={cls} className="inline-flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${CLASS_STYLE[cls] ?? "bg-[#EAE3CF]"}`} />
                {count} × {cls.replace("_plus", "+")}
              </span>
            ) : null
          ))}
        </div>
      ) : null}
    </article>
  );
}
