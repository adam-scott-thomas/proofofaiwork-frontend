import { Link, Navigate } from "react-router";
import {
  ArrowRight,
  Check,
  FileJson,
  FileText,
  Layers,
  Lock,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Upload as UploadIcon,
  X,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import Seo from "../components/Seo";

type EvidenceClass = {
  key: "A" | "B" | "C" | "D";
  label: string;
  description: string;
  confidence: string;
  chip: string;
  bar: string;
};

const EVIDENCE_CLASSES: EvidenceClass[] = [
  {
    key: "A",
    label: "Full pipeline",
    description: "Prompt → output → iteration → final artifact. Complete process visibility.",
    confidence: "High",
    chip: "bg-[#1F6A3F] text-white",
    bar: "w-full",
  },
  {
    key: "B",
    label: "Chat + iteration",
    description: "Platform-exported chat with visible iteration history. Strong behavioral signal.",
    confidence: "High",
    chip: "bg-[#486E9B] text-white",
    bar: "w-[72%]",
  },
  {
    key: "C",
    label: "Artifact + context",
    description: "Standalone final artifact with user-provided explanation of the process.",
    confidence: "Moderate",
    chip: "bg-[#C18A2E] text-white",
    bar: "w-[40%]",
  },
  {
    key: "D",
    label: "Low context",
    description: "Screenshots, partial transcripts, or minimal-context submissions.",
    confidence: "Low",
    chip: "bg-[#8B2F2F] text-white",
    bar: "w-[18%]",
  },
];

type SupportedSource = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  note: string;
  evidenceClass: EvidenceClass["key"];
};

const SUPPORTED_SOURCES: SupportedSource[] = [
  { icon: FileJson, label: "claude.ai conversation export", note: "Official JSON export.", evidenceClass: "B" },
  { icon: FileJson, label: "ChatGPT export", note: "conversations.json from an OpenAI export.", evidenceClass: "B" },
  { icon: MessagesSquare, label: "Cursor / VSCode chat", note: "Pasted in markdown or JSON.", evidenceClass: "C" },
  { icon: FileText, label: "Plaintext transcripts", note: "You stripped and pasted. Still works.", evidenceClass: "C" },
];

const PIPELINE_STEPS = [
  {
    title: "Parse",
    description: "Extract task type, prompt structure, iteration turns, and verification signals. No LLM in this step.",
  },
  {
    title: "Normalize",
    description: "Per-file then aggregate normalization. Drops conversational fluff, keeps decision points.",
  },
  {
    title: "Evaluate",
    description: "Structured rubrics per dimension. Same prompt, same answer — determinism comes from the rubric.",
  },
  {
    title: "Profile",
    description: "Combine observations into a work profile with strengths, weaknesses, confidence, and evidence.",
  },
  {
    title: "Proof page",
    description: "You choose headline, visible dimensions, and which excerpts are public. Private by default.",
  },
];

const DONT_DO = [
  "Score IQ or personality",
  "Rank users against each other",
  "Claim AI-model loyalty",
  "Expose raw uploads",
  "Publish anything without your consent",
  "Fake precision with a single trust number",
];

export default function UploadFlow() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated()) {
    return <Navigate to="/app/upload/new" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <Seo
        title="Upload AI Work | Build a Verified AI Portfolio"
        description="Upload conversations, exports, and artifacts to turn AI-assisted work into an evidence-backed proof page and verified AI portfolio."
        canonical="https://proofofaiwork.com/upload"
      />
      <div className="mx-auto max-w-5xl px-8 py-16">
        <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Upload flow</div>
        <h1 className="mt-3 text-5xl leading-[1.02] tracking-tight md:text-6xl">
          Upload a conversation.<br />
          <span className="italic text-[#5C5C5C]">Get a proof of capability.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-[18px] leading-[1.55] text-[#5C5C5C]">
          Drop in one or more AI chat exports. The platform parses them, observes how you work with AI,
          and builds a curated public page with the evidence attached. You decide what's visible before it ships.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/sign-in?next=/app/upload/new">
            <Button size="lg">
              Sign in to upload
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/proof-of-ai-work">
            <Button size="lg" variant="outline">
              Browse published proof
            </Button>
          </Link>
        </div>

        {/* SUPPORTED SOURCES */}
        <section className="mt-16">
          <SectionEyebrow>Step 1 · Drop files</SectionEyebrow>
          <h2 className="mt-2 text-2xl tracking-tight">What counts as a conversation.</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {SUPPORTED_SOURCES.map((source) => {
              const Icon = source.icon;
              return (
                <Card key={source.label} className="border border-[#D8D2C4] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#315D8A]" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] text-[#161616]">{source.label}</div>
                      <div className="mt-0.5 text-[12px] text-[#6B6B66]">{source.note}</div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${
                      EVIDENCE_CLASSES.find((classInfo) => classInfo.key === source.evidenceClass)?.chip ?? ""
                    }`}>
                      Class {source.evidenceClass}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* EVIDENCE CLASSES */}
        <section className="mt-16">
          <SectionEyebrow>Step 2 · Evidence grading</SectionEyebrow>
          <h2 className="mt-2 text-2xl tracking-tight">Not every upload carries the same weight.</h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#5C5C5C]">
            Every file is classified by completeness and context. Higher classes anchor stronger observations.
            The trust panel on your public page shows the class breakdown so viewers can judge for themselves.
          </p>
          <div className="mt-6 space-y-2">
            {EVIDENCE_CLASSES.map((classInfo) => (
              <div key={classInfo.key} className="grid grid-cols-[auto_80px_1fr_auto] items-center gap-4 rounded-lg border border-[#D8D2C4] bg-white px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.1em] ${classInfo.chip}`}>
                  Class {classInfo.key}
                </span>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#EAE3CF]">
                  <div className={`h-full ${classInfo.chip.split(" ")[0]} ${classInfo.bar}`} />
                </div>
                <div>
                  <div className="text-[13px] text-[#161616]">{classInfo.label}</div>
                  <div className="mt-0.5 text-[11px] text-[#6B6B66]">{classInfo.description}</div>
                </div>
                <span className="text-[11px] text-[#6B6B66]">{classInfo.confidence} confidence</span>
              </div>
            ))}
          </div>
        </section>

        {/* PIPELINE */}
        <section className="mt-16">
          <SectionEyebrow>Step 3 · What the pipeline does</SectionEyebrow>
          <h2 className="mt-2 text-2xl tracking-tight">Parse, normalize, evaluate, publish.</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {PIPELINE_STEPS.map((step, index) => (
              <Card key={step.title} className="border border-[#D8D2C4] bg-white p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[#6B6B66]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="mt-1 text-[14px] text-[#161616]">{step.title}</div>
                <div className="mt-2 text-[11px] leading-relaxed text-[#6B6B66]">{step.description}</div>
              </Card>
            ))}
          </div>
        </section>

        {/* TRUST */}
        <section className="mt-16 grid gap-6 md:grid-cols-[1.1fr_1fr]">
          <div>
            <SectionEyebrow>Trust model</SectionEyebrow>
            <h2 className="mt-2 text-2xl tracking-tight">Private by default. Approved at the excerpt level.</h2>
            <div className="mt-4 space-y-3 text-[14px] leading-relaxed text-[#5C5C5C]">
              <TrustRow icon={Lock} text="Uploads are private. Nothing is shared automatically." />
              <TrustRow icon={Check} text="You review every excerpt before it's visible. Redact sensitive context." />
              <TrustRow icon={ShieldCheck} text="Observations trace to a specific moment in your source material." />
              <TrustRow icon={Layers} text="The trust panel shows sample size, evidence classes, engine version, disputes." />
              <TrustRow icon={Sparkles} text="Revoke visibility any time. Delete source material permanently." />
            </div>
          </div>

          <Card className="border border-[#D8D2C4] bg-white p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-[#6B6B66]">What we don't do</div>
            <ul className="mt-3 space-y-2 text-[13px] text-[#161616]">
              {DONT_DO.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <X className="h-4 w-4 shrink-0 text-[#8B2F2F]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* SIGNUP FOOTER */}
        <section className="mt-16 rounded-2xl bg-[#161616] px-8 py-10 text-[#F7F4ED]">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="text-[12px] uppercase tracking-[0.16em] text-[#C0B99B]">Ready?</div>
              <h2 className="mt-2 text-3xl tracking-tight">Turn one conversation into one proof page.</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#C0B99B]">
                Magic link auth. No password. The upload route after sign-in is{" "}
                <span className="font-mono text-white">/app/upload/new</span>.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/sign-in?next=/app/upload/new">
                <Button size="lg" className="bg-[#F7F4ED] text-[#161616] hover:bg-white">
                  <UploadIcon className="mr-2 h-5 w-5" />
                  Sign in and upload
                </Button>
              </Link>
              <Link to="/" className="text-center text-[12px] text-[#C0B99B] underline">
                Back to landing
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-[0.18em] text-[#6B6B66]">{children}</div>;
}

function TrustRow({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-md border border-[#D8D2C4] bg-white p-1.5">
        <Icon className="h-3.5 w-3.5 text-[#315D8A]" />
      </div>
      <span>{text}</span>
    </div>
  );
}
