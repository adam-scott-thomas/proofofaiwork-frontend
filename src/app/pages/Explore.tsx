import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
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
import Seo from "../components/Seo";
import "./Explore.css";

type ExploreSignal = {
  id?: string | null;
  label?: string | null;
  strength?: number | null;
  category?: string | null;
};

type ExploreArchetype = {
  id: string;
  label: string;
  summary: string;
};

type ExploreScores = {
  hls?: number | null;
  ael?: number | null;
  cai?: number | null;
};

type ExploreSampleSize = {
  sessions?: number;
  uploads?: number;
};

type ExploreEvidenceClasses = {
  A_plus?: number;
  A?: number;
  B?: number;
  C?: number;
  D?: number;
};

type ExploreEntry = {
  public_token: string;
  slug: string | null;
  url: string;
  headline: string | null;
  summary: string | null;
  published_at: string | null;
  display_name: string | null;
  avatar_url: string | null;
  overall_score: number | null;
  archetype: ExploreArchetype | null;
  scores: ExploreScores;
  confidence: string | null;
  sample_size: ExploreSampleSize;
  evidence_classes: ExploreEvidenceClasses;
  signals: ExploreSignal[];
};

type ExploreOpen = {
  enabled: true;
  total_published: number;
  threshold: number;
  entries: ExploreEntry[];
  signal_clusters: Record<string, number>;
  archetype_counts: Record<string, number>;
  filters: { signal: string | null; limit: number; offset: number };
};

type ExploreGatedState = {
  enabled: false;
  total_published: number;
  threshold: number;
  message?: string;
};

type ExploreResponse = ExploreOpen | ExploreGatedState;

type LeaderboardRow = {
  slug: string | null;
  public_token: string;
  url: string;
  headline: string | null;
  display_name: string | null;
  archetype: string | null;
  overall_score?: number | null;
  score?: number | null;
};

type ExploreLeaderboard = {
  overall: LeaderboardRow[];
  hls: LeaderboardRow[];
  ael: LeaderboardRow[];
  cai: LeaderboardRow[];
};

type ExploreTopSignal = {
  id: string;
  label: string;
  count: number;
};

type ExploreRecentPublish = {
  slug: string | null;
  public_token: string;
  headline: string | null;
  display_name: string | null;
  published_at: string | null;
  url: string;
};

type ExploreInsights = {
  archetype_counts: Record<string, number>;
  score_bands: Record<string, number>;
  top_signals: ExploreTopSignal[];
  recent_publishes: ExploreRecentPublish[];
};

function fmtInt(value?: number | null) {
  return (value ?? 0).toLocaleString("en-US");
}

function score100(value?: number | null) {
  return value == null ? "—" : `${Math.round(value)}/100`;
}

function rawScore(value?: number | null) {
  return value == null ? "—" : fmtInt(value);
}

function displayTitle(entry: ExploreEntry | ExploreRecentPublish | LeaderboardRow) {
  return entry.display_name || entry.headline || "Untitled public proof";
}

function formatDate(value?: string | null) {
  if (!value) return "Recently published";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently published";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function signalName(signal: ExploreSignal) {
  return signal.label || signal.id || "signal";
}

function sortSignalAtlas(signalClusters: Record<string, number>) {
  const total = Object.values(signalClusters).reduce((sum, count) => sum + count, 0);
  return Object.entries(signalClusters)
    .map(([signal, count]) => ({
      signal,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function evidenceSummary(evidence: ExploreEvidenceClasses) {
  return {
    rich: (evidence.A_plus ?? 0) + (evidence.A ?? 0),
    mixed: evidence.B ?? 0,
    light: (evidence.C ?? 0) + (evidence.D ?? 0),
  };
}

function scoreBandCards(scoreBands: Record<string, number>) {
  return [
    { label: "90-100", count: scoreBands["90_100"] ?? 0, note: "elite public dossiers" },
    { label: "80-89", count: scoreBands["80_89"] ?? 0, note: "strong command at scale" },
    { label: "70-79", count: scoreBands["70_79"] ?? 0, note: "credible operating range" },
    { label: "Under 70", count: scoreBands["under_70"] ?? 0, note: "emerging proof records" },
  ];
}

export function DirectoryRedirect() {
  return <Navigate to="/explore" replace />;
}

export default function Explore() {
  const [signalFilter, setSignalFilter] = useState("");
  const [query, setQuery] = useState("");

  const listQuery = useQuery<ExploreResponse>({
    queryKey: ["explore-public", signalFilter],
    queryFn: () =>
      apiFetch<ExploreResponse>(`/directory/explore${signalFilter ? `?signal=${encodeURIComponent(signalFilter)}` : ""}`),
  });

  const isEnabled = listQuery.data?.enabled === true;

  const leaderboardQuery = useQuery<ExploreLeaderboard>({
    queryKey: ["explore-leaderboard"],
    queryFn: () => apiFetch<ExploreLeaderboard>("/directory/explore/leaderboard"),
    enabled: isEnabled,
  });

  const insightsQuery = useQuery<ExploreInsights>({
    queryKey: ["explore-insights"],
    queryFn: () => apiFetch<ExploreInsights>("/directory/explore/insights"),
    enabled: isEnabled,
  });

  const data = listQuery.data;
  const openData = data && data.enabled ? data : null;
  const entries = openData?.entries ?? [];
  const atlas = useMemo(() => sortSignalAtlas(openData?.signal_clusters ?? {}), [openData]);
  const archetypeCounts = openData?.archetype_counts ?? {};

  const filtered = useMemo(() => {
    if (!query.trim()) return entries;
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const haystack = [
        entry.display_name,
        entry.headline,
        entry.summary,
        entry.archetype?.label,
        ...entry.signals.map((signal) => signalName(signal)),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [entries, query]);

  const featured = filtered[0] ?? null;
  const topSignals = insightsQuery.data?.top_signals ?? [];
  const recentPublishes = insightsQuery.data?.recent_publishes ?? [];
  const scoreBands = scoreBandCards(insightsQuery.data?.score_bands ?? {});
  const archetypeAtlas = Object.entries(archetypeCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const aggregate = useMemo(() => {
    const scored = filtered.filter((entry) => entry.overall_score != null);
    const medianScore = scored.length > 0
      ? [...scored]
          .map((entry) => entry.overall_score ?? 0)
          .sort((a, b) => a - b)[Math.floor(scored.length / 2)]
      : null;
    const totalSessions = filtered.reduce((sum, entry) => sum + (entry.sample_size.sessions ?? 0), 0);
    const totalUploads = filtered.reduce((sum, entry) => sum + (entry.sample_size.uploads ?? 0), 0);
    return {
      medianScore,
      totalSessions,
      totalUploads,
      archetypes: Object.keys(archetypeCounts).length,
    };
  }, [filtered, archetypeCounts]);

  return (
    <div className="explore-page">
      <Seo
        title="Explore Verified AI Work | Public Proof Pages and AI Portfolios"
        description="Browse public proof pages, AI work profiles, and verified portfolios. See how people document AI-assisted work with evidence, scores, and public proof."
        canonical="https://proofofaiwork.com/explore"
      />
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
                Public explore · published work profiles you can actually inspect
              </div>
              <h1 className="explore-title">
                The public record of
                <br />
                people shipping with
                <br />
                <em>visible signal.</em>
              </h1>
              <p className="explore-subtitle">
                Browse published public proofs, scan archetypes, compare HLS, AEL, and CAI, and open the underlying dossier. This is the live explore feed backed by public proof pages and completed work profiles.
              </p>

              <div className="explore-search-row">
                <div className="explore-search">
                  <Search className="explore-search-icon" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search people, proof headlines, archetypes, signals..."
                  />
                </div>
                {featured ? (
                  <Link to={featured.url} className="explore-primary-link">
                    Open featured dossier <ArrowUpRight className="h-4 w-4" />
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
                <StatRow label="published proofs" value={fmtInt(openData?.total_published ?? data?.total_published ?? 0)} />
                <StatRow label="median score" value={aggregate.medianScore != null ? score100(aggregate.medianScore) : "pending"} />
                <StatRow label="archetypes visible" value={fmtInt(aggregate.archetypes)} />
                <StatRow label="sessions surfaced" value={fmtInt(aggregate.totalSessions)} />
                <StatRow label="uploads surfaced" value={fmtInt(aggregate.totalUploads)} />
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
                      <span>{formatDate(featured.published_at)}</span>
                    </div>
                    <div className="explore-feature-score">
                      <div className="explore-feature-score-label">Overall score</div>
                      <div className="explore-feature-score-value">
                        {featured.overall_score ?? "—"}
                        <span>/100</span>
                      </div>
                    </div>
                    <h2>{displayTitle(featured)}</h2>
                    <p>
                      {featured.summary || featured.archetype?.summary || "A published proof page with a visible public work profile behind it."}
                    </p>
                    <div className="explore-feature-badges">
                      <MetaBadge label="archetype" value={featured.archetype?.label || "Pending"} />
                      <MetaBadge label="HLS" value={score100(featured.scores.hls)} />
                      <MetaBadge label="AEL" value={score100(featured.scores.ael)} />
                    </div>
                    <div className="explore-signal-row">
                      {featured.signals.slice(0, 6).map((signal, index) => (
                        <span key={`${signalName(signal)}-${index}`} className="explore-signal-pill">
                          {signalName(signal)}
                        </span>
                      ))}
                    </div>
                    <Link to={featured.url} className="explore-inline-link">
                      Open proof page <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="explore-feature-side">
                    <div className="explore-side-card">
                      <div className="explore-side-title">Score profile</div>
                      <MetricLine label="HLS" value={score100(featured.scores.hls)} />
                      <MetricLine label="AEL" value={score100(featured.scores.ael)} />
                      <MetricLine label="CAI" value={rawScore(featured.scores.cai)} />
                      <MetricLine label="confidence" value={featured.confidence || "n/a"} />
                    </div>
                    <div className="explore-side-card">
                      <div className="explore-side-title">Proof density</div>
                      <MetricLine label="sessions" value={fmtInt(featured.sample_size.sessions)} />
                      <MetricLine label="uploads" value={fmtInt(featured.sample_size.uploads)} />
                      <MetricLine label="rich evidence" value={fmtInt(evidenceSummary(featured.evidence_classes).rich)} />
                      <MetricLine label="light evidence" value={fmtInt(evidenceSummary(featured.evidence_classes).light)} />
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="explore-boards">
                <Board
                  title="Overall leaders"
                  subtitle="Highest public overall scores in the current explore feed"
                  rows={leaderboardQuery.data?.overall ?? []}
                  value={(row) => score100(row.overall_score)}
                />
                <Board
                  title="HLS leaders"
                  subtitle="Strongest human leadership scores"
                  rows={leaderboardQuery.data?.hls ?? []}
                  value={(row) => score100(row.score)}
                />
                <Board
                  title="AEL leaders"
                  subtitle="Highest AI execution load"
                  rows={leaderboardQuery.data?.ael ?? []}
                  value={(row) => score100(row.score)}
                />
                <Board
                  title="CAI leaders"
                  subtitle="Most amplified capability index"
                  rows={leaderboardQuery.data?.cai ?? []}
                  value={(row) => rawScore(row.score)}
                />
              </section>

              <section className="explore-surprise">
                <div className="explore-section-head">
                  <div>
                    <div className="explore-section-label">Field notes</div>
                    <h3>Archetype census and signal pulse</h3>
                  </div>
                  <p>
                    A live read on who is publishing, what patterns dominate, and where the strongest public proof bands are clustering right now.
                  </p>
                </div>
                <div className="explore-weather-grid">
                  {scoreBands.map((band, index) => (
                    <div key={band.label} className={`explore-weather-card tone-${(index % 4) + 1}`}>
                      <div className="explore-weather-count">{band.count}</div>
                      <div className="explore-weather-label">{band.label}</div>
                      <div className="explore-weather-pct">{band.note}</div>
                    </div>
                  ))}
                </div>
                <div className="explore-feature" style={{ marginTop: 18 }}>
                  <div className="explore-side-card">
                    <div className="explore-side-title">Archetype census</div>
                    <div className="explore-atlas-list">
                      {archetypeAtlas.slice(0, 8).map((item) => {
                        const total = Math.max(filtered.length, 1);
                        const pct = Math.round((item.count / total) * 100);
                        return (
                          <div key={item.label} className="explore-atlas-row">
                            <span>{item.label}</span>
                            <div className="explore-atlas-bar">
                              <div style={{ width: `${Math.max(pct, 8)}%` }} />
                            </div>
                            <strong>{item.count}</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="explore-feature-side">
                    <div className="explore-side-card">
                      <div className="explore-side-title">Signal pulse</div>
                      <div className="explore-atlas-list">
                        {topSignals.slice(0, 5).map((signal) => (
                          <div key={signal.id} className="explore-atlas-row">
                            <span>{signal.label}</span>
                            <div className="explore-atlas-bar">
                              <div style={{ width: `${Math.min(signal.count * 10, 100)}%` }} />
                            </div>
                            <strong>{signal.count}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="explore-side-card">
                      <div className="explore-side-title">Recently published</div>
                      <div className="explore-board-list">
                        {recentPublishes.slice(0, 4).map((entry) => (
                          <Link key={entry.public_token} to={entry.url} className="explore-board-row">
                            <span className="explore-rank">{formatDate(entry.published_at)}</span>
                            <div className="explore-board-copy">
                              <strong>{displayTitle(entry)}</strong>
                              <span>{entry.headline || "Public proof page"}</span>
                            </div>
                            <span className="explore-board-value">
                              <ArrowUpRight className="h-4 w-4" />
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="explore-grid-section">
                <div className="explore-section-head">
                  <div>
                    <div className="explore-section-label">Browse dossiers</div>
                    <h3>{filtered.length} public proof page{filtered.length === 1 ? "" : "s"}</h3>
                  </div>
                  <p>
                    Every card is a published public proof. Open any one to inspect the underlying record, evidence mix, and public-facing work profile.
                  </p>
                </div>
                {filtered.length === 0 ? (
                  <Card className="explore-empty">No public proof pages match the current search or signal filter.</Card>
                ) : (
                  <div className="explore-grid">
                    {filtered.slice(0, 12).map((entry) => {
                      const evidence = evidenceSummary(entry.evidence_classes);
                      return (
                        <Link key={entry.public_token} to={entry.url} className="explore-card-link">
                          <Card className="explore-card">
                            <div className="explore-card-head">
                              <div>
                                <div className="explore-card-label">{entry.archetype?.label || "Public proof"}</div>
                                <h4>{displayTitle(entry)}</h4>
                              </div>
                              <div className="explore-card-score">
                                {entry.overall_score ?? "—"}
                                <span>/100</span>
                              </div>
                            </div>
                            <p className="explore-card-copy">
                              {entry.summary || entry.archetype?.summary || "Public proof page with visible signals and score structure."}
                            </p>
                            <div className="explore-card-meta">
                              <span>HLS {score100(entry.scores.hls)}</span>
                              <span>AEL {score100(entry.scores.ael)}</span>
                              <span>CAI {rawScore(entry.scores.cai)}</span>
                              <span>{fmtInt(entry.sample_size.sessions)} sessions</span>
                              <span>{fmtInt(entry.sample_size.uploads)} uploads</span>
                              <span>{fmtInt(evidence.rich)} rich evidence</span>
                            </div>
                            <div className="explore-card-signals">
                              {entry.signals.slice(0, 4).map((signal, index) => (
                                <span key={`${signalName(signal)}-${index}`}>{signalName(signal)}</span>
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
  rows: LeaderboardRow[];
  value: (row: LeaderboardRow) => string;
}) {
  return (
    <Card className="explore-board">
      <div className="explore-board-head">
        <div>
          <div className="explore-board-label">Leaderboard</div>
          <h3>{title}</h3>
        </div>
        <div className="explore-board-sub">{subtitle}</div>
      </div>
      <div className="explore-board-list">
        {rows.map((row, index) => (
          <Link key={`${row.public_token}-${title}`} to={row.url} className="explore-board-row">
            <span className="explore-rank">#{index + 1}</span>
            <div className="explore-board-copy">
              <strong>{displayTitle(row)}</strong>
              <span>{row.archetype || row.headline || "Public proof"}</span>
            </div>
            <span className="explore-board-value">{value(row)}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function ExploreGated({ data }: { data: ExploreGatedState }) {
  const progress = data.threshold > 0 ? Math.min(100, Math.round((data.total_published / data.threshold) * 100)) : 0;

  return (
    <Card className="explore-gated">
      <div className="explore-gated-eyebrow">
        <Sparkles className="h-4 w-4" />
        Explore opens publicly at critical mass
      </div>
      <h2>The public record is still gathering density.</h2>
      <p>
        {data.message || "Explore unlocks once enough public proofs have been published to make the feed worth browsing."}
      </p>
      <div className="explore-gated-progress">
        <div className="explore-gated-numbers">
          <strong>{fmtInt(data.total_published)}</strong>
          <span>of {fmtInt(data.threshold)} public proofs needed</span>
        </div>
        <div className="explore-gated-bar">
          <div style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="explore-gated-links">
        <Link to="/upload">Publish a proof</Link>
        <Link to="/sign-in">Sign in</Link>
      </div>
    </Card>
  );
}
