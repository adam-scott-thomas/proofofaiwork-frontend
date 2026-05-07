import { Check, Copy, ExternalLink, FileWarning, Hash, Loader2, Printer, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArtifactGrid, EditorialSection, LedgerPanel, VerificationBlock } from "../components/EditorialPrimitives";
import ProofCard from "../components/ProofCard";
import { roleLeveragePages } from "../data/seoExpansion";
import { archetypes, glossarySeedConcepts } from "../data/taxonomy";
import { useSeo } from "../hooks/useSeo";
import { APP_URL, siteMetadata } from "../lib/constants";
import { fetchPublicDossier, fetchPublicReceipt, type PublicDossier, type PublicReceipt } from "../lib/publicReceipts";

function score(value?: number) {
  return value == null ? "--" : String(value);
}

function ledger(value?: number) {
  return value == null ? "--" : value.toLocaleString("en-US");
}

function multiplier(value?: number) {
  return value == null ? "--" : `${value}x`;
}

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function proofDescription(receipt?: PublicReceipt | null) {
  if (!receipt) return "Public ProofOfAIWork receipt.";
  return (
    receipt.summary ??
    `Verified AI work receipt for ${receipt.title}, showing ownership, execution, leverage, and public-safe evidence.`
  );
}

function copyText(receipt: PublicReceipt, url: string) {
  return `${receipt.title}\n${proofDescription(receipt)}\n${url}`;
}

function PublicProofDossier({
  dossier,
  canonical,
  copied,
  onCopy,
}: {
  dossier: PublicDossier;
  canonical: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const featured = dossier.featured_proof ?? dossier.public_proofs[0];
  const totals = dossier.evidence_totals ?? {};
  const totalProofs = dossier.public_proofs.length;

  return (
    <article className="proof-dossier">
      <div className="proof-utility">
        <span>Personal capability dossier</span>
        <span>{dossier.handle}</span>
        <button type="button" onClick={onCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button type="button" onClick={() => window.print()}>
          <Printer size={14} />
          Print
        </button>
      </div>

      <header className="proof-masthead">
        <span>PROOFOFAIWORK</span>
        <span>Proof of work, not proof of person</span>
      </header>

      <section className="proof-dossier-hero">
        <div className="proof-identity-block">
          <p className="eyebrow">Operator archive</p>
          <h1>{dossier.operator_name}</h1>
          <p className="proof-title-line">Verified AI-work capability dossier</p>
          <p className="proof-narrative">{dossier.description}</p>
          <div className="proof-actions">
            <button className="button primary" type="button" onClick={onCopy}>
              {copied ? <Check size={18} /> : <Share2 size={18} />}
              {copied ? "Copied" : "Share Dossier"}
            </button>
            <a className="button secondary" href={APP_URL}>
              Create proof
              <ExternalLink size={18} />
            </a>
          </div>
        </div>

        <div className="proof-score-event">
          <p className="eyebrow">Published Artifacts</p>
          <strong>{totalProofs}</strong>
          <div className="proof-score-context">
            <span>Canonical {canonical.replace(/^https?:\/\//, "")}</span>
            {featured?.archetype_label ? <span>Featured pattern {featured.archetype_label}</span> : null}
            <span>Send to employers, partners, clients, and reviewers</span>
          </div>
        </div>
      </section>

      <section className="proof-dossier-body">
        <main className="proof-main-column">
          <EditorialSection kicker="01 · Featured proof" title={featured?.title ?? "Published work archive"}>
            {featured ? (
              <ProofCard receipt={featured} />
            ) : (
              <div className="proof-ledger-card">
                <p>No public proof artifacts are currently attached to this dossier.</p>
              </div>
            )}
          </EditorialSection>

          <EditorialSection kicker="02 · Published topics" title="Public artifacts">
            {dossier.public_proofs.length > 0 ? (
              <ArtifactGrid
                artifacts={dossier.public_proofs.map((proof) => ({
                  id: proof.slug,
                  title: proof.title,
                  summary: proof.summary ?? "Published ProofOfAIWork artifact.",
                  kind: proof.archetype_label ?? "Proof artifact",
                  confidence: proof.evidence_confidence,
                  status: proof.verification_state,
                  tags: [
                    proof.ai_leverage_score != null ? `AI leverage ${proof.ai_leverage_score}` : null,
                    proof.output_multiplier != null ? `${proof.output_multiplier}x output` : null,
                  ].filter(Boolean) as string[],
                }))}
              />
            ) : (
              <div className="proof-ledger-card">
                <p>This dossier is public, but no proof artifacts are available for public inspection yet.</p>
              </div>
            )}
          </EditorialSection>
        </main>

        <aside className="proof-side-column">
          <LedgerPanel
            items={[
              { label: "Published proofs", value: totalProofs },
              { label: "Completed actions", value: totals.completed_actions ?? "--" },
              { label: "Decisions", value: totals.decisions ?? "--" },
              { label: "Alternatives", value: totals.alternatives ?? "--" },
              { label: "Turns analyzed", value: totals.turns_analyzed ?? "--" },
              { label: "Artifacts", value: totals.artifacts ?? "--" },
            ]}
          />
          <VerificationBlock
            canonical={canonical}
            hash={dossier.handle}
            status="Public professional dossier"
          />
        </aside>
      </section>
    </article>
  );
}

export default function ProofPage() {
  const { slug = "" } = useParams();
  const [receipt, setReceipt] = useState<PublicReceipt | null>(null);
  const [dossier, setDossier] = useState<PublicDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  const canonical = receipt?.canonical_url ?? dossier?.canonical_url ?? `${siteMetadata.canonical}/proof/${slug}`;
  const metaTitle = receipt?.title ?? dossier?.operator_name ?? (error ? "Proof private or withdrawn" : "Public proof");
  const metaDescription = receipt ? proofDescription(receipt) : dossier?.description ?? "Public ProofOfAIWork dossier.";
  const jsonLd = receipt
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "CreativeWork",
            "@id": canonical,
            name: receipt.title,
            description: metaDescription,
            url: canonical,
            datePublished: receipt.published_at,
            about: receipt.archetype_label,
          },
          {
            "@type": "Article",
            headline: receipt.title,
            description: metaDescription,
            mainEntityOfPage: canonical,
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: siteMetadata.canonical },
              { "@type": "ListItem", position: 2, name: "Proof", item: canonical },
            ],
          },
        ],
      }
    : dossier
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Person",
            "@id": canonical,
            name: dossier.operator_name,
            description: dossier.description,
            url: canonical,
          },
          {
            "@type": "CreativeWork",
            name: `${dossier.operator_name} ProofOfAIWork dossier`,
            description: dossier.description,
            url: canonical,
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: siteMetadata.canonical },
              { "@type": "ListItem", position: 2, name: "Proof dossier", item: canonical },
            ],
          },
        ],
      }
    : undefined;

  useSeo(metaTitle, metaDescription, `/proof/${slug}`, receipt?.og_image_url, "article", jsonLd);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setReceipt(null);
    setDossier(null);
    fetchPublicReceipt(slug, controller.signal)
      .then(async (nextReceipt) => {
        if (nextReceipt) {
          setReceipt(nextReceipt);
          return;
        }
        const nextDossier = await fetchPublicDossier(slug, controller.signal);
        if (nextDossier) {
          setDossier({
            ...nextDossier,
            canonical_url: `${siteMetadata.canonical}/proof/${slug}`,
          });
          return;
        }
        setError(true);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setReceipt(null);
        setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug]);

  const published = useMemo(() => formatDate(receipt?.published_at), [receipt?.published_at]);

  const handleCopy = async () => {
    if (!receipt && !dossier) return;
    try {
      await navigator.clipboard.writeText(receipt ? copyText(receipt, canonical) : `${dossier!.operator_name}\n${dossier!.description}\n${canonical}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (loading) {
    return (
      <section className="proof-loading dossier-surface">
        <Loader2 className="spin" size={28} />
        <p>Opening public proof dossier...</p>
      </section>
    );
  }

  if (error || !receipt) {
    if (dossier) {
      return (
        <PublicProofDossier
          dossier={dossier}
          canonical={canonical}
          copied={copied}
          onCopy={handleCopy}
        />
      );
    }

    return (
      <section className="proof-private dossier-surface">
        <p className="eyebrow">Private or withdrawn</p>
        <h1>This proof is private or has been withdrawn by its operator.</h1>
        <p>
          ProofOfAIWork does not expose private transcript data, account details, or unavailable receipt contents. The
          public archive only displays artifacts that have been explicitly published.
        </p>
        <div className="cta-row">
          <Link className="button primary" to="/community">
            View public archive
          </Link>
          <a className="button secondary" href={APP_URL}>
            Verify your own work
          </a>
        </div>
      </section>
    );
  }

  return (
    <article className="proof-dossier">
      <div className="proof-utility">
        <span>Verified capability artifact</span>
        <span>{receipt.verification_state ?? receipt.slug}</span>
        <button type="button" onClick={handleCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button type="button" onClick={() => window.print()}>
          <Printer size={14} />
          Print
        </button>
      </div>

      <header className="proof-masthead">
        <span>PROOFOFAIWORK</span>
        <span>Proof of work, not proof of person</span>
      </header>

      <section className="proof-dossier-hero">
        <div className="proof-identity-block">
          <p className="eyebrow">Archetype</p>
          <h1>{receipt.archetype_label ?? "Verified Capability Artifact"}</h1>
          <p className="proof-title-line">{receipt.title}</p>
          <p className="proof-narrative">{metaDescription}</p>
          <div className="proof-actions">
            <button className="button primary" type="button" onClick={handleCopy}>
              {copied ? <Check size={18} /> : <Share2 size={18} />}
              {copied ? "Copied" : "Share proof"}
            </button>
            <a className="button secondary" href={APP_URL}>
              Verify AI work
              <ExternalLink size={18} />
            </a>
          </div>
        </div>

        <div className="proof-score-event">
          <p className="eyebrow">AI Leverage Score</p>
          <strong>{score(receipt.ai_leverage_score)}</strong>
          <div className="proof-score-context">
            <span>Evidence confidence {score(receipt.evidence_confidence)}</span>
            <span>Output multiplier {multiplier(receipt.output_multiplier)}</span>
            {published ? <span>Filed {published}</span> : null}
          </div>
        </div>
      </section>

      <section className="proof-dossier-body">
        <main className="proof-main-column">
          <EditorialSection kicker="01 · Portable artifact" title="Proof card">
            <ProofCard receipt={receipt} />
          </EditorialSection>

          <EditorialSection kicker="02 · Behavioral composition" title="Ownership, execution, leverage">
            <div className="proof-bars">
              {[
                ["Ownership", receipt.ownership, "Decisions named, not delegated."],
                ["Execution", receipt.execution, "Actions completed against stated intent."],
                ["Leverage", receipt.leverage_score, "Output amplification backed by evidence."],
              ].map(([label, value, detail]) => (
                <div className="proof-bar-row" key={label as string}>
                  <span>{label as string}</span>
                  <div>
                    <i style={{ width: `${value ?? 0}%` }} />
                    <p>{detail as string}</p>
                  </div>
                  <strong>{score(value as number | undefined)}</strong>
                </div>
              ))}
            </div>
          </EditorialSection>

          <EditorialSection kicker="03 · Evidence ledger" title="What was counted">
            <LedgerPanel
              items={[
                { label: "Completed actions", value: ledger(receipt.completed_actions), note: "agent steps closed against an intent" },
                { label: "Decisions", value: ledger(receipt.decisions), note: "operator-marked choice points" },
                { label: "Alternatives", value: ledger(receipt.alternatives), note: "rejected or compared branches" },
                { label: "Turns analyzed", value: ledger(receipt.turns_analyzed), note: "conversation turns in the public receipt" },
                { label: "Artifacts", value: ledger(receipt.artifacts), note: "public-safe shipped outputs" },
              ]}
            />
          </EditorialSection>

          <EditorialSection kicker="04 · Evidence excerpts" title="Public-safe cards">
            {receipt.evidence_cards.length > 0 ? (
              <div className="evidence-ledger-list">
                {receipt.evidence_cards.map((card) => (
                  <article key={card.id}>
                    <span>{card.kind ?? "Evidence"}</span>
                    <h3>{card.title}</h3>
                    <p>{card.summary}</p>
                    {card.turns.length > 0 ? (
                      <div className="turn-list">
                        {card.turns.map((turn) => (
                          <code key={turn}>{turn}</code>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="soft-callout">
                <FileWarning size={22} />
                <h2>No public evidence cards are attached.</h2>
                <p>The dossier can remain public without exposing private transcript excerpts.</p>
              </div>
            )}
          </EditorialSection>

          {receipt.artifact_cards.length > 0 ? (
            <EditorialSection
              kicker="05 · Attached work"
              title="Strongest evidence artifacts"
              aside={<span className="section-note">Featured and supporting work filed from this proof.</span>}
            >
              <ArtifactGrid artifacts={receipt.artifact_cards} />
            </EditorialSection>
          ) : null}
        </main>

        <aside className="proof-side-column">
          <VerificationBlock canonical={canonical} hash={receipt.proof_hash} />

          {receipt.timeline.length > 0 ? (
            <section className="side-section">
              <p className="eyebrow">Timeline</p>
              <h2>History</h2>
              <div className="proof-timeline">
                {receipt.timeline.map((item) => (
                  <div key={item.id}>
                    <span>{item.kind ?? "event"}</span>
                    <strong>{item.title}</strong>
                    <p>{item.summary}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="side-section">
            <p className="eyebrow">Taxonomy</p>
            <h2>Interpret the proof</h2>
            <div className="cluster-list">
              {archetypes.slice(0, 3).map((archetype) => (
                <div key={archetype.slug}>
                  <Link to={`/archetypes/${archetype.slug}`}>{archetype.name}</Link>
                  <p>{archetype.meaning}</p>
                </div>
              ))}
              {glossarySeedConcepts.slice(0, 2).map((concept) => (
                <div key={concept.slug}>
                  <Link to={`/glossary/${concept.slug}`}>{concept.term}</Link>
                  <p>{concept.definition}</p>
                </div>
              ))}
              {roleLeveragePages.slice(0, 2).map((page) => (
                <div key={page.slug}>
                  <Link to={`/ai-leverage/${page.slug}`}>{page.role}</Link>
                  <p>{page.description}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <footer className="proof-dossier-footer">
        <Hash size={16} />
        <span>End of dossier</span>
        <code>{receipt.proof_hash ?? canonical}</code>
      </footer>
    </article>
  );
}
