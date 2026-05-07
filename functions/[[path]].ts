import { blogPosts } from "../src/marketing/content/blog";
import { quizzes } from "../src/marketing/data/quiz";
import { comparisonPages, roleLeveragePages } from "../src/marketing/data/seoExpansion";
import { archetypes, glossarySeedConcepts } from "../src/marketing/data/taxonomy";
import { acquisitionPages, yourAiResumePages } from "../src/marketing/acquisition";
import { SITE_BASE, type Env, esc } from "./_lib/meta";

type PageMeta = {
  title: string;
  description: string;
  canonical: string;
  type?: "website" | "article";
};

const staticMeta: Record<string, Omit<PageMeta, "canonical">> = {
  "/": {
    title: "Don't just say you're AI-capable. Proof it. | ProofOfAIWork",
    description:
      "Turn real AI-assisted work into verified proof artifacts employers, clients, and teams can actually inspect.",
  },
  "/scores": {
    title: "AI Work Scores explained | ProofOfAIWork",
    description:
      "AI Work Scores measure ownership, execution, judgment, iteration quality, evidence strength, and how effectively AI was leveraged to produce real outcomes.",
  },
  "/archetypes": {
    title: "AI work archetypes | ProofOfAIWork",
    description:
      "The ProofOfAIWork archetype taxonomy describes observable AI work patterns without pretending to be psychology.",
  },
  "/glossary": {
    title: "AI work glossary | ProofOfAIWork",
    description:
      "Plain-English definitions for AI work samples, AI leverage, proof artifacts, AI skills assessment, and AI-assisted workflows.",
  },
  "/enterprise/hiring-ai-capable-talent": {
    title: "Hiring AI-capable talent | ProofOfAIWork",
    description:
      "Evaluate demonstrated AI capability through public-safe work samples, proof artifacts, and structured human review.",
  },
  "/enterprise/workforce-amplification": {
    title: "Workforce amplification | ProofOfAIWork",
    description:
      "Map where teams can produce better, faster, and more repeatable work with AI through evidence-based capability review.",
  },
  "/community": {
    title: "Community proof archive | ProofOfAIWork",
    description: "Browse public ProofOfAIWork capability artifacts when operators choose to publish them.",
  },
  "/examples": {
    title: "Examples | ProofOfAIWork",
    description: "Concrete ProofOfAIWork specimen examples and demonstration artifacts.",
  },
  "/employers": {
    title: "For employers | ProofOfAIWork",
    description: "Evaluate real AI work patterns with ProofOfAIWork.",
  },
  "/job-seekers": {
    title: "For job seekers | ProofOfAIWork",
    description: "Prove AI fluency with a verified AI Work Score and shareable proof page.",
  },
  "/about": {
    title: "About | ProofOfAIWork",
    description: "ProofOfAIWork helps people turn real AI usage into structured, verifiable work profiles.",
  },
  "/blog": {
    title: "Blog | ProofOfAIWork",
    description: "Essays and guides on AI fluency, AI-assisted work, hiring, and proof.",
  },
  "/quizzes": {
    title: "AI work quizzes | ProofOfAIWork",
    description: "Take lightweight ProofOfAIWork quizzes before verifying real AI work.",
  },
  "/demo": {
    title: "Demo surfaces | ProofOfAIWork",
    description: "Specimen proof cards, public proof pages, and dossier examples for ProofOfAIWork.",
  },
  "/demo/cards": {
    title: "Demo proof cards | ProofOfAIWork",
    description: "Standalone specimen ProofCard variants for ProofOfAIWork.",
  },
  "/demo/proofs": {
    title: "Demo proof dossiers | ProofOfAIWork",
    description: "Six specimen full proof examples for ProofOfAIWork.",
  },
  "/demo/dossiers": {
    title: "Demo dossiers | ProofOfAIWork",
    description: "Founder, operator, researcher, and recruiter specimen dossiers.",
  },
  "/privacy": {
    title: "Privacy | ProofOfAIWork",
    description: "Privacy for ProofOfAIWork.",
  },
  "/terms": {
    title: "Terms | ProofOfAIWork",
    description: "Terms for ProofOfAIWork.",
  },
};

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname || "/";
}

function withCanonical(pathname: string, meta: Omit<PageMeta, "canonical">): PageMeta {
  return { ...meta, canonical: `${SITE_BASE}${pathname}` };
}

function routeMeta(pathname: string): PageMeta | null {
  const path = normalizePath(pathname);

  if (staticMeta[path]) return withCanonical(path, staticMeta[path]);

  const archetype = path.startsWith("/archetypes/")
    ? archetypes.find((item) => path === `/archetypes/${item.slug}`)
    : null;
  if (archetype) {
    return withCanonical(path, {
      title: `${archetype.name} AI work archetype | ProofOfAIWork`,
      description: `${archetype.meaning} Learn proof signals, best-fit roles, blind spots, and enterprise interpretation.`,
      type: "article",
    });
  }

  const glossary = path.startsWith("/glossary/")
    ? glossarySeedConcepts.find((item) => path === `/glossary/${item.slug}`)
    : null;
  if (glossary) {
    return withCanonical(path, {
      title: `${glossary.term}: definition | ProofOfAIWork`,
      description: `${glossary.definition} Learn why it matters for proof, hiring, and AI-assisted work evaluation.`,
      type: "article",
    });
  }

  const rolePage = path.startsWith("/ai-leverage/")
    ? roleLeveragePages.find((page) => path === `/ai-leverage/${page.slug}`)
    : null;
  if (rolePage) {
    return withCanonical(path, {
      title: `${rolePage.title} | ProofOfAIWork`,
      description: rolePage.description,
      type: "article",
    });
  }

  const comparison = path.startsWith("/compare/")
    ? comparisonPages.find((page) => path === `/compare/${page.slug}`)
    : null;
  if (comparison) {
    return withCanonical(path, {
      title: `${comparison.title} | ProofOfAIWork`,
      description: comparison.description,
      type: "article",
    });
  }

  const acquisition = acquisitionPages.find((page) => path === `/${page.slug}`);
  if (acquisition) {
    return withCanonical(path, {
      title: `${acquisition.seoTitle} | ProofOfAIWork`,
      description: acquisition.metaDescription,
      type: "article",
    });
  }

  const resumeRoot = yourAiResumePages.find((page) => path === `/${page.slug}`);
  const resumeNested = path.startsWith("/your-ai-resume/")
    ? yourAiResumePages.find((page) => path === `/your-ai-resume/${page.slug}`)
    : null;
  const resumePage = resumeRoot || resumeNested || (path === "/resume-is-dead" ? yourAiResumePages[0] : null);
  if (resumePage) {
    return withCanonical(path, {
      title: `${resumePage.seoTitle} | ProofOfAIWork`,
      description: resumePage.metaDescription,
      type: "article",
    });
  }

  const post = path.startsWith("/blog/") ? blogPosts.find((item) => path === `/blog/${item.slug}`) : null;
  if (post) {
    return withCanonical(path, {
      title: `${post.seoTitle} | ProofOfAIWork`,
      description: post.seoDescription,
      type: "article",
    });
  }

  const quiz = path.startsWith("/quizzes/") ? quizzes.find((item) => path === `/quizzes/${item.slug}`) : null;
  if (quiz) {
    return withCanonical(path, {
      title: `${quiz.title} | ProofOfAIWork`,
      description: quiz.description,
    });
  }

  return null;
}

function injectMeta(html: string, meta: PageMeta) {
  const tags = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<link rel="canonical" href="${esc(meta.canonical)}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:type" content="${esc(meta.type || "website")}" />`,
    `<meta property="og:url" content="${esc(meta.canonical)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
  ].join("\n      ");

  let next = html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name=["']description["'][^>]*>\s*/i, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/i, "")
    .replace(/<meta\s+(?:property|name)=["'](?:og:title|og:description|og:type|og:url|twitter:card|twitter:title|twitter:description)["'][^>]*>\s*/gi, "");

  return next.replace("</head>", `      ${tags}\n    </head>`);
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== "GET") return env.ASSETS.fetch(request);

  const url = new URL(request.url);
  const response = await env.ASSETS.fetch(request);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  const meta = routeMeta(url.pathname);
  if (!meta) return response;

  const html = await response.text();
  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  return new Response(injectMeta(html, meta), {
    status: response.status,
    headers,
  });
};
