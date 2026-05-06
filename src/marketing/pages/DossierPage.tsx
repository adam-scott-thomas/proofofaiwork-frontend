import { ArrowRight, Archive, Copy, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArtifactGrid,
  EditorialSection,
  LedgerPanel,
  VerificationBlock,
} from "../components/EditorialPrimitives";
import ProofCard from "../components/ProofCard";
import { identityClusters } from "../data/clusters";
import { useSeo } from "../hooks/useSeo";
import { APP_URL, siteMetadata } from "../lib/constants";
import { fetchPublicDossier, type PublicDossier } from "../lib/publicReceipts";

function titleCaseHandle(handle: string) {
  return handle
    .replace(/^@/, "")
    .split(/[-_.]/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function numberOrDash(value?: number) {
  return value == null ? "--" : value.toLocaleString("en-US");
}

export default function DossierPage() {
  const { handle = "" } = useParams();
  const cleanHandle = handle.replace(/^@/, "") || "operator";
  const [dossier, setDossier] = useState<PublicDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const displayName = dossier?.operatorName || titleCaseHandle(cleanHandle);
  const canonical = dossier?.canonicalUrl || `${siteMetadata.canonical}/dossier/${cleanHandle}`;
  const totals = dossier?.evidenceTotals ?? {};

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        name: displayName,
        alternateName: `@${cleanHandle}`,
        url: canonical,
        description: dossier?.description || "Public ProofOfAIWork operator dossier.",
      },
      {
        "@type": "CreativeWork",
        name: `${displayName} ProofOfAIWork dossier`,
        description: dossier?.description || "A curated archive of public capability artifacts.",
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
    dossier?.description ||
      "Public ProofOfAIWork dossiers collect published capability artifacts for one operator or professional context.",
    `/dossier/${cleanHandle}`,
    dossier?.featuredProof?.ogImageUrl,
    "article",
    jsonLd,
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchPublicDossier(cleanHandle, controller.signal)
      .then((value) => setDossier(value))
      .catch(() => setDossier(null))
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [cleanHandle]);

  if (loading) {
    return (
      <section className="proof-loading dossier-surface">
        <Loader2 className="spin" size={22} />
        <p>Opening public dossier...</p>
      </section>
    );
  }

  if (!dossier) {
    return (
      <section className="proof-private dossier-surface">
        <p className="eyebrow">Dossier unavailable</p>
        <h1>This dossier has no public proofs.</h1>
        <p>Private receipts and account data are not exposed through public dossier routes.</p>
        <Link className="button primary" to="/community">
          Open public archive
          <ArrowRight size={18} />
        </Link>
      </section>
    );
  }

  const artifacts = dossier.publicProofs.map((proof) => ({
    id: proof.slug,
    title: proof.title,
    kind: proof.archetypeLabel,
    summary: proof.summary,
  }));

  return (
    <article className="dossier-shell">
      <div className="proof-utility">
        <span>Personal dossier</span>
        <span>/{dossier.handle}</span>
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
          <p className="dossier-archetype">
            {Object.keys(dossier.archetypeDistribution)[0] || "Published proof dossier"}
          </p>
          <p>{dossier.description}</p>
        </div>
        <aside className="dossier-summary-panel">
          <p className="eyebrow">Evidence totals</p>
          <strong>{numberOrDash(totals.public_proofs)}</strong>
          <span>Public proof artifacts filed under this handle.</span>
        </aside>
      </section>

      <div className="proof-dossier-body">
        <main className="proof-main-column">
          {dossier.featuredProof ? (
            <EditorialSection kicker="01 · Featured proof" title="Pinned capability artifact">
              <ProofCard receipt={dossier.featuredProof} />
            </EditorialSection>
          ) : null}

          <EditorialSection kicker="02 · Evidence totals" title="Archive ledger">
            <LedgerPanel
              items={[
                { label: "Public proofs", value: numberOrDash(totals.public_proofs), note: "published receipts" },
                { label: "Completed actions", value: numberOrDash(totals.completed_actions), note: "summed from public evidence" },
                { label: "Decisions", value: numberOrDash(totals.decisions), note: "operator-marked choice points" },
                { label: "Turns analyzed", value: numberOrDash(totals.turns_analyzed), note: "public-safe receipt totals" },
                { label: "Artifacts", value: numberOrDash(totals.artifacts), note: "public deliverables only" },
              ]}
            />
          </EditorialSection>

          <EditorialSection kicker="03 · Public artifact grid" title="Filed work">
            <ArtifactGrid artifacts={artifacts} />
          </EditorialSection>
        </main>

        <aside className="proof-side-column">
          <VerificationBlock
            canonical={canonical}
            hash={dossier.featuredProof?.proofHash}
            status="Public-safe verified dossier"
          />

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
        <span>End of public dossier</span>
        <Link to="/community">
          Open public archive <ArrowRight size={14} />
        </Link>
        <a href={APP_URL}>Create verified proofs</a>
      </footer>
    </article>
  );
}
