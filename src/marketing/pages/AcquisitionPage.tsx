import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router";
import { getAcquisitionPage } from "../acquisition";
import { useSeo } from "../hooks/useSeo";
import { APP_URL } from "../lib/constants";

type AcquisitionPageProps = {
  slug: string;
};

function labelFromPath(path: string) {
  return path
    .replace(/^\//, "")
    .split("/")
    .pop()
    ?.split("-")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export default function AcquisitionPage({ slug }: AcquisitionPageProps) {
  const page = getAcquisitionPage(slug);

  if (!page) {
    return null;
  }

  useSeo(page.seoTitle, page.metaDescription, `/${page.slug}`);

  return (
    <article className="acquisition-page">
      <section className="acquisition-hero">
        <p className="eyebrow">{page.pageType}</p>
        <h1>{page.title}</h1>
        <p>{page.metaDescription}</p>
        <div className="cta-row">
          <a className="button primary" href={APP_URL}>
            {page.primaryCta}
            <ArrowRight size={18} />
          </a>
          <Link className="button secondary" to="/your-ai-resume">
            The resume is dead
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="acquisition-body">
        <div>
          <p className="eyebrow">Reader context</p>
          <h2>This page explains {page.title.toLowerCase()} through proof artifacts, review criteria, and next steps.</h2>
          <p>This guide is written for {page.audience.join(", ").toLowerCase()}.</p>
        </div>
        <div className="acquisition-list">
          {page.sections.map((section) => (
            <article key={section}>
              <CheckCircle2 size={20} />
              <h3>{section}</h3>
              <p>Use this section to move from a claim about AI capability to evidence someone can inspect.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="acquisition-links">
        <div>
          <p className="eyebrow">Proof assets</p>
          <h2>Evidence to inspect</h2>
          {page.proofAssets.map((asset) => (
            <span key={asset}>{asset}</span>
          ))}
        </div>
        <div>
          <p className="eyebrow">Related paths</p>
          <h2>Continue into proof</h2>
          {page.internalLinks.map((link) => (
            <Link key={link} to={link}>
              {labelFromPath(link) ?? link}
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
