import { Archive, ArrowRight, BriefcaseBusiness, FileSearch, ShieldCheck } from "lucide-react";
import { Link } from "react-router";
import ProofCard from "../components/ProofCard";
import { Section } from "../components/Section";
import { specimenDossiers, specimenProofs, totalsFor } from "../data/specimens";
import { useSeo } from "../hooks/useSeo";
import { APP_URL } from "../lib/constants";

const employerInspection = [
  ["Decision trail", "Where the operator made choices, rejected weak paths, and kept control of the work."],
  ["Evidence confidence", "How much public-safe evidence supports the artifact without exposing raw private transcript."],
  ["Artifacts shipped", "Briefs, memos, rubrics, checklists, plans, and other outputs tied to the work session."],
];

const operatorPublishing = [
  ["Capability artifact", "Publish a proof page that makes serious AI-assisted work inspectable."],
  ["Portable proof card", "Share a compact receipt with score, archetype, confidence, and proof hash."],
  ["Dossier archive", "Collect multiple public proofs into a professional capability archive over time."],
];

export default function HomePage() {
  const featuredDossier = specimenDossiers[0];
  const dossierTotals = totalsFor(featuredDossier.proofs);

  useSeo(
    "Don't just say you're AI-capable. Proof it.",
    "Turn real AI-assisted work into verified proof artifacts employers, clients, and teams can actually inspect.",
    "",
  );

  return (
    <>
      <section className="home-demo-hero">
        <div className="hero-copy">
          <p className="eyebrow">ProofOfAIWork</p>
          <h1>Don&apos;t just say you&apos;re AI-capable. Proof it.</h1>
          <p className="hero-subhead">
            Turn real AI-assisted work into verified proof artifacts employers, clients, and teams can actually inspect.
          </p>
          <div className="cta-row">
            <a className="button primary" href={APP_URL}>
              Create your proof
              <ArrowRight size={18} />
            </a>
            <Link className="button secondary" to="/examples">
              See examples
              <FileSearch size={18} />
            </Link>
          </div>
        </div>
        <div className="home-proof-stack" aria-label="Specimen proof card examples">
          {specimenProofs.slice(0, 3).map((proof) => (
            <ProofCard receipt={proof} compact key={proof.slug} />
          ))}
        </div>
      </section>

      <Section
        eyebrow="Employer inspection"
        title="What employers can inspect"
        lead="Evaluate demonstrated capability, not claimed familiarity."
      >
        <div className="three-column">
          {employerInspection.map(([title, copy]) => (
            <article className="feature-panel" key={title}>
              <FileSearch size={22} />
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
        <div className="section-action">
          <Link className="text-link" to="/employers">
            See employer review patterns <ArrowRight size={18} />
          </Link>
        </div>
      </Section>

      <Section
        eyebrow="Operator publishing"
        title="What operators can publish"
        lead="Real AI work leaves evidence: decisions, revisions, artifacts, and outcomes."
      >
        <div className="three-column">
          {operatorPublishing.map(([title, copy]) => (
            <article className="feature-panel" key={title}>
              <ShieldCheck size={22} />
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
        <div className="section-action">
          <Link className="text-link" to="/demo/cards">
            Inspect proof card examples <ArrowRight size={18} />
          </Link>
        </div>
      </Section>

      <Section
        eyebrow="Dossier over time"
        title="What a dossier proves over time"
        lead="A dossier is a curated archive of public capability artifacts, not a social profile."
      >
        <div className="home-dossier-preview">
          <div>
            <p className="proof-card-label">Demonstration artifact</p>
            <h3>{featuredDossier.operator_name}</h3>
            <p className="dossier-archetype">{featuredDossier.archetype}</p>
            <p>{featuredDossier.description}</p>
            <Link className="text-link" to="/demo/dossiers">
              View dossier specimens <ArrowRight size={18} />
            </Link>
          </div>
          <div className="ledger-panel">
            {[
              ["Public proofs", dossierTotals.public_proofs],
              ["Completed actions", dossierTotals.completed_actions],
              ["Decisions", dossierTotals.decisions],
              ["Alternatives", dossierTotals.alternatives],
              ["Artifacts", dossierTotals.artifacts],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>specimen total</small>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        eyebrow="Public archive"
        title="Community preview"
        lead="The community gallery is an archival filing system for real public receipts as they are published."
      >
        <div className="two-column">
          <Link className="feature-panel" to="/community">
            <Archive size={22} />
            <h3>Open the evidence gallery</h3>
            <p>No leaderboards, comments, or engagement mechanics. Public proofs appear as filed capability artifacts.</p>
            <span className="text-link">
              View community <ArrowRight size={18} />
            </span>
          </Link>
          <Link className="feature-panel" to="/demo/proofs">
            <BriefcaseBusiness size={22} />
            <h3>Review specimen full proofs</h3>
            <p>Six demonstration artifacts show how proof pages expose scores, ledger data, timelines, and filed outputs.</p>
            <span className="text-link">
              Open proof specimens <ArrowRight size={18} />
            </span>
          </Link>
        </div>
      </Section>

      <section className="home-cta-band">
        <div>
          <p className="eyebrow">Individuals</p>
          <h2>Publish a verified capability artifact.</h2>
          <p>Turn real AI work into a public proof page that can be inspected, cited, and shared.</p>
          <a className="button primary" href={APP_URL}>
            Get your verified AI Work Score
            <ArrowRight size={18} />
          </a>
        </div>
        <div>
          <p className="eyebrow">Employers</p>
          <h2>Inspect the work trail.</h2>
          <p>Review decisions, revisions, evidence confidence, and outcomes instead of relying on claimed fluency.</p>
          <Link className="button secondary" to="/employers">
            Review employer use cases
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
