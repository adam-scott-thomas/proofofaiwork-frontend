import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Loader2,
  Search,
  Sparkles,
  Telescope,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { apiFetch } from "../../lib/api";
import "./Explore.css";

type DirectorySignal = {
  id?: string;
  label?: string;
  strength?: number;
  category?: string;
};

type DirectoryEntry = {
  public_token: string;
  slug: string | null;
  headline: string | null;
  summary: string | null;
  signals: DirectorySignal[];
  url: string;
};

type DirectoryOpen = {
  enabled: true;
  total_published: number;
  entries: DirectoryEntry[];
  signal_clusters: Record<string, number>;
  filters: { signal: string | null; limit: number; offset: number };
};

type DirectoryGated = {
  enabled: false;
  total_published: number;
  threshold: number;
  message?: string;
};

type DirectoryResponse = DirectoryOpen | DirectoryGated;

type PublicObservation = {
  dimension: string | null;
  score: number | null;
  label: string | null;
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
  dimensions_evaluated?: number;
  dimensions_skipped?: number;
};

type PublicProofResponse = {
  public_token: string;
  slug: string | null;
  project_title: string | null;
  project_description: string | null;
  headline: string | null;
  summary: string | null;
  published_at: string | null;
  observations: PublicObservation[];
  trust_panel: TrustPanel;
};

type DetailMetric = {
  key: string;
  metricScore: number | null;
  strongestDimension: string | null;
  strongestScore: number | null;
  sessions: number;
  uploads: number;
  evidenceRich: number;
  evidenceMixed: number;
  evidenceLight: number;
  signalCount: number;
  detail?: PublicProofResponse;
};

function fmtInt(value?: number | null) {
  return (value ?? 0).toLocaleString("en-US");
}

function score100(value?: number | null) {
  if (value == null) return null;
  return value <= 1 ? Math.round(value * 100) : Math.round(value);
}

function scoreLabel(value?: number | null) {
  const scored = score100(value);
  return scored == null ? "—" : `${scored}/100`;
}

function displaySignal(signal: DirectorySignal) {
  return signal.label || signal.id || "signal";
}

function formatDimension(value?: string | null) {
  if (!value) return "No scored dimensions yet";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "Recently published";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently published";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function evidenceBreakdown(trustPanel?: TrustPanel) {
  const evidence = trustPanel?.evidence_classes || {};
  const rich = (evidence.A_plus ?? 0) + (evidence.A ?? 0);
  const mixed = evidence.B ?? 0;
  const light = (evidence.C ?? 0) + (evidence.D ?? 0);
  return { rich, mixed, light };
}

function buildMetric(entry: DirectoryEntry, detail?: PublicProofResponse): DetailMetric {
  const observations = detail?.observations ?? [];
  const scored = observations.filter((item) => item.score != null);
  const metricScore =
    scored.length > 0
      ? Math.round(scored.reduce((sum, item) => sum + (score100(item.score) ?? 0), 0) / scored.length)
      : null;
  const strongest = [...scored].sort((a, b) => (score100(b.score) ?? 0) - (score100(a.score) ?? 0))[0] ?? null;
  const breakdown = evidenceBreakdown(detail?.trust_panel);

  return {
    key: entry.slug ?? entry.public_token,
    metricScore,
    strongestDimension: strongest?.dimension ?? null,
    strongestScore: strongest?.score ?? null,
    sessions: detail?.trust_panel?.sample_size?.sessions ?? 0,
    uploads: detail?.trust_panel?.sample_size?.uploads ?? 0,
    evidenceRich: breakdown.rich,
    evidenceMixed: breakdown.mixed,
    evidenceLight: breakdown.light,
    signalCount: entry.signals?.length ?? 0,
    detail,
  };
}

function buildAtlas(signalClusters: Record<string, number>) {
  const total = Object.values(signalClusters).reduce((sum, count) => sum + count, 0);
  return Object.entries(signalClusters)
    .map(([signal, count]) => ({
      signal,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function boardItems(entries: DirectoryEntry[], metrics: Record<string, DetailMetric>) {
  const withMetrics = entries
    .map((entry) => ({ entry, metric: metrics[entry.slug ?? entry.public_token] }))
    .filter((item) => item.metric);

  return {
    observed: [...withMetrics]
      .sort((a, b) => (b.metric?.sessions ?? 0) - (a.metric?.sessions ?? 0))
      .slice(0, 5),
    evidence: [...withMetrics]
      .sort((a, b) => (b.metric?.evidenceRich ?? 0) - (a.metric?.evidenceRich ?? 0))
      .slice(0, 5),
    signalDense: [...withMetrics]
      .sort((a, b) => (b.metric?.signalCount ?? 0) - (a.metric?.signalCount ?? 0))
      .slice(0, 5),
  };
}

export function DirectoryRedirect() {
  return <Navigate to="/explore" replace />;
}

export default function Explore() {
  const [signalFilter, setSignalFilter] = useState("");
  const [query, setQuery] = useState("");

  const listQuery = useQuery<DirectoryResponse>({
    queryKey: ["directory-public", signalFilter],
    queryFn: () =>
      apiFetch<DirectoryResponse>(`/directory${signalFilter ? `?signal=${encodeURIComponent(signalFilter)}` : ""}`),
  });

  const data = listQuery.data;
  const entries = data && data.enabled ? data.entries : [];
  const signalClusters = data && data.enabled ? data.signal_clusters : {};
  const atlas = useMemo(() => buildAtlas(signalClusters), [signalClusters]);

  const filtered = useMemo(() => {
    if (!query.trim()) return entries;
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const haystack = [
        entry.headline,
        entry.summary,
        ...(entry.signals || []).map((signal) => displaySignal(signal)),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [entries, query]);

  const visibleEntries = filtered.slice(0, 12);

  const detailQueries = useQueries({
    queries: visibleEntries.map((entry) => ({
      queryKey: ["public-proof-summary", entry.slug ?? entry.public_token],
      queryFn: () => apiFetch<PublicProofResponse>(entry.url),
      staleTime: 60_000,
    })),
  });

  const metricsByEntry = useMemo(() => {
    const map: Record<string, DetailMetric> = {};
    visibleEntries.forEach((entry, index) => {
      const key = entry.slug ?? entry.public_token;
      map[key] = buildMetric(entry, detailQueries[index]?.data);
    });
    return map;
  }, [visibleEntries, detailQueries]);

  const featured = visibleEntries[0] ?? null;
  const featuredMetric = featured ? metricsByEntry[featured.slug ?? featured.public_token] : null;
  const boards = useMemo(() => boardItems(visibleEntries, metricsByEntry), [visibleEntries, metricsByEntry]);

  const aggregate = useMemo(() => {
    const visibleMetrics = Object.values(metricsByEntry);
    const observationMean =
      visibleMetrics.filter((metric) => metric.metricScore != null).length > 0
        ? Math.round(
            visibleMetrics
              .filter((metric) => metric.metricScore != null)
              .reduce((sum, metric) => sum + (metric.metricScore ?? 0), 0) /
              visibleMetrics.filter((metric) => metric.metricScore != null).length,
          )
        : null;
    const sessions = visibleMetrics.reduce((sum, metric) => sum + metric.sessions, 0);
    const uploads = visibleMetrics.reduce((sum, metric) => sum + metric.uploads, 0);
    return {
      observationMean,
      sessions,
      uploads,
      signalsTracked: atlas.length,
    };
  }, [metricsByEntry, atlas.length]);

  return (
    <div className="explore-page">
      <header className="explore-hero">
        <div className="explore-shell">
          <div className="explore-nav">
            <Link className="explore-brand" to="/">
              Proof of AI Work
              <span className="explore-brand-dot" />
            </Link>
            <div className="explore-nav-links">
              <span className="explore-nav-link is-active">Explore</span>
              <Link className="explore-nav-link" to="/upload">Start your proof</Link>
              <Link className="explore-nav-link" to="/sign-in">Sign in</Link>
            </div>
          </div>

          <div className="explore-hero-grid">
            <div>
              <div className="explore-eyebrow">
                <Telescope className="h-3.5 w-3.5" />
                Public explore · proof pages you can actually inspect
              </div>
              <h1 className="explore-title">
                The public record of
                <br />
                people shipping work
                <br />
                <em>with evidence attached.</em>
              </h1>
              <p className="explore-subtitle">
                Browse published proof pages, scan recurring work patterns, and open the underlying public dossiers.
                This phase uses live public proof data already in the system: headlines, signals, observations, and trust panels.
              </p>

              <div className="explore-search-row">
                <div className="explore-search">
                  <Search className="explore-search-icon" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search proof pages, summaries, signals..."
                  />
                </div>
                {featured ? (
                  <Link to={featured.url} className="explore-primary-link">
                    Open featured proof <ArrowUpRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>

              <div className="explore-chips">
                {atlas.slice(0, 6).map((item) => (
                  <button
                    key={item.signal}
                    type="button"
                    onClick={() => setSignalFilter(signalFilter === item.signal ? "" : item.signal)}
                    className={`explore-chip ${signalFilter === item.signal ? "is-active" : ""}`}
                  >
                    {item.signal}
                    <span>{item.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <Card className="explore-stat-panel">
              <div className="explore-stat-head">
                <span>Explore index</span>
                <span className="explore-live-pill">LIVE</span>
              </div>
              <div className="explore-stat-list">
                <StatRow label="published proofs" value={fmtInt(data && data.enabled ? data.total_published : data?.total_published ?? 0)} />
                <StatRow label="signals tracked" value={fmtInt(aggregate.signalsTracked)} />
                <StatRow label="sessions surfaced" value={fmtInt(aggregate.sessions)} />
                <StatRow label="uploads surfaced" value={fmtInt(aggregate.uploads)} />
                <StatRow label="observation mean" value={aggregate.observationMean != null ? `${aggregate.observationMean}/100` : "pending"} />
              </div>
            </Card>
          </div>
        </div>
      </header>

      <main className="explore-main">
        <div className="explore-shell">
          {listQuery.isLoading ? (
            <div className="explore-loading">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading explore…
            </div>
          ) : !data ? (
            <Card className="explore-empty">Could not reach the public explore feed.</Card>
          ) : data.enabled === false ? (
            <ExploreGated data={data} />
          ) : (
            <>
              {featured ? (
                <section className="explore-feature">
                  <div className="explore-feature-main">
                    <div className="explore-feature-meta">
                      <span>Featured dossier</span>
                      <span>{formatDate(featuredMetric?.detail?.published_at)}</span>
                    </div>
                    <div className="explore-feature-score">
                      <div className="explore-feature-score-label">Observed mean</div>
                      <div className="explore-feature-score-value">
                        {featuredMetric?.metricScore != null ? featuredMetric.metricScore : "—"}
                        <span>/100</span>
                      </div>
                    </div>
                    <h2>{featured.headline || featuredMetric?.detail?.project_title || "Untitled proof page"}</h2>
                    <p>
                      {featured.summary ||
                        featuredMetric?.detail?.project_description ||
                        "A published proof page with visible observations, excerpts, and trust metadata."}
                    </p>
                    <div className="explore-feature-badges">
                      <MetaBadge label="strongest dimension" value={formatDimension(featuredMetric?.strongestDimension)} />
                      <MetaBadge label="sessions" value={fmtInt(featuredMetric?.sessions)} />
                      <MetaBadge label="uploads" value={fmtInt(featuredMetric?.uploads)} />
                    </div>
                    <div className="explore-signal-row">
                      {(featured.signals || []).slice(0, 6).map((signal, index) => (
                        <span key={`${displaySignal(signal)}-${index}`} className="explore-signal-pill">
                          {displaySignal(signal)}
                        </span>
                      ))}
                    </div>
                    <Link to={featured.url} className="explore-inline-link">
                      Open proof page <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="explore-feature-side">
                    <div className="explore-side-card">
                      <div className="explore-side-title">Trust panel snapshot</div>
                      <MetricLine label="rich evidence" value={fmtInt(featuredMetric?.evidenceRich)} />
                      <MetricLine label="mixed evidence" value={fmtInt(featuredMetric?.evidenceMixed)} />
                      <MetricLine label="light evidence" value={fmtInt(featuredMetric?.evidenceLight)} />
                      <MetricLine
                        label="top observed dimension"
                        value={featuredMetric?.strongestScore != null ? scoreLabel(featuredMetric.strongestScore) : "—"}
                      />
                    </div>
                    <div className="explore-side-card">
                      <div className="explore-side-title">Signal atlas</div>
                      <div className="explore-atlas-list">
                        {atlas.slice(0, 5).map((item) => (
                          <div key={item.signal} className="explore-atlas-row">
                            <span>{item.signal}</span>
                            <div className="explore-atlas-bar">
                              <div style={{ width: `${Math.max(item.pct, 8)}%` }} />
                            </div>
                            <strong>{item.count}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="explore-boards">
                <Board
                  title="Most observed"
                  subtitle="Sessions surfaced from the public proof payloads"
                  rows={boards.observed}
                  value={(item) => fmtInt(item.metric?.sessions)}
                />
                <Board
                  title="Most evidence-rich"
                  subtitle="Highest count of A/A+ uploads in visible proofs"
                  rows={boards.evidence}
                  value={(item) => fmtInt(item.metric?.evidenceRich)}
                />
                <Board
                  title="Most signal-dense"
                  subtitle="Profiles broadcasting the widest public signal mix"
                  rows={boards.signalDense}
                  value={(item) => fmtInt(item.metric?.signalCount)}
                />
              </section>

              <section className="explore-surprise">
                <div className="explore-section-head">
                  <div>
                    <div className="explore-section-label">Creative extra</div>
                    <h3>Signal weather</h3>
                  </div>
                  <p>
                    A quick read on what kinds of work patterns are surfacing in the public record right now.
                  </p>
                </div>
                <div className="explore-weather-grid">
                  {atlas.slice(0, 8).map((item, index) => (
                    <div key={item.signal} className={`explore-weather-card tone-${(index % 4) + 1}`}>
                      <div className="explore-weather-count">{item.count}</div>
                      <div className="explore-weather-label">{item.signal}</div>
                      <div className="explore-weather-pct">{item.pct}% of tagged public proofs</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="explore-grid-section">
                <div className="explore-section-head">
                  <div>
                    <div className="explore-section-label">Browse dossiers</div>
                    <h3>{filtered.length} visible proof page{filtered.length === 1 ? "" : "s"}</h3>
                  </div>
                  <p>
                    Public proof pages published with public visibility are listed here automatically. Open any card to inspect the underlying proof.
                  </p>
                </div>
                {visibleEntries.length === 0 ? (
                  <Card className="explore-empty">
                    No public proof pages match the current search or signal filter.
                  </Card>
                ) : (
                  <div className="explore-grid">
                    {visibleEntries.map((entry) => {
                      const key = entry.slug ?? entry.public_token;
                      const metric = metricsByEntry[key];
                      return (
                        <Link key={key} to={entry.url} className="explore-card-link">
                          <Card className="explore-card">
                            <div className="explore-card-head">
                              <div>
                                <div className="explore-card-label">public proof</div>
                                <h4>{entry.headline || metric?.detail?.project_title || "Untitled proof page"}</h4>
                              </div>
                              <div className="explore-card-score">
                                {metric?.metricScore != null ? metric.metricScore : "—"}
                                <span>/100</span>
                              </div>
                            </div>
                            <p className="explore-card-copy">
                              {entry.summary ||
                                metric?.detail?.project_description ||
                                "A public record of work patterns, evidence classes, and visible observations."}
                            </p>
                            <div className="explore-card-meta">
                              <span>{formatDimension(metric?.strongestDimension)}</span>
                              <span>{fmtInt(metric?.sessions)} sessions</span>
                              <span>{fmtInt(metric?.uploads)} uploads</span>
                            </div>
                            <div className="explore-card-signals">
                              {(entry.signals || []).slice(0, 4).map((signal, index) => (
                                <span key={`${displaySignal(signal)}-${index}`}>{displaySignal(signal)}</span>
                              ))}
                            </div>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="explore-stat-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="explore-metric-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MetaBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="explore-meta-badge">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Board({
  title,
  subtitle,
  rows,
  value,
}: {
  title: string;
  subtitle: string;
  rows: Array<{ entry: DirectoryEntry; metric?: DetailMetric }>;
  value: (item: { entry: DirectoryEntry; metric?: DetailMetric }) => string;
}) {
  return (
    <Card className="explore-board">
      <div className="explore-board-head">
        <div>
          <div className="explore-board-label">Board</div>
          <h3>{title}</h3>
        </div>
      </div>
      <p className="explore-board-sub">{subtitle}</p>
      <div className="explore-board-list">
        {rows.map((item, index) => (
          <Link key={item.entry.slug ?? item.entry.public_token} to={item.entry.url} className="explore-board-row">
            <span className="explore-rank">{String(index + 1).padStart(2, "0")}</span>
            <div className="explore-board-copy">
              <strong>{item.entry.headline || item.metric?.detail?.project_title || "Untitled proof page"}</strong>
              <span>{formatDimension(item.metric?.strongestDimension)}</span>
            </div>
            <div className="explore-board-value">{value(item)}</div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function ExploreGated({ data }: { data: DirectoryGated }) {
  const pct = Math.min(100, Math.round((data.total_published / Math.max(data.threshold, 1)) * 100));
  return (
    <Card className="explore-gated">
      <div className="explore-gated-eyebrow">
        <Sparkles className="h-4 w-4" />
        Explore opens soon
      </div>
      <h2>The public explore page is still gated.</h2>
      <p>
        {data.message ||
          `The public browse experience opens once enough proof pages are published to make the feed worth reading.`}
      </p>
      <div className="explore-gated-progress">
        <div className="explore-gated-numbers">
          <strong>{data.total_published}</strong>
          <span>of {data.threshold} published proof pages</span>
        </div>
        <div className="explore-gated-bar">
          <div style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="explore-gated-links">
        <Link to="/upload">Start your proof</Link>
        <Link to="/sign-in">Sign in</Link>
      </div>
    </Card>
  );
}
