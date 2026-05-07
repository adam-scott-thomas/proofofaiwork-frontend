import { BLOG_POSTS } from "../src/app/content/blog";
import { QUIZ_RESULTS } from "../src/app/content/quiz";
import { comparisonPages, roleLeveragePages } from "../src/marketing/data/seoExpansion";
import { archetypes, glossarySeedConcepts } from "../src/marketing/data/taxonomy";
import { allSeoPages, yourAiResumePages } from "../src/marketing/seo-opportunities";
import { API_BASE, SITE_BASE } from "./_lib/meta";

type PublicIndex = {
  proof_pages: Array<{ url: string; updated_at?: string | null; published_at?: string | null }>;
  portfolios: Array<{ url: string; updated_at?: string | null }>;
};

function xmlUrl(loc: string, lastmod?: string | null) {
  return `<url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
}

export const onRequestGet: PagesFunction = async () => {
  let index: PublicIndex = { proof_pages: [], portfolios: [] };

  try {
    const res = await fetch(`${API_BASE}/public-index`, {
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      index = (await res.json()) as PublicIndex;
    }
  } catch {
    // fall back to static-only sitemap
  }

  const staticUrls = [
    "/",
    "/students",
    "/employers",
    "/how-it-works",
    "/proof-of-ai-work",
    "/ai-portfolio",
    "/upload",
    "/explore",
    "/quiz",
    "/blog",
    "/archetypes",
    "/glossary",
    "/enterprise/hiring-ai-capable-talent",
    "/enterprise/workforce-amplification",
  ];

  const urls = [
    ...staticUrls.map((path) => xmlUrl(`${SITE_BASE}${path}`)),
    ...archetypes.map((archetype) => xmlUrl(`${SITE_BASE}/archetypes/${archetype.slug}`)),
    ...glossarySeedConcepts.map((concept) => xmlUrl(`${SITE_BASE}/glossary/${concept.slug}`)),
    ...roleLeveragePages.map((page) => xmlUrl(`${SITE_BASE}/ai-leverage/${page.slug}`)),
    ...comparisonPages.map((page) => xmlUrl(`${SITE_BASE}/compare/${page.slug}`)),
    ...allSeoPages.filter((page) => page.slug !== "examples").map((page) => xmlUrl(`${SITE_BASE}/${page.slug}`)),
    xmlUrl(`${SITE_BASE}/resume-is-dead`),
    ...yourAiResumePages.map((page) => xmlUrl(`${SITE_BASE}/${page.slug}`)),
    ...yourAiResumePages
      .filter((page) => page.slug !== "your-ai-resume")
      .map((page) => xmlUrl(`${SITE_BASE}/your-ai-resume/${page.slug}`)),
    ...BLOG_POSTS.map((post) => xmlUrl(`${SITE_BASE}/blog/${post.slug}`, post.publishedAt)),
    ...QUIZ_RESULTS.map((result) => xmlUrl(`${SITE_BASE}/quiz/${result.slug}`)),
    ...index.proof_pages.map((page) => xmlUrl(`${SITE_BASE}${page.url}`, page.updated_at || page.published_at)),
    ...index.portfolios.map((portfolio) => xmlUrl(`${SITE_BASE}${portfolio.url}`, portfolio.updated_at)),
  ].join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
};
