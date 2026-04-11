import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="text-[15px] tracking-tight">Proof of AI Work</div>
        <Button variant="outline" size="sm" onClick={() => navigate("/sign-in")}>
          Sign In
        </Button>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-8 pt-24 pb-40">
        <div className="text-center">
          <h1 className="mb-8 text-8xl tracking-tight leading-[0.95] drop-shadow-sm">
            Turn AI work
            <br />
            into proof.
          </h1>
          <p className="mx-auto mb-16 max-w-2xl text-2xl text-[#717182] leading-relaxed">
            Upload your ChatGPT, Claude, or Grok conversations. See how you actually think,
            direct, and execute with AI.
          </p>
          <div className="flex items-center justify-center gap-6">
            <Button
              size="lg"
              className="h-16 min-w-[280px] text-xl font-medium shadow-lg hover:shadow-xl transition-shadow"
              onClick={() => navigate("/upload")}
            >
              Upload your conversations
            </Button>
            <button
              className="text-lg text-[#717182] underline underline-offset-8 hover:text-[#030213] transition-colors"
              onClick={() => {
                const whatItShowsSection = document.getElementById("how-it-works");
                whatItShowsSection?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See how it works
            </button>
          </div>
        </div>
      </section>

      {/* Before vs After */}
      <section className="border-y border-[rgba(0,0,0,0.12)] bg-[#030213] py-32">
        <div className="mx-auto max-w-6xl px-8">
          <div className="mb-12 text-center text-sm uppercase tracking-widest text-[#717182]">
            From noise → structure
          </div>

          <div className="grid grid-cols-2 gap-12">
            {/* Left: Raw */}
            <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-10 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]">
              <h3 className="mb-8 text-3xl tracking-tight text-[#717182]">
                Raw Conversations
              </h3>
              <div className="space-y-4 text-base text-[#717182]">
                <div className="opacity-50">— unstructured chat logs</div>
                <div className="opacity-50">— vague output</div>
                <div className="opacity-50">— no clear ownership</div>
              </div>
            </div>

            {/* Right: Structured */}
            <div className="rounded-lg border-2 border-[#00C853] bg-white p-10 shadow-[0_20px_60px_rgba(0,200,83,0.3),0_8px_24px_rgba(0,0,0,0.15)]">
              <h3 className="mb-8 text-3xl tracking-tight">AI Work Profile</h3>
              <div className="space-y-4 text-base">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-[#00C853]" />
                  organized projects
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-[#00C853]" />
                  clear verdict
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-[#00C853]" />
                  strength + gap
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What This Shows */}
      <section id="how-it-works" className="py-32">
        <div className="mx-auto max-w-5xl px-8">
          <h2 className="mb-20 text-center text-5xl tracking-tight">
            What you actually did
          </h2>

          <div className="grid grid-cols-3 gap-12">
            <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-md hover:shadow-xl transition-shadow">
              <h3 className="mb-4 text-2xl tracking-tight">Human Leadership</h3>
              <p className="text-lg text-[#717182]">Did you direct the work?</p>
            </div>

            <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-md hover:shadow-xl transition-shadow">
              <h3 className="mb-4 text-2xl tracking-tight">AI Execution</h3>
              <p className="text-lg text-[#717182]">
                How much did AI actually do?
              </p>
            </div>

            <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-md hover:shadow-xl transition-shadow">
              <h3 className="mb-4 text-2xl tracking-tight">Cognitive Amplification</h3>
              <p className="text-lg text-[#717182]">
                How much did AI increase your output?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Output Preview */}
      <section className="border-y border-[rgba(0,0,0,0.12)] bg-gradient-to-b from-white to-[#FAFAFA] py-32">
        <div className="mx-auto max-w-3xl px-8">
          <Card className="border-2 border-[rgba(0,0,0,0.12)] p-12 shadow-[0_24px_64px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.08)]">
            <div className="mb-10 space-y-4 text-2xl leading-relaxed">
              <p className="font-medium">You get results.</p>
              <p className="text-[#717182]">But not consistently.</p>
              <p className="text-[#717182]">
                You rely on iteration instead of structure.
              </p>
            </div>

            <div className="mb-10 rounded-lg border-4 border-[var(--score-execution)] bg-[#FAFAFA] p-8 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3 text-xs uppercase tracking-widest text-[#717182]">
                Your Level
              </div>
              <div className="text-6xl tracking-tight font-medium">ADVANCED–INTERMEDIATE</div>
            </div>

            <div className="space-y-5 text-base">
              <div className="rounded-lg bg-[#FAFAFA] p-6 border border-[rgba(0,0,0,0.06)] shadow-sm">
                <div className="mb-2 text-xs uppercase tracking-widest text-[#717182]">
                  Strength
                </div>
                <p className="text-lg">You control direction and get outcomes</p>
              </div>

              <div className="rounded-lg bg-[#FAFAFA] p-6 border border-[rgba(0,0,0,0.06)] shadow-sm">
                <div className="mb-2 text-xs uppercase tracking-widest text-[#717182]">
                  Gap
                </div>
                <p className="text-lg">You don't define constraints early</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* For Students / For Operators */}
      <section className="py-32">
        <div className="mx-auto max-w-6xl px-8">
          <div className="grid grid-cols-2 gap-12">
            <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-12 shadow-lg hover:shadow-2xl transition-shadow">
              <h3 className="mb-6 text-4xl tracking-tight">For students</h3>
              <div className="space-y-3 text-xl text-[#717182]">
                <p>— prove your work is yours</p>
                <p>— show what you directed vs AI</p>
              </div>
            </div>

            <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-12 shadow-lg hover:shadow-2xl transition-shadow">
              <h3 className="mb-6 text-4xl tracking-tight">For operators</h3>
              <div className="space-y-3 text-xl text-[#717182]">
                <p>— see how you actually work</p>
                <p>— identify where you waste cycles</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Section */}
      <section className="border-y border-[rgba(0,0,0,0.12)] bg-gradient-to-b from-[#FAFAFA] to-white py-32">
        <div className="mx-auto max-w-3xl px-8 text-center">
          <h2 className="mb-12 text-5xl tracking-tight drop-shadow-sm">Free for students.</h2>

          <div className="mb-12 space-y-6 text-2xl leading-relaxed">
            <p>Upload your conversations.</p>
            <p className="text-[#717182]">See how you actually work with AI.</p>
          </div>

          <div className="mb-6 text-xl text-[#717182]">
            Your proof page is public by default.
          </div>

          <div className="mb-12 text-xl">
            Because proof is meant to be seen.
          </div>

          <Button
            size="lg"
            className="h-14 min-w-[240px] text-lg font-medium shadow-lg hover:shadow-xl transition-shadow"
            onClick={() => navigate("/upload")}
          >
            Upload your work
          </Button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-40 bg-gradient-to-b from-[#030213] to-[#000000]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,200,83,0.08),transparent_50%)]"></div>
        <div className="relative mx-auto max-w-3xl px-8 text-center">
          <h2 className="mb-4 text-6xl tracking-tight text-white leading-tight drop-shadow-lg">
            Upload one conversation.
          </h2>
          <h2 className="mb-12 text-6xl tracking-tight text-white leading-tight drop-shadow-lg">
            Get your verdict.
          </h2>
          <Button
            size="lg"
            className="h-16 min-w-[280px] text-xl font-medium bg-white text-[#030213] hover:bg-[#F5F5F7] shadow-[0_20px_60px_rgba(255,255,255,0.2),0_8px_24px_rgba(255,255,255,0.15)] hover:shadow-[0_24px_80px_rgba(255,255,255,0.3),0_12px_32px_rgba(255,255,255,0.2)] transition-shadow"
            onClick={() => navigate("/upload")}
          >
            Upload now
            <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
        </div>
      </section>
    </div>
  );
}
