import { Link, useParams } from "react-router";
import Seo from "../components/Seo";
import { getBlogPost } from "../content/blog";

export default function BlogArticle() {
  const { slug } = useParams<{ slug?: string }>();
  const post = getBlogPost(slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#faf8f3] px-6 py-16 text-[#121212]">
        <Seo
          title="Article Not Found | ProofOfAIWork"
          description="This article could not be found."
          canonical={`https://proofofaiwork.com/blog/${slug || ""}`}
          robots="noindex,nofollow"
        />
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl tracking-tight">Article not found.</h1>
          <Link to="/blog" className="mt-6 inline-block text-[14px] text-[#315D8A] hover:underline">
            Back to blog
          </Link>
        </div>
      </div>
    );
  }

  const canonical = `https://proofofaiwork.com/blog/${post.slug}`;

  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#121212]">
      <Seo
        title={`${post.title} | ProofOfAIWork`}
        description={post.description}
        canonical={canonical}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.description,
            datePublished: post.publishedAt,
            url: canonical,
            author: {
              "@type": "Organization",
              name: "ProofOfAIWork",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Blog", item: "https://proofofaiwork.com/blog" },
              { "@type": "ListItem", position: 2, name: post.title, item: canonical },
            ],
          },
        ]}
      />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/blog" className="text-[14px] text-[#6b6b66] hover:text-[#121212]">
          Back to blog
        </Link>
        <div className="mt-8 text-[11px] uppercase tracking-[0.16em] text-[#6b6b66]">{post.eyebrow}</div>
        <h1 className="mt-4 text-5xl leading-[1.02] tracking-tight">{post.title}</h1>
        <p className="mt-5 text-[18px] leading-[1.7] text-[#3f3f3a]">{post.description}</p>
        <div className="mt-4 text-[12px] text-[#6b6b66]">{post.publishedAt}</div>

        <article className="mt-12 space-y-10">
          {post.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl tracking-tight">{section.heading}</h2>
              <div className="mt-4 space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-[16px] leading-[1.8] text-[#2f2f2b]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </article>

        <section className="mt-14 rounded-3xl border border-[rgba(0,0,0,0.08)] bg-[#111114] px-8 py-10 text-white">
          <div className="text-[11px] uppercase tracking-[0.16em] text-[rgba(255,255,255,0.58)]">Next step</div>
          <h2 className="mt-3 text-3xl tracking-tight">Turn AI-assisted work into proof.</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-[rgba(255,255,255,0.74)]">
            Build a verified AI portfolio with public proof pages, evidence-backed projects, and visible process.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/upload" className="rounded-lg bg-white px-4 py-2 text-[14px] font-medium text-[#111114]">
              Start your proof
            </Link>
            <Link to="/explore" className="rounded-lg border border-[rgba(255,255,255,0.16)] px-4 py-2 text-[14px] text-white">
              Explore public proof
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
