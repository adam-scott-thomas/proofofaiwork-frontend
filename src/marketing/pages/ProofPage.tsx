import { Check, Copy, ExternalLink, FileWarning, Hash, Loader2, Printer, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArtifactGrid, EditorialSection, LedgerPanel, VerificationBlock } from "../components/EditorialPrimitives";
import ProofCard from "../components/ProofCard";
import { useSeo } from "../hooks/useSeo";
import { APP_URL, siteMetadata } from "../lib/constants";
import { fetchPublicReceipt, type PublicReceipt } from "../lib/publicReceipts";

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

export default function ProofPage() {
  const { slug = "" } = useParams();
  const [receipt, setReceipt] = useState<PublicReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  const canonical = `${siteMetadata.canonical}/proof/${slug}`;
  const metaTitle = receipt?.title ?? (error ? "Proof private or withdrawn" : "Public proof");
  const metaDescription = proofDescription(receipt);
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
            datePublished: receipt.publishedAt,
            about: receipt.archetypeLabel,
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
    : undefined;

  useSeo(metaTitle, metaDescription, `/proof/${slug}`, receipt?.ogImageUrl, "article", jsonLd);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    fetchPublicReceipt(slug, controller.signal)
      .then((nextReceipt) => {
        if (!nextReceipt) {
          setReceipt(null);
          setError(true);
          return;
        }
        setReceipt(nextReceipt);
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

  const published = useMemo(() => formatDate(receipt?.publishedAt), [receipt?.publishedAt]);

  const handleCopy = async () => {
    if (!receipt) return;
    try {
      await navigator.clipboard.writeText(copyText(receipt, canonical));
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
        <span>{receipt.receiptId ?? receipt.slug}</span>
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
        <div className="proof-score-event">
          <p className="eyebrow">AI Leverage Score</p>
          <strong>{score(receipt.aiLeverageScore)}</strong>
          <div className="proof-score-context">
            <span>Evidence confidence {score(receipt.evidenceConfidence)}</span>
            <span>Output multiplier {multiplier(receipt.outputMultiplier)}</span>
            {published ? <span>Filed {published}</span> : null}
          </div>
        </div>

        <div className="proof-identity-block">
          <p className="eyebrow">Archetype</p>
          <h1>{receipt.archetypeLabel ?? "Verified Capability Artifact"}</h1>
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
      </section>

      <section className="proof-dossier-body">
        <main className="proof-main-column">
          <EditorialSection kicker="01 · Portable artifact" title="Proof card">
            <ProofCard receipt={receipt} />
          </EditorialSection>

          <EditorialSection kicker="02 · Behavioral composition" title="Ownership, execution, leverage">
            <div className="proof-bars">
              {[
                ["Ownership", receipt.ownership, receipt.ownershipDetail ?? "Decisions named, not delegated."],
                ["Execution", receipt.execution, receipt.executionDetail ?? "Actions completed against stated intent."],
                ["Leverage", receipt.leverage, receipt.leverageDetail ?? "Output amplification backed by evidence."],
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
                { label: "Completed actions", value: ledger(receipt.completedActions), note: "agent steps closed against an intent" },
                { label: "Decisions", value: ledger(receipt.decisions), note: "operator-marked choice points" },
                { label: "Alternatives", value: ledger(receipt.alternatives), note: "rejected or compared branches" },
                { label: "Turns analyzed", value: ledger(receipt.turnsAnalyzed), note: "conversation turns in the public receipt" },
                { label: "Artifacts", value: ledger(receipt.artifacts), note: "public-safe shipped outputs" },
              ]}
            />
          </EditorialSection>

          <EditorialSection kicker="04 · Evidence excerpts" title="Public-safe cards">
            {receipt.evidenceCards.length > 0 ? (
              <div className="evidence-ledger-list">
                {receipt.evidenceCards.map((card) => (
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
        </main>

        <aside className="proof-side-column">
          <VerificationBlock canonical={canonical} hash={receipt.proofHash} />

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

          {receipt.artifactCards.length > 0 ? (
            <section className="side-section">
              <p className="eyebrow">Artifacts</p>
              <h2>Attached work</h2>
              <ArtifactGrid artifacts={receipt.artifactCards} />
            </section>
          ) : null}
        </aside>
      </section>

      <footer className="proof-dossier-footer">
        <Hash size={16} />
        <span>End of dossier</span>
        <code>{receipt.proofHash ?? canonical}</code>
      </footer>
    </article>
  );
}
