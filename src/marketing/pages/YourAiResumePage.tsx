import { ArrowRight, BadgeCheck, FileX2, Link2, SearchCheck } from "lucide-react";
import { Link, useParams } from "react-router";
import { yourAiResumePages, yourAiResumeResearchVerdict } from "../acquisition/your-ai-resume";
import { useSeo } from "../hooks/useSeo";
import { APP_URL } from "../lib/constants";

const fallbackPage = yourAiResumePages[0];

const resumeProofLinks = [
  ["AI capability proof", "/ai-capability-proof"],
  ["AI work samples", "/ai-work-samples"],
  ["Resumes vs proof", "/resumes-vs-proof-of-work"],
  ["AI work portfolio", "/ai-work-portfolio"],
];

function getPage(slug?: string) {
  if (!slug) return fallbackPage;
  return yourAiResumePages.find((page) => page.slug === slug) ?? fallbackPage;
}

type YourAiResumePageProps = {
  pageSlug?: string;
};

export default function YourAiResumePage({ pageSlug }: YourAiResumePageProps) {
  const { slug } = useParams();
  const page = getPage(pageSlug ?? slug);
  const isRoot = page.slug === "your-ai-resume";

  useSeo(page.seoTitle, page.metaDescription, isRoot ? "/your-ai-resume" : `/your-ai-resume/${page.slug}`);

  return (
    <article className="resume-proof-page">
      <section className="resume-proof-hero">
        <div>
          <p className="eyebrow">YOUR AI-RESUME</p>
          <h1>{isRoot ? "The resume is dead. Submit your proof." : page.title}</h1>
          <p className="resume-proof-lead">{isRoot ? yourAiResumeResearchVerdict.shortAnswer : page.angle}</p>
          <div className="cta-row">
            <a className="button primary" href={APP_URL}>
              Submit your proof
              <ArrowRight size={18} />
            </a>
            <Link className="button secondary" to="/examples">
              Inspect examples
              <SearchCheck size={18} />
            </Link>
          </div>
        </div>
        <div className="resume-proof-billboard" aria-label="Proof-backed resume model">
          <div>
            <span>Resume claim</span>
            <strong>AI-native operator</strong>
            <p>Unverified. Easy to write. Hard to trust.</p>
          </div>
          <div>
            <span>Proof artifact</span>
            <strong>4 linked work receipts</strong>
            <p>Inspectable decisions, workflows, outputs, and verification notes.</p>
          </div>
          <div>
            <span>Hiring signal</span>
            <strong>Claim backed by work</strong>
            <p>The document becomes an index. The evidence does the work.</p>
          </div>
        </div>
      </section>

      <section className="resume-proof-strip" aria-label="Positioning">
        {yourAiResumeResearchVerdict.why.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </section>

      <section className="resume-proof-grid">
        <div className="resume-proof-main">
          <p className="eyebrow">{page.pageType}</p>
          <h2>{page.angle}</h2>
          <p>{page.intent}</p>
          <div className="resume-proof-sections">
            {page.sections.map((section, index) => (
              <div key={section}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{section}</strong>
              </div>
            ))}
          </div>
        </div>
        <aside className="resume-proof-rail">
          <div>
            <BadgeCheck size={22} />
            <h3>Conversion</h3>
            <p>{page.cta}</p>
          </div>
          <div>
            <Link2 size={22} />
            <h3>Related proof paths</h3>
            {page.internalLinks.map((link) => (
              <Link key={link} to={link}>
                {link}
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className="resume-proof-assets">
        <div className="section-heading">
          <p className="eyebrow">Proof assets</p>
          <h2>What the page has to show</h2>
        </div>
        <div>
          {page.proofAssets.map((asset) => (
            <article key={asset}>
              <FileX2 size={22} />
              <h3>{asset}</h3>
              <p>Use this as evidence, not decoration. The page should make the claim inspectable.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="resume-proof-suite">
        <div className="section-heading">
          <p className="eyebrow">Published suite</p>
          <h2>Proof-backed AI-resume guides.</h2>
          <p className="section-lead">These guides avoid generic builder advice and stay anchored to proof-backed career evidence.</p>
        </div>
        <div>
          {yourAiResumePages.map((suitePage) => (
            <Link
              className={suitePage.slug === page.slug ? "active" : ""}
              key={suitePage.slug}
              to={suitePage.slug === "your-ai-resume" ? "/your-ai-resume" : `/your-ai-resume/${suitePage.slug}`}
            >
              <span>{suitePage.priority}</span>
              <strong>{suitePage.title}</strong>
              <small>{suitePage.metaDescription}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="resume-proof-links">
        <p className="eyebrow">Core proof graph</p>
        <h2>The resume points here.</h2>
        <div>
          {resumeProofLinks.map(([label, href]) => (
            <Link key={href} to={href}>
              {label}
              <ArrowRight size={17} />
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
