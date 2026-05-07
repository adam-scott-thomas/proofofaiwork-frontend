import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router";
import { getSeoPage } from "../seo-opportunities";
import { useSeo } from "../hooks/useSeo";
import { APP_URL } from "../lib/constants";

type SeoOpportunityPageProps = {
  slug: string;
};

export default function SeoOpportunityPage({ slug }: SeoOpportunityPageProps) {
  const page = getSeoPage(slug);

  if (!page) {
    return null;
  }

  useSeo(page.seoTitle, page.metaDescription, `/${page.slug}`);

  return (
    <article className="seo-live-page">
      <section className="seo-live-hero">
        <p className="eyebrow">{page.pageType}</p>
        <h1>{page.title}</h1>
        <p>{page.brief}</p>
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

      <section className="seo-live-body">
        <div>
          <p className="eyebrow">Search intent</p>
          <h2>{page.intent}</h2>
          <p>Audience: {page.audience.join(", ")}.</p>
          <p>Commercial value: {page.commercialValue}.</p>
        </div>
        <div className="seo-live-list">
          {page.sections.map((section) => (
            <article key={section}>
              <CheckCircle2 size={20} />
              <h3>{section}</h3>
              <p>Keep this section anchored to proof artifacts, examples, scorecards, or hiring workflows.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="seo-live-links">
        <div>
          <p className="eyebrow">Proof assets</p>
          <h2>Evidence this page needs</h2>
          {page.proofAssets.map((asset) => (
            <span key={asset}>{asset}</span>
          ))}
        </div>
        <div>
          <p className="eyebrow">Internal links</p>
          <h2>Route readers into proof</h2>
          {page.internalLinks.map((link) => (
            <Link key={link} to={link}>
              {link}
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
