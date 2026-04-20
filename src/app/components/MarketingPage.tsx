import { Link } from "react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Seo from "./Seo";

type MarketingPageProps = {
  title: string;
  description: string;
  canonical: string;
  eyebrow: string;
  h1: string;
  intro: string;
  sections: Array<{ title: string; body: string }>;
};

export default function MarketingPage({
  title,
  description,
  canonical,
  eyebrow,
  h1,
  intro,
  sections,
}: MarketingPageProps) {
  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#121212]">
      <Seo title={title} description={description} canonical={canonical} />
      <header className="sticky top-0 z-20 border-b border-[rgba(0,0,0,0.08)] bg-[rgba(250,248,243,0.92)] backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-[14px] text-[#6b6b66] hover:text-[#121212]">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="text-[14px] font-medium tracking-tight">Proof of AI Work</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14">
        <div className="max-w-3xl">
          <div className="text-[11px] uppercase tracking-[0.16em] text-[#6b6b66]">{eyebrow}</div>
          <h1 className="mt-4 text-5xl leading-[0.98] tracking-tight md:text-6xl">{h1}</h1>
          <p className="mt-6 text-[18px] leading-[1.7] text-[#3f3f3a]">{intro}</p>
        </div>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {sections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
              <h2 className="text-[18px] font-medium tracking-tight text-[#121212]">{section.title}</h2>
              <p className="mt-3 text-[14px] leading-[1.7] text-[#55554f]">{section.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 rounded-3xl border border-[rgba(0,0,0,0.08)] bg-[#111114] px-8 py-10 text-white">
          <div className="text-[11px] uppercase tracking-[0.16em] text-[rgba(255,255,255,0.58)]">Next step</div>
          <h2 className="mt-3 text-3xl tracking-tight">Turn AI-assisted work into proof.</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-[1.7] text-[rgba(255,255,255,0.74)]">
            Upload conversations, exports, and artifacts to build a verified AI portfolio with evidence, process, and public proof.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/upload" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-[14px] font-medium text-[#111114]">
              Start your proof
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/explore" className="inline-flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.16)] px-4 py-2 text-[14px] text-white">
              Explore public proof pages
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
