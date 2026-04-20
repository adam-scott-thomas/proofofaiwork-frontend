import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Check, MoonStar, SunMedium } from "lucide-react";
import { apiFetch } from "../../lib/api";
import "./Landing.css";

type Archetype = {
  name: string;
  desc: string;
  sig: string;
  color: string;
};

const ARCHETYPES: Archetype[] = [
  { name: "ARCHITECT-DELEGATOR", desc: "Directs outcomes, delegates execution, ships fast.", sig: "73 · 58 · 437×", color: "var(--po-score-hls)" },
  { name: "CRAFTSMAN-ITERATOR", desc: "Refines relentlessly. Rejects the first four drafts on principle.", sig: "81 · 42 · 214×", color: "var(--po-score-cai)" },
  { name: "DELEGATOR-TOURIST", desc: "Accepts the model's first answer. Rarely redirects.", sig: "31 · 88 · 92×", color: "var(--po-score-ael)" },
  { name: "RESEARCH-ARCHITECT", desc: "Builds systems of inquiry. Constraint-first, evidence-hungry.", sig: "79 · 51 · 318×", color: "var(--po-score-hls)" },
  { name: "OPERATOR-CRAFTSMAN", desc: "Ships under pressure. Treats AI like a junior pair.", sig: "66 · 72 · 512×", color: "var(--po-score-cai)" },
  { name: "STRATEGIST-EDITOR", desc: "Writes the brief, edits the output, owns the frame.", sig: "84 · 48 · 229×", color: "var(--po-score-hls)" },
  { name: "TINKERER-EXPLORER", desc: "Follows the model somewhere unexpected and brings back the map.", sig: "57 · 65 · 188×", color: "var(--po-score-ael)" },
  { name: "ARCHITECT-GENERALIST", desc: "Strong across domains. Holds the whole shape in one head.", sig: "76 · 54 · 402×", color: "var(--po-score-cai)" },
];

const STEPS = [
  {
    number: "01",
    title: "Upload your chats.",
    body: "ChatGPT, Claude, Gemini, Grok, Cursor. Full fidelity. We take custody of the file and lock it to your profile.",
    lines: [
      ["chatgpt_2026-04-12.zip", "4.8 MB · 2,941 turns"],
      ["claude_projects.json", "1.2 MB · 612 turns"],
      ["status", "custody confirmed"],
    ],
  },
  {
    number: "02",
    title: "We trace every decision to a specific turn.",
    body: "Parsing, structuring, gating. Each turn becomes an addressable exhibit with a timestamp and a hash. No paraphrase. No summary.",
    lines: [
      ["turn_01HX4C", "rejection · HLS+1"],
      ["turn_01HX7R", "pivot · HLS+1"],
      ["turn_01HX9K", "revision · HLS+1"],
      ["turn_01HXA2", "acceptance · AEL+1"],
    ],
  },
  {
    number: "03",
    title: "We score what actually happened.",
    body: "Three scores. An archetype. A narrative grounded in quoted evidence. Confidence is reported honestly — low-signal work does not get a high-confidence label.",
    lines: [
      ["HLS", "73 / 100"],
      ["AEL", "58 / 100"],
      ["CAI", "437×"],
      ["confidence", "High · 47 turns"],
    ],
  },
  {
    number: "04",
    title: "You publish a page you can stand behind.",
    body: "Your proof page lives at /p/your-slug. Integrity hash verified on every view. Share it with employers, clients, collaborators.",
    lines: [
      ["/ p / adamthomas", "published"],
      ["integrity", "sha256:a3f9…a2f4"],
      ["views", "2,341 · 38 citations"],
      ["directory", "opted-in"],
    ],
  },
];

function useRequestMagicLink() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) =>
      apiFetch("/auth/magic-link", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
  });
}

function HeroForm({
  email,
  setEmail,
  sent,
  setSent,
  requestMagicLink,
  compact = false,
}: {
  email: string;
  setEmail: (value: string) => void;
  sent: boolean;
  setSent: (value: boolean) => void;
  requestMagicLink: ReturnType<typeof useRequestMagicLink>;
  compact?: boolean;
}) {
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    localStorage.removeItem("poaw-auth-redirect");
    try {
      await requestMagicLink.mutateAsync({ email: email.trim() });
      setSent(true);
    } catch {
      // handled by mutation state
    }
  };

  if (sent) {
    return (
      <div className={`po-form-shell${compact ? " is-compact" : ""}`}>
        <div className="po-success">
          <Check size={16} />
          <span>Magic link sent to {email}</span>
        </div>
        <div className="po-form-meta">
          <span>Check your inbox.</span>
          <span className="po-sep">·</span>
          <button type="button" className="po-inline-button" onClick={() => setSent(false)}>
            Wrong address?
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className={`po-form-shell${compact ? " is-compact" : ""}`} onSubmit={submit}>
      <div className="po-form-row">
        <input
          type="email"
          placeholder="you@work.email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          disabled={requestMagicLink.isPending}
          required
        />
        <button type="submit" className="po-btn po-btn-primary" disabled={requestMagicLink.isPending}>
          {requestMagicLink.isPending ? "Sending..." : "Send magic link"}
          <ArrowRight size={16} />
        </button>
      </div>
      {requestMagicLink.isError ? (
        <div className="po-form-error">Failed to send magic link. Try again.</div>
      ) : null}
      <div className="po-form-meta">
        <span>No password.</span>
        <span className="po-sep">·</span>
        <span>Single-use link.</span>
        <span className="po-sep">·</span>
        <span>You stay signed in.</span>
      </div>
    </form>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("poaiw-home-theme");
    return stored === "dark" ? "dark" : "light";
  });
  const [heroEmail, setHeroEmail] = useState("");
  const [heroSent, setHeroSent] = useState(false);
  const [closerEmail, setCloserEmail] = useState("");
  const [closerSent, setCloserSent] = useState(false);
  const requestMagicLink = useRequestMagicLink();

  useEffect(() => {
    localStorage.setItem("poaiw-home-theme", theme);
  }, [theme]);

  const doubled = [...ARCHETYPES, ...ARCHETYPES];

  return (
    <div className="po-home" data-theme={theme}>
      <header className="po-nav">
        <div className="po-wrap po-nav-inner">
          <Link className="po-brand" to="/">
            Proof of AI Work
            <span className="po-brand-dot" />
          </Link>
          <nav className="po-nav-links">
            <a href="#how">From chats to proof</a>
            <a href="#measure">Three scores</a>
            <a href="#sample">See a real proof</a>
            <a href="#pillars">Not a black box</a>
          </nav>
          <div className="po-nav-actions">
            <button
              type="button"
              className="po-theme-toggle"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? <SunMedium size={14} /> : <MoonStar size={14} />}
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <Link className="po-btn po-btn-ghost" to="/sign-in">
              Sign in
            </Link>
            <button type="button" className="po-btn po-btn-primary" onClick={() => navigate("/upload")}>
              Start your proof
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="po-hero">
          <div className="po-wrap po-hero-grid">
            <div>
              <div className="po-eyebrow-row">
                <span className="po-status-dot" />
                <span className="po-eyebrow">Forensic evidence · integrity verified</span>
              </div>

              <h1 className="po-hero-title">
                AI didn&apos;t
                <br />
                do the
                <br />
                work.
                <br />
                <em>You did.</em>
                <br />
                Prove it.
              </h1>

              <p className="po-hero-lede">
                Turn your AI conversations into a verifiable record of how you think, direct, and execute.
                <span>
                  Anyone can use AI. Almost no one can show what they contributed. This shows what&apos;s left of{" "}
                  <em>you</em> in the work.
                </span>
              </p>

              <HeroForm
                email={heroEmail}
                setEmail={setHeroEmail}
                sent={heroSent}
                setSent={setHeroSent}
                requestMagicLink={requestMagicLink}
              />

              <div className="po-hero-stats">
                <div>
                  <strong>1,247</strong>
                  <span>Verified profiles</span>
                </div>
                <div>
                  <strong>18,402</strong>
                  <span>Projects evaluated</span>
                </div>
                <div>
                  <strong>2.4M</strong>
                  <span>Turns analyzed</span>
                </div>
              </div>
            </div>

            <div>
              <div className="po-proof-card">
                <div className="po-proof-chrome">
                  <div className="po-window-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div>
                    <span className="po-faint">proofofaiwork.com</span>
                    <span className="po-url"> / p / adamthomas</span>
                  </div>
                </div>

                <div className="po-proof-body">
                  <div className="po-proof-meta">
                    <span>evaluated 2026-04-18</span>
                    <span className="po-faint">·</span>
                    <span className="po-verified">
                      <Check size={10} />
                      Verified
                    </span>
                  </div>

                  <h2>Adam Scott Thomas</h2>
                  <div className="po-proof-sub">Infrastructure &amp; product · based in Austin, TX</div>

                  <div className="po-proof-verdict">
                    <div className="po-verdict-eyebrow">Archetype</div>
                    <div className="po-verdict-name">ARCHITECT-DELEGATOR</div>
                    <p>
                      Delegates execution and directs outcomes — but doesn&apos;t define constraints early enough to make the AI&apos;s first pass usable.
                      Signal consistent across all 47 conversations evaluated.
                    </p>
                  </div>

                  <div className="po-score-grid">
                    <div>
                      <div className="po-score-number is-hls">73</div>
                      <div className="po-score-label">Human Leadership</div>
                      <div className="po-score-code">HLS</div>
                    </div>
                    <div>
                      <div className="po-score-number is-ael">58</div>
                      <div className="po-score-label">AI Execution</div>
                      <div className="po-score-code">AEL</div>
                    </div>
                    <div>
                      <div className="po-score-number is-cai">
                        437<span>×</span>
                      </div>
                      <div className="po-score-label">Cognitive Amp.</div>
                      <div className="po-score-code">CAI</div>
                    </div>
                  </div>

                  <div className="po-integrity">
                    <span className="po-integrity-badge">
                      <Check size={10} />
                    </span>
                    Hash chain verified · <span className="po-hash">sha256:a3f9e1c2…d8b0a2f4</span>
                  </div>
                </div>

                <div className="po-proof-stamp">EXHIBIT A</div>
              </div>

              <div className="po-proof-footer">
                <div>
                  <span className="po-faint">/ p /</span> adamthomas · <span className="po-faint">evaluated</span> 2026-04-18T14:32:07Z
                </div>
                <div>
                  <span className="po-faint">integrity:</span> sha256:a3f9…a2f4 · <span className="po-faint">confidence:</span> High
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="po-marquee">
          <div className="po-wrap po-section-head">
            <div>
              <div className="po-eyebrow">Eight archetypes, so far</div>
              <h2>
                The evidence adds up to a label.
                <br />
                The label means something.
              </h2>
            </div>
            <p>
              Archetypes aren&apos;t personality types. They&apos;re stable patterns observable across every assessment above the confidence threshold.
            </p>
          </div>
          <div className="po-marquee-track">
            <div className="po-marquee-rail">
              {doubled.map((item, index) => (
                <article key={`${item.name}-${index}`} className="po-arch-card">
                  <div className="po-card-eyebrow">Archetype</div>
                  <h3>{item.name}</h3>
                  <p>{item.desc}</p>
                  <div className="po-arch-sig">
                    <span className="po-arch-dot" style={{ background: item.color }} />
                    <span>{item.sig}</span>
                    <span className="po-faint">·</span>
                    <span>HLS · AEL · CAI</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="po-transform">
          <div className="po-wrap">
            <div className="po-section-copy">
              <div className="po-eyebrow">What you get</div>
              <h2>
                A forensic profile
                <br />
                of your actual work.
              </h2>
              <p>
                Not a summary. Not a vibe. A record backed by evidence — every line traces to a specific turn in your export.
              </p>
            </div>

            <div className="po-transform-grid">
              <div className="po-log-card">
                <div className="po-log-label">Raw export · chatgpt_v2_2026-04-12.zip</div>
                <pre>
                  {`turn_01HX4A · user · 2026-04-12T09:17:22Z
> the index on transactions, is that what's slowing the p95?

turn_01HX4B · assistant · gpt-5.4
  Likely candidates: (1) missing composite index on (user_id, ts); (2) the current index is being scanned not seeked; (3) lock contention on write paths…

turn_01HX4C · user · 2026-04-12T09:18:44Z
> No on (3). The hash chain is non-negotiable for the forensic guarantee. Walk me through (2) — what does the index actually buy us if the table is 12M rows but the per-user query only ever hits ~80?

turn_01HX4D · assistant · gpt-5.4
  Fair. If cardinality on user_id is high and your per-user slice is small, the composite index on (user_id, ts DESC) gives you a seek to the right rows…

turn_01HX4E · user · 2026-04-12T09:20:11Z
> ok draft the migration. no downtime. show me the rollback.`}
                </pre>
              </div>

              <div className="po-arrow">→</div>

              <div className="po-record-card">
                <div className="po-log-label po-success-text">Evidence · four columns</div>
                <div className="po-record-name">The record</div>
                <div className="po-record-sub">47 conversations · 3 projects · evaluated 2026-04-18</div>
                <div className="po-record-archetype">ARCHITECT-DELEGATOR</div>
                <ul>
                  <li>
                    <strong>What you directed.</strong> 4 strategic pivots. 12 rejected drafts.
                  </li>
                  <li>
                    <strong>What you rejected.</strong> Lock-contention thesis. Cache rewrite.
                  </li>
                  <li>
                    <strong>What you changed.</strong> 34 constructive revisions with specifics.
                  </li>
                  <li>
                    <strong>What you shipped.</strong> Lighthouse v2 · hash-chain · SEO rework.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="po-howto" id="how">
          <div className="po-wrap">
            <div className="po-section-copy">
              <div className="po-eyebrow">From conversations → proof</div>
              <h2>
                Four stages.
                <br />
                All visible. No black box.
              </h2>
            </div>
            <div className="po-steps">
              {STEPS.map((step) => (
                <div key={step.number} className="po-step">
                  <div className="po-step-number">
                    {step.number}
                    <span>/04</span>
                  </div>
                  <div className="po-step-copy">
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                  <div className="po-step-visual">
                    {step.lines.map(([left, right]) => (
                      <div key={left} className="po-step-line">
                        <span>{left}</span>
                        <span>{right}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="po-measure" id="measure">
          <div className="po-wrap">
            <div className="po-section-copy">
              <div className="po-eyebrow">Three scores</div>
              <h2>
                Three scores.
                <br />
                No fluff.
              </h2>
            </div>
            <div className="po-measure-grid">
              <article>
                <div className="po-measure-bar is-hls" />
                <div className="po-measure-abbr is-hls">HLS</div>
                <h3>Human Leadership</h3>
                <p>Did you guide the work, or accept it? Counts every rejection, revision, and redirection as evidence of judgment.</p>
                <div className="po-measure-example">12 rejected drafts · 34 constructive revisions · 4 strategic pivots</div>
              </article>
              <article>
                <div className="po-measure-bar is-ael" />
                <div className="po-measure-abbr is-ael">AEL</div>
                <h3>AI Execution Load</h3>
                <p>How much did the AI carry? The mechanical share of drafting, refactoring, and generation. High is not bad — it is leverage.</p>
                <div className="po-measure-example">58% mechanical load · 2,941 turns generated · 11.4k lines drafted</div>
              </article>
              <article>
                <div className="po-measure-bar is-cai" />
                <div className="po-measure-abbr is-cai">CAI</div>
                <h3>Cognitive Amplification</h3>
                <p>How much faster and further did you move? Velocity × complexity against your unassisted baseline.</p>
                <div className="po-measure-example">8d shipped vs. 21d baseline · complexity 87th pctile</div>
              </article>
            </div>
          </div>
        </section>

        <section className="po-sample" id="sample">
          <div className="po-wrap po-sample-head">
            <div>
              <div className="po-eyebrow">See a real proof</div>
              <h2>
                This is what lives at{" "}
                <span className="po-inline-code">proofofaiwork.com/p/adamthomas</span>
              </h2>
            </div>
            <Link className="po-btn po-btn-outline" to="/explore">
              Browse explore
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="po-wrap-wide po-sample-frame">
            <div className="po-sample-chrome">
              <div className="po-window-dots">
                <span />
                <span />
                <span />
              </div>
              <div className="po-address">https://proofofaiwork.com/p/adamthomas</div>
              <div className="po-faint">view 2,341 · 38 citations</div>
            </div>
            <div className="po-sample-body">
              <div>
                <div className="po-card-eyebrow">Archetype · confidence High</div>
                <h2>Adam Scott Thomas</h2>
                <div className="po-proof-sub">Infrastructure &amp; product · based in Austin, TX</div>
                <div className="po-card-eyebrow po-mt">Verdict</div>
                <div className="po-sample-archetype">ARCHITECT-DELEGATOR</div>
                <p className="po-sample-narrative">
                  Delegates execution and directs outcomes. Rejects the model&apos;s first pass 26% of the time — substantially above the ARCHITECT peer median.
                  Gap: does not define constraints early enough to avoid a second-pass round-trip.
                </p>
                <div className="po-evidence-grid">
                  <div>
                    <strong>12</strong>
                    <span>Rejected drafts</span>
                    <p>Above peer median for the ARCHITECT archetype.</p>
                  </div>
                  <div>
                    <strong>4</strong>
                    <span>Strategic pivots</span>
                    <p>Course-corrections based on emerging signal.</p>
                  </div>
                  <div>
                    <strong>87th</strong>
                    <span>Complexity pctile</span>
                    <p>Among verified professionals in validated domains.</p>
                  </div>
                </div>
              </div>
              <div className="po-score-stack">
                <div className="po-score-panel">
                  <div className="po-panel-eyebrow is-hls">HUMAN LEADERSHIP</div>
                  <div className="po-panel-code">HLS · direction, rejection, redirection</div>
                  <div className="po-panel-number is-hls">73/100</div>
                  <p>You control direction and get outcomes.</p>
                </div>
                <div className="po-score-panel">
                  <div className="po-panel-eyebrow is-ael">AI EXECUTION</div>
                  <div className="po-panel-code">AEL · mechanical load carried</div>
                  <div className="po-panel-number is-ael">58/100</div>
                  <p>High leverage on drafting and refactor.</p>
                </div>
                <div className="po-score-panel">
                  <div className="po-panel-eyebrow is-cai">COGNITIVE AMP.</div>
                  <div className="po-panel-code">CAI · velocity × complexity multiplier</div>
                  <div className="po-panel-number is-cai">437×</div>
                  <p>8d shipped vs. 21d unassisted baseline.</p>
                </div>
                <div className="po-integrity po-sample-integrity">Hash chain verified · sha256:a3f9e1c2…d8b0a2f4</div>
              </div>
            </div>
          </div>
        </section>

        <section className="po-pillars" id="pillars">
          <div className="po-wrap po-pillars-head">
            <div>
              <div className="po-eyebrow">Not a black box</div>
              <h2>
                If it can&apos;t be proven,
                <br />
                it doesn&apos;t count.
              </h2>
            </div>
            <p>
              Every observation traces to a timestamped turn in your export. The integrity hash is recomputed at view time. The methodology is versioned and public.
              Disputes are visible, not hidden.
            </p>
          </div>
          <div className="po-wrap po-pillars-grid">
            <article>
              <div className="po-pillar-number">01 / TRACEABLE</div>
              <h3>Every claim links to a turn.</h3>
              <p>Click any signal. See the turn. See the timestamp. See the hash.</p>
            </article>
            <article>
              <div className="po-pillar-number">02 / VERIFIABLE</div>
              <h3>Integrity hash checked on every view.</h3>
              <p>Tamper with the record and the seal breaks. Visibly.</p>
            </article>
            <article>
              <div className="po-pillar-number">03 / VERSIONED</div>
              <h3>Methodology is public and stamped.</h3>
              <p>Your proof page carries the methodology version it was scored under.</p>
            </article>
            <article>
              <div className="po-pillar-number">04 / DISPUTABLE</div>
              <h3>Disputes are visible, not hidden.</h3>
              <p>Challenges attach to the proof page. The record shows both sides.</p>
            </article>
          </div>
        </section>

        <section className="po-closer">
          <div className="po-wrap po-closer-inner">
            <div className="po-eyebrow-row">
              <span className="po-status-dot" />
              <span className="po-eyebrow">This replaces the question</span>
            </div>
            <h2>
              Not: &quot;Did AI do this?&quot;
              <br />
              <em>But: &quot;What did you do?&quot;</em>
            </h2>
            <p>Upload one conversation. Get your verdict. If the evidence doesn&apos;t back up the label, don&apos;t publish it.</p>
            <HeroForm
              email={closerEmail}
              setEmail={setCloserEmail}
              sent={closerSent}
              setSent={setCloserSent}
              requestMagicLink={requestMagicLink}
              compact
            />
            <div className="po-closer-meta">No password · magic-link auth · you stay signed in</div>
          </div>
        </section>
      </main>

      <footer className="po-footer">
        <div className="po-wrap po-footer-top">
          <div className="po-footer-brand">
            <Link className="po-brand" to="/">
              Proof of AI Work
              <span className="po-brand-dot" />
            </Link>
            <p>Forensic evidence that what you did was still work.</p>
          </div>
          <div>
            <div className="po-footer-head">Product</div>
            <a href="#how">How it works</a>
            <Link to="/sign-in">Sign in</Link>
            <a href="#measure">Scoring methodology</a>
            <a href="#pillars">Integrity chain</a>
          </div>
          <div>
            <div className="po-footer-head">Trust</div>
            <a href="#pillars">Evidence standard</a>
            <Link to="/explore">Public explore</Link>
            <span>Security</span>
          </div>
          <div>
            <div className="po-footer-head">Flow</div>
            <Link to="/upload">Start your proof</Link>
            <Link to="/explore">Browse proof</Link>
            <span>Contact</span>
          </div>
        </div>
        <div className="po-wrap po-footer-bar">
          <span>© 2026 Proof of AI Work · Maelstrom LLC</span>
          <span>Build 2026.04.18 · integrity chain live · methodology v2.1</span>
        </div>
      </footer>
    </div>
  );
}
