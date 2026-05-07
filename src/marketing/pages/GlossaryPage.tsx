import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Section } from "../components/Section";
import { comparisonPages, roleLeveragePages } from "../data/seoExpansion";
import { glossaryConceptInventory, glossarySeedConcepts } from "../data/taxonomy";
import { useSeo } from "../hooks/useSeo";
import { siteMetadata } from "../lib/constants";

export default function GlossaryPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "ProofOfAIWork glossary",
    description: "Seed concepts for evaluating AI-assisted work with concrete evidence.",
    url: `${siteMetadata.canonical}/glossary`,
    mainEntity: {
      "@type": "DefinedTermSet",
      name: "ProofOfAIWork Taxonomy v1 glossary",
      hasDefinedTerm: glossarySeedConcepts.map((concept) => ({
        "@type": "DefinedTerm",
        name: concept.term,
        description: concept.definition,
        url: `${siteMetadata.canonical}/glossary/${concept.slug}`,
      })),
    },
  };

  useSeo(
    "AI work glossary",
    "Plain-English definitions for AI work samples, AI leverage, proof artifacts, AI skills assessment, and AI-assisted workflows.",
    "/glossary",
    undefined,
    "website",
    jsonLd,
  );

  return (
    <>
      <section className="archive-masthead taxonomy-masthead">
        <p className="eyebrow">Glossary</p>
        <h1>Clear language for evaluating AI work.</h1>
        <p>
          This glossary supports proof pages, dossiers, hiring evaluation, and role-based AI leverage pages. It avoids
          vague claims and keeps the focus on observable work.
        </p>
      </section>

      <Section eyebrow="Seed concepts" title="First five glossary pages">
        <div className="post-grid">
          {glossarySeedConcepts.map((concept) => (
            <Link className="post-card" to={`/glossary/${concept.slug}`} key={concept.slug}>
              <span>Defined term</span>
              <h3>{concept.term}</h3>
              <p>{concept.definition}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Inventory"
        title="Taxonomy v1 concept inventory"
        lead="Only the seed concepts are published in this first layer. The remaining terms are reserved until examples can support them."
      >
        <div className="artifact-grid">
          {glossaryConceptInventory.map((concept) => (
            <article key={concept.slug}>
              <span>Concept</span>
              <h3>{concept.term}</h3>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="Applied pages" title="Where these concepts are used">
        <div className="three-column">
          {roleLeveragePages.map((page) => (
            <Link className="feature-panel" to={`/ai-leverage/${page.slug}`} key={page.slug}>
              <h3>{page.role}</h3>
              <p>{page.description}</p>
            </Link>
          ))}
        </div>
        <div className="two-column glossary-comparison-links">
          {comparisonPages.map((page) => (
            <Link className="feature-panel" to={`/compare/${page.slug}`} key={page.slug}>
              <h3>{page.title}</h3>
              <p>{page.description}</p>
            </Link>
          ))}
        </div>
      </Section>

      <section className="final-cta">
        <p className="eyebrow">From language to evidence</p>
        <h2>Use the taxonomy to create proof that can be inspected.</h2>
        <Link className="button primary" to="/archetypes">
          View archetypes
          <ArrowRight size={18} />
        </Link>
      </section>
    </>
  );
}
