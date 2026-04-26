import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, Check, ExternalLink, Loader2, Mail, MoonStar, Send, Share2, SunMedium, X } from "lucide-react";
import { apiFetch, apiPost } from "../../lib/api";
import Seo from "../components/Seo";
import "./PublicProofPage.css";

type PublicObservation = {
  dimension: string | null;
  score: number | null;
  label: string | null;
  summary: string | null;
  confidence_label: string | null;
  confidence_score: number | null;
};

type PublicExcerpt = {
  id: string;
  display_order: number;
  excerpt_text: string;
  redacted_text: string | null;
  annotation: string | null;
  dimension: string | null;
  claim: string | null;
};

type TrustPanel = {
  sample_size?: {
    sessions?: number;
    uploads?: number;
  };
  evidence_classes?: {
    A_plus?: number;
    A?: number;
    B?: number;
    C?: number;
    D?: number;
  };
  censorship_coverage_pct?: number;
  hash_integrity?: boolean;
  github_repos_linked?: number;
  github_correlation_score?: number | null;
  engine_version?: string;
  dimensions_evaluated?: number;
  dimensions_skipped?: number;
  page_version?: number;
  last_modified?: string | null;
};

type GitHubPanel = {
  repo_name: string;
  repo_owner: string;
  language: string | null;
  stars: number | null;
  commit_count: number | null;
  correlation_score: number | null;
  repo_url: string;
};

type PublicProofResponse = {
  public_token: string;
  slug: string | null;
  project_title: string | null;
  project_description: string | null;
  headline: string | null;
  summary: string | null;
  custom_meta: Record<string, unknown>;
  view_count: number;
  published_at: string | null;
  observations: PublicObservation[];
  excerpts: PublicExcerpt[];
  trust_panel: TrustPanel;
  github_panels: GitHubPanel[];
};

type PageConfig = {
  contact_enabled?: boolean;
  show_weaknesses?: boolean;
  show_skipped_dimensions?: boolean;
};

type ShareCardPayload =
  | { kind: "page"; title: string; body: string; url: string }
  | { kind: "archetype"; title: string; body: string; url: string }
  | { kind: "observation"; title: string; body: string; url: string }
  | { kind: "score"; title: string; body: string; url: string };

function fmtInt(value?: number | null) {
  return (value ?? 0).toLocaleString("en-US");
}

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function fmtTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function scorePercent(value: number | null | undefined) {
  if (value == null) return null;
  if (value <= 1) return Math.round(value * 100);
  return Math.round(value);
}

function confidenceClass(label?: string | null) {
  const normalized = (label || "").toLowerCase();
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  return "low";
}

function hashPreview(token: string) {
  const base = token.replace(/[^a-zA-Z0-9]/g, "").padEnd(32, "0").slice(0, 32);
  return `sha256:${base.slice(0, 8)}…${base.slice(-8)}`;
}

function primaryVerdict(observations: PublicObservation[]) {
  const sorted = [...observations]
    .filter((item) => item.score != null)
    .sort((a, b) => (scorePercent(b.score) ?? 0) - (scorePercent(a.score) ?? 0));
  return sorted[0] ?? null;
}

function shareText(payload: ShareCardPayload) {
  return `${payload.title}\n${payload.body}\n${payload.url}`;
}

function detailLabel(observation: PublicObservation) {
  return observation.label || observation.dimension || "Observation";
}

function scoreHeadline(observation: PublicObservation | null | undefined) {
  if (!observation) return "Evidence-backed AI work profile";
  const score = scorePercent(observation.score);
  const label = detailLabel(observation).toLowerCase();
  if (score == null) return "Evidence-backed AI work profile";
  if (score >= 85) return `Exceptional ${label}, backed by real workflow evidence`;
  if (score >= 70) return `Strong ${label} under real working conditions`;
  if (score >= 55) return `Clear ${label} signal in this public proof`;
  return `Visible ${label} signal from real AI work`;
}

function scoreBody(
  observation: PublicObservation | null | undefined,
  trust: TrustPanel,
) {
  const sessions = fmtInt(trust.sample_size?.sessions);
  const uploads = fmtInt(trust.sample_size?.uploads);
  const detail = observation ? detailLabel(observation) : "AI work pattern";
  const summary = observation?.summary;
  if (summary) {
    return `${summary} Based on ${sessions} sessions and ${uploads} uploads.`;
  }
  return `${detail} surfaced from ${sessions} sessions and ${uploads} uploads, not self-reported claims.`;
}

function usePublicProof(slug?: string) {
  return useQuery({
    queryKey: ["public-proof", slug],
    queryFn: () => apiFetch<PublicProofResponse>(`/p/${slug}`),
    enabled: !!slug,
  });
}

function ShareOverlay({
  payload,
  onClose,
}: {
  payload: ShareCardPayload | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!payload) return null;

  const url = payload.url;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText(payload));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const openWindow = (target: "x" | "linkedin") => {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(`${payload.title} — ${payload.body}`);
    const href =
      target === "x"
        ? `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`
        : `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="pp-share-overlay" onClick={onClose}>
      <div className="pp-share-panel" onClick={(event) => event.stopPropagation()}>
        <div className="pp-share-head">
          <div className="pp-share-eyebrow">Share</div>
          <button type="button" className="pp-share-close" onClick={onClose} aria-label="Close share panel">
            <X size={14} />
          </button>
        </div>

        <div className="pp-share-card">
          <div className="pp-share-card-eyebrow">{payload.kind}</div>
          <div className="pp-share-card-title">{payload.title}</div>
          <div className="pp-share-card-body">{payload.body}</div>
        </div>

        <div className="pp-share-targets">
          <button type="button" className="pp-share-target" onClick={handleCopy}>
            <Share2 size={14} />
            {copied ? "Copied" : "Copy"}
          </button>
          <button type="button" className="pp-share-target" onClick={() => openWindow("x")}>
            <Share2 size={14} />
            X
          </button>
          <button type="button" className="pp-share-target" onClick={() => openWindow("linkedin")}>
            <Share2 size={14} />
            LinkedIn
          </button>
          <a className="pp-share-target" href={url} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
            Open
          </a>
        </div>

        <div className="pp-share-copy">
          <input readOnly value={url} />
          <button type="button" onClick={handleCopy}>
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicProofPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [sharePayload, setSharePayload] = useState<ShareCardPayload | null>(null);
  const { data, isLoading, error } = usePublicProof(slug);

  const verdict = useMemo(() => (data ? primaryVerdict(data.observations || []) : null), [data]);
  const pageUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://proofofaiwork.com/p/${slug ?? ""}`;

  if (isLoading) {
    return (
      <div className="pp-loading">
        Loading proof page...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="pp-error">
        <AlertCircle className="pp-error-icon" />
        <h1>Proof page not found.</h1>
        <p>This page may have been unpublished or the link may be invalid.</p>
      </div>
    );
  }

  const archetype = data.headline || data.project_title || "Untitled proof";
  const subcopy =
    data.summary ||
    data.project_description ||
    "A public record of human-led AI work, grounded in observations, excerpts, and trust metadata.";
  const trust = data.trust_panel || {};
  const evidence = trust.evidence_classes || {};
  const canonicalUrl = pageUrl;
  const ogImageUrl = `https://api.proofofaiwork.com/api/v1/p/${data.slug || data.public_token}/og.png?v=${encodeURIComponent(
    String(data.published_at || trust.page_version || "1"),
  )}`;

  return (
    <div className="pp-page" data-theme={theme}>
      <Seo
        title={`${data.project_title || archetype} | Proof of AI Work`}
        description={`Evidence-backed proof page for ${data.project_title || archetype}. Review process, observations, excerpts, and trust signals behind this AI-assisted work.`}
        canonical={canonicalUrl}
        image={ogImageUrl}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          name: data.project_title || archetype,
          description: subcopy,
          url: canonicalUrl,
          mainEntity: {
            "@type": "CreativeWork",
            name: data.project_title || archetype,
            description: subcopy,
          },
        }}
      />
      <div className="pp-topbar">
        <div className="pp-topbar-inner">
          <div className="pp-top-left">
            <span className="pp-brand">Proof of AI Work</span>
            <span className="pp-top-url">
              <span className="host">proofofaiwork.com</span>/p/
              <span className="slug">{data.slug || data.public_token.slice(0, 10)}</span>
            </span>
          </div>
          <div className="pp-top-right">
            <button
              type="button"
              className="pp-theme-toggle"
              onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
            >
              {theme === "light" ? <MoonStar size={13} /> : <SunMedium size={13} />}
              {theme === "light" ? "Dark" : "Light"}
            </button>
            <button
              type="button"
              className="pp-share-button"
              onClick={() =>
                setSharePayload({
                  kind: "page",
                  title: archetype,
                  body: subcopy,
                  url: pageUrl,
                })
              }
            >
              <Share2 size={13} />
              Share
            </button>
          </div>
        </div>
      </div>

      <main className="pp-main">
        <section className="pp-hero">
          <div className="pp-shell">
            <div className="pp-crumbs">
              <span className="pp-verified">
                <Check size={10} />
                Verified
              </span>
              <span className="dot">/</span>
              <span>Published {fmtDate(data.published_at)}</span>
              <span className="dot">/</span>
              <span>{fmtInt(data.view_count)} views</span>
              <span className="dot">/</span>
              <span>Engine {trust.engine_version || "—"}</span>
            </div>

            <h1 className="pp-name">{data.project_title || "Untitled project"}</h1>
            {data.project_description ? <div className="pp-role">{data.project_description}</div> : null}

            {verdict ? (
              <button
                type="button"
                className="pp-verdict"
                onClick={() =>
                  setSharePayload({
                    kind: "observation",
                    title: scoreHeadline(verdict),
                    body: scoreBody(verdict, trust),
                    url: pageUrl,
                  })
                }
              >
                <div className="pp-verdict-eb">Top signal</div>
                <div className="pp-verdict-mega">
                  <span className="pp-verdict-num-xl">{scorePercent(verdict.score)}</span>
                  <span className="pp-verdict-den">/100</span>
                </div>
                <div className="pp-verdict-copy">
                  <div className="pp-verdict-label">{detailLabel(verdict)}</div>
                  <div className="pp-verdict-sub">{verdict.summary || "Highest-rated public signal on this page."}</div>
                </div>
                <div className="pp-verdict-share-hint">
                  <Share2 size={11} />
                  Share signal
                </div>
              </button>
            ) : null}

            <div className="pp-archetype-wrap">
              <div className="pp-archetype-eb">
                <span>Archetype</span>
                <span className="pp-archetype-rule" />
                <span>Public proof</span>
              </div>
              <h2 className="pp-archetype">
                {archetype}
                <button
                  type="button"
                  className="pp-archetype-share"
                  onClick={() =>
                    setSharePayload({
                      kind: "archetype",
                      title: `${archetype} · evidence-backed AI work profile`,
                      body: `${subcopy} Built from ${fmtInt(trust.sample_size?.sessions)} sessions and ${fmtInt(trust.sample_size?.uploads)} uploads.`,
                      url: pageUrl,
                    })
                  }
                >
                  <Share2 size={11} />
                  Share
                </button>
              </h2>
              <p className="pp-summary">{subcopy}</p>
            </div>

            <div className="pp-scores">
              {(data.observations || []).slice(0, 3).map((observation, index) => (
                <button
                  type="button"
                  key={`${observation.dimension || observation.label || "signal"}-${index}`}
                  className="pp-score"
                  onClick={() =>
                    setSharePayload({
                      kind: "score",
                      title: `${scorePercent(observation.score) ?? "—"}/100 ${detailLabel(observation)}`,
                      body: scoreBody(observation, trust),
                      url: pageUrl,
                    })
                  }
                >
                  <div className="pp-score-code">{observation.dimension || `signal_${index + 1}`}</div>
                  <div className="pp-score-num">
                    {scorePercent(observation.score) ?? "—"}
                    {observation.score != null ? <span className="pp-score-suf">%</span> : null}
                  </div>
                  <div className="pp-score-name">{detailLabel(observation)}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {(data.observations || []).length > 0 ? (
          <section className="pp-section">
            <div className="pp-shell">
              <div className="pp-section-head">
                <div>
                  <div className="pp-section-eyebrow">Appendix A</div>
                  <h2 className="pp-section-title">Dimension ratings</h2>
                </div>
                <div className="pp-section-sub">
                  {data.observations.length} dimensions evaluated
                  <br />
                  across {fmtInt(trust.sample_size?.sessions)} sessions
                </div>
              </div>

              <div className="pp-obs-list">
                {data.observations.map((observation, index) => (
                  <button
                    type="button"
                    key={`${observation.dimension || observation.label || "obs"}-${index}`}
                    className="pp-obs"
                    onClick={() =>
                      setSharePayload({
                        kind: "observation",
                        title: `${detailLabel(observation)} · evidence-backed signal`,
                        body: scoreBody(observation, trust),
                        url: pageUrl,
                      })
                    }
                  >
                    <div>
                      <div className="pp-obs-num">
                        {scorePercent(observation.score) ?? "—"}
                        {observation.score != null ? <span className="pct">%</span> : null}
                      </div>
                      <div className="pp-obs-bar">
                        <div style={{ width: `${scorePercent(observation.score) ?? 0}%` }} />
                      </div>
                    </div>
                    <div className="pp-obs-body">
                      <div className="pp-obs-name">{detailLabel(observation)}</div>
                      <div className="pp-obs-dim">{observation.dimension || "dimension unavailable"}</div>
                      <div className="pp-obs-sum">{observation.summary || "No summary provided."}</div>
                      <div className="pp-obs-conf">
                        <span className={`pill-c ${confidenceClass(observation.confidence_label)}`}>
                          {(observation.confidence_label || "low")} confidence
                        </span>
                        {observation.confidence_score != null ? (
                          <>
                            <span>·</span>
                            <span>{Math.round(observation.confidence_score * 100)}% model certainty</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <span className="pp-obs-share">
                      <Share2 size={12} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {(data.excerpts || []).length > 0 ? (
          <section className="pp-section">
            <div className="pp-shell">
              <div className="pp-section-head">
                <div>
                  <div className="pp-section-eyebrow">Evidence</div>
                  <h2 className="pp-section-title">Turns selected from the transcript</h2>
                </div>
                <div className="pp-section-sub">Excerpts are verbatim. Surrounding context was redacted for privacy.</div>
              </div>

              <div>
                {data.excerpts.map((excerpt, index) => (
                  <div className="pp-excerpt" key={excerpt.id || index}>
                    <div className="pp-excerpt-meta">
                      <span>#{String(index + 1).padStart(2, "0")}</span>
                      {excerpt.dimension ? <span className="dim">{excerpt.dimension}</span> : null}
                      {excerpt.claim ? <span>· {excerpt.claim}</span> : null}
                    </div>
                    <blockquote>{excerpt.redacted_text || excerpt.excerpt_text}</blockquote>
                    {excerpt.annotation ? <div className="ann">{excerpt.annotation}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {(data.github_panels || []).length > 0 ? (
          <section className="pp-section">
            <div className="pp-shell">
              <div className="pp-section-head">
                <div>
                  <div className="pp-section-eyebrow">Cross-reference</div>
                  <h2 className="pp-section-title">Linked repositories</h2>
                </div>
                <div className="pp-section-sub">
                  Correlation score reflects alignment between the chat timeline and the commit timeline.
                </div>
              </div>

              <div className="pp-gh-list">
                {data.github_panels.map((panel) => (
                  <a key={`${panel.repo_owner}/${panel.repo_name}`} href={panel.repo_url} target="_blank" rel="noreferrer" className="pp-gh">
                    <div className="pp-gh-head">
                      <div className="pp-gh-repo">
                        <span className="owner">{panel.repo_owner}/</span>
                        {panel.repo_name}
                      </div>
                      {panel.language ? <div className="pp-gh-lang">{panel.language}</div> : null}
                    </div>
                    <div className="pp-gh-stats">
                      {panel.stars != null ? (
                        <span>
                          <span className="k">★</span>
                          {fmtInt(panel.stars)}
                        </span>
                      ) : null}
                      {panel.commit_count != null ? (
                        <span>
                          <span className="k">commits</span>
                          {fmtInt(panel.commit_count)}
                        </span>
                      ) : null}
                      <span className="pp-gh-open">
                        <ExternalLink size={11} />
                      </span>
                    </div>
                    {panel.correlation_score != null ? (
                      <div className="pp-gh-corr">
                        <div className="bar">
                          <div style={{ width: `${Math.round(panel.correlation_score * 100)}%` }} />
                        </div>
                        <div className="val">{Math.round(panel.correlation_score * 100)}% corr.</div>
                      </div>
                    ) : null}
                  </a>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="pp-section pp-section-trust">
          <div className="pp-shell">
            <div className="pp-section-head">
              <div>
                <div className="pp-section-eyebrow">Forensics</div>
                <h2 className="pp-section-title">Trust panel</h2>
              </div>
              <div className="pp-section-sub">Independently verifiable metadata. Page version {trust.page_version ?? 1}.</div>
            </div>

            <div className="pp-trust">
              <div className="pp-trust-inner">
                <div className="pp-trust-head">
                  <div className="pp-trust-eb">Hash integrity</div>
                  {trust.hash_integrity ? (
                    <div className="pp-trust-ok">
                      <Check size={11} />
                      Chain intact
                    </div>
                  ) : null}
                </div>

                <div className="pp-trust-hash">
                  <div>
                    <span className="k">sha256</span>
                    <span className="v">{hashPreview(data.public_token)}</span>
                  </div>
                  <div>
                    <span className="k">signed</span>
                    <span className="v">
                      {fmtDate(trust.last_modified)} · {fmtTime(trust.last_modified)} UTC
                    </span>
                  </div>
                </div>

                <div className="pp-trust-grid">
                  <div className="pp-trust-cell">
                    <div className="pp-trust-k">Sessions</div>
                    <div className="pp-trust-v">{fmtInt(trust.sample_size?.sessions)}</div>
                  </div>
                  <div className="pp-trust-cell">
                    <div className="pp-trust-k">Uploads</div>
                    <div className="pp-trust-v">{fmtInt(trust.sample_size?.uploads)}</div>
                  </div>
                  <div className="pp-trust-cell">
                    <div className="pp-trust-k">Coverage</div>
                    <div className="pp-trust-v">
                      {Number(trust.censorship_coverage_pct ?? 0).toFixed(1)}
                      <span className="unit">%</span>
                    </div>
                  </div>
                  <div className="pp-trust-cell">
                    <div className="pp-trust-k">Dimensions</div>
                    <div className="pp-trust-v">
                      {trust.dimensions_evaluated ?? 0}
                      <span className="unit">
                        /{(trust.dimensions_evaluated ?? 0) + (trust.dimensions_skipped ?? 0)}
                      </span>
                    </div>
                  </div>
                  <div className="pp-trust-cell">
                    <div className="pp-trust-k">Evidence classes</div>
                    <div className="pp-ev-classes">
                      {evidence.A_plus ? <span className="evc a-plus">A+·{evidence.A_plus}</span> : null}
                      {evidence.A ? <span className="evc a">A·{evidence.A}</span> : null}
                      {evidence.B ? <span className="evc">B·{evidence.B}</span> : null}
                      {evidence.C ? <span className="evc">C·{evidence.C}</span> : null}
                      {evidence.D ? <span className="evc d">D·{evidence.D}</span> : null}
                    </div>
                  </div>
                  <div className="pp-trust-cell">
                    <div className="pp-trust-k">GitHub linked</div>
                    <div className="pp-trust-v">
                      {trust.github_repos_linked ?? 0}
                      <span className="unit">repos</span>
                    </div>
                  </div>
                  <div className="pp-trust-cell">
                    <div className="pp-trust-k">GH correlation</div>
                    <div className="pp-trust-v">
                      {trust.github_correlation_score != null
                        ? Math.round(trust.github_correlation_score * 100)
                        : "—"}
                      <span className="unit">%</span>
                    </div>
                  </div>
                  <div className="pp-trust-cell">
                    <div className="pp-trust-k">Engine</div>
                    <div className="pp-trust-v pp-trust-engine">{trust.engine_version || "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {((data.custom_meta as PageConfig)?.contact_enabled !== false) ? (
        <section className="pp-section pp-section-contact">
          <div className="pp-shell">
            <div className="pp-section-head">
              <div>
                <div className="pp-section-eyebrow">Contact</div>
                <h2 className="pp-section-title">Request a conversation.</h2>
              </div>
              <div className="pp-section-sub">
                Requests are relayed through the platform. The author decides whether to reply. No email is
                exposed either way.
              </div>
            </div>
            <ContactForm slugOrToken={data.slug || data.public_token} />
          </div>
        </section>
      ) : null}

      <footer className="pp-footer">
        <div className="pp-shell">
          <div className="brand">
            Proof of AI Work<span className="brand-dot" />
          </div>
          <div>
            This is a public proof page. Anyone with the link can view it.
            <br />
            Token <span className="pp-footer-token">{data.public_token}</span> · v{trust.page_version ?? 1}
          </div>
        </div>
      </footer>

      <ShareOverlay payload={sharePayload} onClose={() => setSharePayload(null)} />
    </div>
  );
}

function ContactForm({ slugOrToken }: { slugOrToken: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = useMutation({
    mutationFn: () =>
      apiPost(`/p/${slugOrToken}/request`, {
        name: name.trim(),
        email: email.trim(),
        organization: organization.trim() || null,
        message: message.trim() || null,
      }),
    onSuccess: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <div className="pp-contact-thanks">
        <Check size={14} />
        Request sent. The author will see it in their dashboard.
      </div>
    );
  }

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = name.trim().length > 0 && validEmail && !submit.isPending;

  return (
    <form
      className="pp-contact"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) submit.mutate();
      }}
    >
      <div className="pp-contact-row">
        <label>
          <span>Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Jane Doe" required />
        </label>
        <label>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            required
          />
        </label>
      </div>
      <label>
        <span>Organization</span>
        <input value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder="Optional." />
      </label>
      <label>
        <span>Message</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          placeholder="Why you're reaching out. Keep it direct."
        />
      </label>
      {submit.isError ? (
        <div className="pp-contact-error">
          <Mail size={12} />
          {(submit.error as any)?.message || "Could not send the request. Try again."}
        </div>
      ) : null}
      <div className="pp-contact-footer">
        <span className="pp-contact-hint">No email is exposed. Requests are rate-limited per IP.</span>
        <button type="submit" disabled={!canSubmit}>
          {submit.isPending ? <Loader2 size={12} className="spin" /> : <Send size={12} />}
          Send request
        </button>
      </div>
    </form>
  );
}
