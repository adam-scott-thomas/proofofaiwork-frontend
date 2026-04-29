import { Link } from "react-router";
import { ArrowLeft, ArrowRight, BadgeCheck, Sparkles, Radar } from "lucide-react";
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
    <div className="min-h-screen bg-[#07111f] text-white">
      <Seo title={title} description={description} canonical={canonical} />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-5%] h-[420px] w-[420px] rounded-full bg-[rgba(72,130,255,0.18)] blur-3xl" />
        <div className="absolute right-[-8%] top-[10%] h-[360px] w-[360px] rounded-full bg-[rgba(30,215,167,0.14)] blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] h-[320px] w-[320px] rounded-full bg-[rgba(255,190,92,0.12)] blur-3xl" />
      </div>
      <header className="sticky top-0 z-20 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(7,17,31,0.72)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-[13px] text-[rgba(255,255,255,0.64)] hover:text-white sm:text-[14px]">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="text-[13px] font-medium tracking-tight text-white sm:text-[14px]">Proof of AI Work</div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="grid gap-8 lg:grid-cols-[1.15fr,0.85fr] lg:items-start">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[rgba(255,255,255,0.68)]">
              <Sparkles className="h-3.5 w-3.5" />
              {eyebrow}
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl leading-[0.94] tracking-tight text-white sm:text-5xl md:text-7xl">{h1}</h1>
            <p className="mt-5 max-w-3xl text-[16px] leading-[1.75] text-[rgba(255,255,255,0.76)] sm:mt-6 sm:text-[19px]">{intro}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/upload" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-[14px] font-medium text-[#07111f] shadow-[0_16px_50px_rgba(255,255,255,0.18)] sm:w-auto">
                Start your proof
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/explore" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-5 py-3 text-[14px] text-white sm:w-auto">
                Explore public proof
              </Link>
            </div>
          </div>

          <aside className="rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.32)] sm:rounded-[28px] sm:p-6">
            <div className="text-[11px] uppercase tracking-[0.16em] text-[rgba(255,255,255,0.54)]">Why it converts</div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.14)] p-4">
                <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-[rgba(255,255,255,0.54)]">
                  <BadgeCheck className="h-4 w-4 text-[#73e0bf]" />
                  Trust signal
                </div>
                <div className="mt-2 text-[22px] tracking-tight">Evidence over polish</div>
                <p className="mt-2 text-[14px] leading-[1.7] text-[rgba(255,255,255,0.7)]">
                  This page should feel like a product campaign, but it still sells verification, process, and hiring signal.
                </p>
              </div>
              <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.14)] p-4">
                <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-[rgba(255,255,255,0.54)]">
                  <Radar className="h-4 w-4 text-[#8bb6ff]" />
                  Outcome
                </div>
                <div className="mt-2 text-[22px] tracking-tight">Clear enough to share</div>
                <p className="mt-2 text-[14px] leading-[1.7] text-[rgba(255,255,255,0.7)]">
                  The right person should understand the product fast, then click through to upload or explore without friction.
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-10 grid gap-4 md:mt-12 md:grid-cols-3">
          {sections.map((section, index) => (
            <div
              key={section.title}
              className="rounded-[22px] border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] sm:rounded-[24px] sm:p-6"
            >
              <div className="text-[11px] uppercase tracking-[0.16em] text-[rgba(255,255,255,0.45)]">
                0{index + 1}
              </div>
              <h2 className="mt-4 text-[22px] font-medium tracking-tight text-white sm:text-[24px]">{section.title}</h2>
              <p className="mt-4 text-[14px] leading-[1.8] text-[rgba(255,255,255,0.72)]">{section.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-[28px] border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(135deg,#eef6ff,#dff3eb_48%,#fff0d3)] px-5 py-8 text-[#07111f] shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:mt-12 sm:rounded-[32px] sm:px-8 sm:py-10">
          <div className="text-[11px] uppercase tracking-[0.16em] text-[rgba(7,17,31,0.56)]">Next step</div>
          <h2 className="mt-3 max-w-3xl text-3xl tracking-tight sm:text-4xl">Anyone can claim they’re good with AI. Show the proof.</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-[1.8] text-[rgba(7,17,31,0.74)]">
            Upload conversations, exports, and artifacts to build a verified AI portfolio with evidence, process, and public proof that actually survives a click.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link to="/upload" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#07111f] px-5 py-3 text-[14px] font-medium text-white shadow-[0_16px_40px_rgba(7,17,31,0.24)] sm:w-auto">
              Start your proof
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/explore" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(7,17,31,0.12)] px-5 py-3 text-[14px] text-[#07111f] sm:w-auto">
              Explore public proof pages
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
