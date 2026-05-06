import { ArrowRight, Archive, Copy } from "lucide-react";
import { Link, useParams } from "react-router";
import {
  ArtifactGrid,
  EditorialSection,
  LedgerPanel,
  VerificationBlock,
} from "../components/EditorialPrimitives";
import { identityClusters } from "../data/clusters";
import { useSeo } from "../hooks/useSeo";
import { APP_URL, siteMetadata } from "../lib/constants";

function titleCaseHandle(handle: string) {
  return handle
    .replace(/^@/, "")
    .split(/[-_.]/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export default function DossierPage() {
  const { handle = "" } = useParams();
  const cleanHandle = handle.replace(/^@/, "") || "operator";
  const displayName = titleCaseHandle(cleanHandle);
  const canonical = `${siteMetadata.canonical}/dossier/${cleanHandle}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        name: displayName,
        alternateName: `@${cleanHandle}`,
        url: canonical,
        description: "Public ProofOfAIWork operator dossier.",
      },
      {
        "@type": "CreativeWork",
        name: `${displayName} ProofOfAIWork dossier`,
        description: "A curated archive of public capability artifacts.",
        url: canonical,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteMetadata.canonical },
          { "@type": "ListItem", position: 2, name: "Dossier", item: canonical },
        ],
      },
    ],
  };

  useSeo(
    `${displayName} dossier`,
    "Public ProofOfAIWork dossiers collect published capability artifacts for one operator or professional context.",
    `/dossier/${cleanHandle}`,
    undefined,
    "article",
    jsonLd,
  );

  const artifacts = [
    {
      id: "dossier-shell",
      title: "Public proof collection",
      kind: "archive slot",
      summary: "Published proof artifacts will appear here once the dossier endpoint is available.",
    },
    {
      id: "operator-context",
      title: "Operator context",
      kind: "identity",
      summary: "Dossiers are professional archives, not creator profiles or social pages.",
    },
    {
      id: "visibility-policy",
      title: "Visibility policy",
      kind: "privacy",
      summary: "Raw transcripts and private account data are never exposed in the public dossier shell.",
    },
  ];

  return (
    <article className="dossier-shell">
      <div className="proof-utility">
        <span>Personal dossier</span>
        <span>/{cleanHandle}</span>
        <button type="button" onClick={() => navigator.clipboard.writeText(canonical)}>
          <Copy size={14} />
          Copy
        </button>
      </div>

      <header className="proof-masthead">
        <span>PROOFOFAIWORK</span>
        <span>Capability archive · proof of work, not proof of person</span>
      </header>

      <section className="dossier-identity">
        <div>
          <p className="eyebrow">Operator archive</p>
          <h1>{displayName}</h1>
          <p className="dossier-archetype">Capability dossier awaiting published proofs.</p>
          <p>
            This page is the public identity layer for verified work artifacts. It is designed to collect proofs by
            context such as founder, security, architecture, research, or operator work without becoming a social
            profile.
          </p>
        </div>
        <aside className="dossier-summary-panel">
          <p className="eyebrow">Evidence totals</p>
          <strong>Filed</strong>
          <span>Public artifact collection pending backend dossier data.</span>
        </aside>
      </section>

      <div className="proof-dossier-body">
        <main className="proof-main-column">
          <EditorialSection kicker="01 · Narrative positioning" title="What this archive is for">
            <p className="dossier-copy">
              A dossier is a curated capability archive. It should help evaluators inspect public proof artifacts,
              understand the operator's recurring work patterns, and follow evidence back to canonical proof pages.
            </p>
          </EditorialSection>

          <EditorialSection kicker="02 · Featured proofs" title="Pinned capability artifacts">
            <ArtifactGrid artifacts={artifacts} />
          </EditorialSection>

          <EditorialSection kicker="03 · Evidence totals" title="Archive ledger">
            <LedgerPanel
              items={[
                { label: "Public proofs", value: "--", note: "requires dossier backend endpoint" },
                { label: "Completed actions", value: "--", note: "summed from published receipts" },
                { label: "Decisions", value: "--", note: "operator-marked choice points" },
                { label: "Turns analyzed", value: "--", note: "public-safe receipt totals" },
                { label: "Artifacts", value: "--", note: "public deliverables only" },
              ]}
            />
          </EditorialSection>

          <EditorialSection kicker="04 · Public artifact grid" title="Filed work">
            <ArtifactGrid artifacts={artifacts} />
          </EditorialSection>
        </main>

        <aside className="proof-side-column">
          <VerificationBlock canonical={canonical} status="Dossier shell · public-safe" />

          <section className="side-section">
            <p className="eyebrow">People like you</p>
            <h2>Discovery clusters</h2>
            <div className="cluster-list">
              {identityClusters.map((cluster) => (
                <div key={cluster.name}>
                  <strong>{cluster.name}</strong>
                  <p>{cluster.description}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <footer className="proof-dossier-footer">
        <Archive size={16} />
        <span>End of dossier shell</span>
        <Link to="/community">
          Open public archive <ArrowRight size={14} />
        </Link>
        <a href={APP_URL}>Create verified proofs</a>
      </footer>
    </article>
  );
}
