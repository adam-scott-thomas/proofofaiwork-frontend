import { ArrowRight, Globe, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <nav className="flex items-center justify-between border-b border-[#D8D2C4] bg-[#FBF8F1] px-8 py-5">
        <div>
          <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Proof of AI Work</div>
          <div className="mt-1 text-[15px] tracking-tight">Evidence for human-led AI work</div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/directory">
            <Button variant="outline">Browse directory</Button>
          </Link>
          <Link to="/sign-in">
            <Button>Sign in</Button>
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-8 py-20">
        <div className="max-w-4xl">
          <div className="text-[12px] uppercase tracking-[0.18em] text-[#6B6B66]">Home</div>
          <h1 className="mt-4 text-7xl leading-[0.94] tracking-tight">
            Turn conversation
            <br />
            into evidence.
          </h1>
          <p className="mt-6 max-w-2xl text-[20px] leading-9 text-[#5C5C5C]">
            Upload AI conversations, group them into projects, evaluate what the work proves, and publish a proof page
            you can actually send to someone else.
          </p>
          <div className="mt-8 flex gap-4">
            <Button size="lg" onClick={() => navigate("/upload")}>
              Start with an upload
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Link to="/directory">
              <Button size="lg" variant="outline">
                <Globe className="mr-2 h-5 w-5" />
                Browse public proof
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-3 gap-4">
          <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
            <div className="text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">1. Upload</div>
            <div className="mt-3 text-[20px] tracking-tight">Bring in raw conversation exports.</div>
            <div className="mt-2 text-[14px] leading-7 text-[#5C5C5C]">JSON, TXT, markdown, and merged transcripts all route into the same intake path.</div>
          </Card>
          <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
            <div className="text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">2. Structure</div>
            <div className="mt-3 text-[20px] tracking-tight">Assign conversations to projects.</div>
            <div className="mt-2 text-[14px] leading-7 text-[#5C5C5C]">Cluster them, rename them, inspect the transcript, and move them where they belong.</div>
          </Card>
          <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
            <div className="text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">3. Publish</div>
            <div className="mt-3 text-[20px] tracking-tight">Share a proof page with real evidence behind it.</div>
            <div className="mt-2 text-[14px] leading-7 text-[#5C5C5C]">Evaluate, edit a public headline, publish, and opt it into the directory.</div>
          </Card>
        </div>

        <Card className="mt-14 border border-[#D8D2C4] bg-[#FBF8F1] p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1 h-6 w-6 text-[#315D8A]" />
            <div>
              <div className="text-[22px] tracking-tight">This should feel like an archive, not a funnel.</div>
              <div className="mt-3 max-w-3xl text-[15px] leading-8 text-[#5C5C5C]">
                The product works when each button has a visible consequence: upload creates an assessment, parsing fills the pool,
                clustering creates projects, conversation detail can move a transcript, evaluation produces results, and publish
                creates a public artifact.
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
