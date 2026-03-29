import { Link } from "react-router";
import { ArrowLeft, BookOpen, Shield, Brain, BarChart3, AlertTriangle, Code, GraduationCap } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";

export default function Methodology() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-[14px] text-[#717182] hover:text-[#030213] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="text-[14px] font-medium tracking-tight">
            Proof<span className="text-blue-600">of</span>AI<span className="text-blue-600">Work</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Title */}
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#030213]">Educator Guide & Scoring Methodology</h1>
              <p className="text-[14px] text-[#717182]">Version 2.0.0 — ProofofAIWork Evaluation Engine</p>
            </div>
          </div>
          <p className="text-[15px] leading-relaxed text-[#3A3A3A]">
            This document describes exactly how ProofofAIWork scores AI-assisted student work.
            The scoring model, weights, and thresholds are published here so educators can evaluate
            the system's methodology independently.
          </p>
        </div>

        {/* Quick Reference */}
        <Card className="mb-10 border-2 border-blue-200 bg-blue-50 shadow-sm">
          <CardContent className="p-8">
            <div className="mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-700" />
              <h2 className="text-lg font-bold text-blue-900">How to read a student's AI Work Report in 30 seconds</h2>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-6">
              <div className="rounded-lg bg-white p-5 border border-blue-200">
                <h3 className="mb-2 text-[15px] font-bold text-[#030213]">Student Contribution (0–100%)</h3>
                <p className="text-[13px] leading-relaxed text-[#3A3A3A]">
                  Measures how much the student shaped, directed, and controlled the AI interaction.
                  Based on four dimensions: clarity of direction, problem framing, setting constraints,
                  and iterating on output. A student who arrives knowing what they want, tells the AI
                  specifically what to do, pushes back on bad suggestions, and refines the result scores
                  high — even if the AI produced the literal text.
                </p>
              </div>
              <div className="rounded-lg bg-white p-5 border border-blue-200">
                <h3 className="mb-2 text-[15px] font-bold text-[#030213]">AI Collaboration Quality (0–100%)</h3>
                <p className="text-[13px] leading-relaxed text-[#3A3A3A]">
                  Measures how effectively the student used AI as a tool. Based on four dimensions:
                  checking AI's work, accept/reject decisions, task decomposition, and edge case awareness.
                  A student who verifies output, catches errors, breaks complex tasks into steps, and
                  thinks about what could go wrong scores high.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-5">
              <h3 className="mb-2 text-[14px] font-bold text-amber-900">Key insight for educators</h3>
              <p className="text-[13px] leading-relaxed text-amber-800">
                A high Student Contribution score with high AI Execution Load is <strong>not cheating</strong> — it's
                effective tool use. The student who directs AI to draft an outline, then restructures it, rejects
                half of it, adds their own analysis, and uses AI for editing feedback is demonstrating exactly the
                kind of AI literacy the workforce requires. <strong>The score that matters is whether the student
                was thinking, not whether the student was typing.</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Score Thresholds */}
        <div className="mb-10">
          <h2 className="mb-4 text-lg font-bold text-[#030213]">Score Thresholds</h2>
          <div className="overflow-hidden rounded-lg border border-[rgba(0,0,0,0.08)]">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F5F7]">
                  <th className="px-6 py-3 text-left text-[13px] font-medium text-[#717182]">Range</th>
                  <th className="px-6 py-3 text-left text-[13px] font-medium text-[#717182]">Label</th>
                  <th className="px-6 py-3 text-left text-[13px] font-medium text-[#717182]">What it means</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(0,0,0,0.06)]">
                <tr><td className="px-6 py-3 text-[13px] font-mono text-emerald-700">70–100%</td><td className="px-6 py-3 text-[13px] font-medium">Strong</td><td className="px-6 py-3 text-[13px] text-[#3A3A3A]">Student clearly led the work</td></tr>
                <tr><td className="px-6 py-3 text-[13px] font-mono text-amber-600">40–69%</td><td className="px-6 py-3 text-[13px] font-medium">Mixed</td><td className="px-6 py-3 text-[13px] text-[#3A3A3A]">Some leadership, some passive acceptance</td></tr>
                <tr><td className="px-6 py-3 text-[13px] font-mono text-red-600">0–39%</td><td className="px-6 py-3 text-[13px] font-medium">Weak</td><td className="px-6 py-3 text-[13px] text-[#3A3A3A]">AI did most of the thinking</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* What to look for */}
        <div className="mb-10">
          <h2 className="mb-4 text-lg font-bold text-[#030213]">What to look for on the proof page</h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] p-5">
              <h3 className="mb-1 text-[14px] font-medium text-[#030213]">Evidence excerpts</h3>
              <p className="text-[13px] text-[#3A3A3A]">Direct quotes from the conversation showing the student directing, correcting, or overriding the AI. These are more telling than the scores. If a student has a 75% contribution score and you can read three excerpts where they corrected the AI's source suggestions and restructured its outline, you know the work is theirs.</p>
            </div>
            <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] p-5">
              <h3 className="mb-1 text-[14px] font-medium text-[#030213]">Verification details</h3>
              <p className="text-[13px] text-[#3A3A3A]">Engine version, confidence level, and integrity check. "High confidence" means the conversation had enough data for reliable scoring. "No manipulation detected" means the system found no signs of the conversation being fabricated or edited before upload.</p>
            </div>
            <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] p-5">
              <h3 className="mb-1 text-[14px] font-medium text-[#030213]">The conversation itself</h3>
              <p className="text-[13px] text-[#3A3A3A]">The student uploaded an export of their actual AI conversation. You can ask to see the original. The proof page scores are derived from that conversation, not self-reported.</p>
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#717182]" />
            <h2 className="text-lg font-bold text-[#030213]">The 8 Scoring Dimensions</h2>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 text-[14px] font-bold uppercase tracking-wider text-blue-600">Student Direction (4 dimensions)</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "Clarity", desc: "How clearly the student states intent, requirements, and desired outcomes.", strong: "Specific objectives, structured requirements, output format specified.", weak: "Vague prompts, requires clarification rounds." },
                { name: "Context", desc: "How effectively the student provides background and problem framing.", strong: "Domain identified early, prior work mentioned, explains why they need the output.", weak: "No domain context, AI must guess." },
                { name: "Constraint Quality", desc: "Precision of explicit bounds and requirements.", strong: "Format constraints, length bounds, explicit exclusions.", weak: "No constraints beyond the task itself." },
                { name: "Iteration Discipline", desc: "How the student iterates on AI output.", strong: "Specific feedback on what to change, references specific parts, progressive refinement.", weak: "Generic rejection, restates entire prompt, accepts first response." },
              ].map(d => (
                <div key={d.name} className="rounded-lg border border-[rgba(0,0,0,0.08)] p-4">
                  <h4 className="mb-1 text-[14px] font-medium text-[#030213]">{d.name}</h4>
                  <p className="mb-2 text-[12px] text-[#717182]">{d.desc}</p>
                  <p className="text-[12px]"><span className="font-medium text-emerald-700">Strong:</span> <span className="text-[#3A3A3A]">{d.strong}</span></p>
                  <p className="text-[12px]"><span className="font-medium text-red-600">Weak:</span> <span className="text-[#3A3A3A]">{d.weak}</span></p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-[14px] font-bold uppercase tracking-wider text-purple-600">AI Collaboration (4 dimensions)</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "Verification Habit", desc: "Whether the student checks AI output.", strong: "Cross-references facts, asks AI to verify, tests code.", weak: "Accepts all output without questioning." },
                { name: "Output Judgment", desc: "Ability to evaluate AI output quality.", strong: "Correctly identifies errors, makes informed accept/reject decisions.", weak: "Accepts incorrect output, cannot distinguish quality." },
                { name: "Workflow Efficiency", desc: "How the student structures multi-step work.", strong: "Breaks problems into steps, sequences productively, manages scope.", weak: "Attempts everything in one prompt, no visible structure." },
                { name: "Risk Awareness", desc: "Awareness of edge cases and limitations.", strong: "Questions AI confidence, considers failure modes, asks about limitations.", weak: "No consideration of what could go wrong." },
              ].map(d => (
                <div key={d.name} className="rounded-lg border border-[rgba(0,0,0,0.08)] p-4">
                  <h4 className="mb-1 text-[14px] font-medium text-[#030213]">{d.name}</h4>
                  <p className="mb-2 text-[12px] text-[#717182]">{d.desc}</p>
                  <p className="text-[12px]"><span className="font-medium text-emerald-700">Strong:</span> <span className="text-[#3A3A3A]">{d.strong}</span></p>
                  <p className="text-[12px]"><span className="font-medium text-red-600">Weak:</span> <span className="text-[#3A3A3A]">{d.weak}</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scoring Formula */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#717182]" />
            <h2 className="text-lg font-bold text-[#030213]">Scoring Formula</h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] p-5">
              <h3 className="mb-2 text-[14px] font-medium text-[#030213]">Per-dimension score</h3>
              <p className="text-[13px] text-[#3A3A3A] mb-2">Each dimension is scored 0.0–1.0 by a language model reading the conversation excerpts against the rubric. The LLM evaluator outputs:</p>
              <ul className="space-y-1 text-[13px] text-[#3A3A3A]">
                <li>Score (0.0–1.0)</li>
                <li>Label: "strong" (0.70–1.0), "mixed" (0.40–0.69), or "weak" (0.0–0.39)</li>
                <li>Evidence notes citing specific conversation excerpts</li>
                <li>Confidence score (how much evidence was available)</li>
              </ul>
            </div>

            <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] p-5">
              <h3 className="mb-2 text-[14px] font-medium text-[#030213]">Summary scores</h3>
              <div className="space-y-2 font-mono text-[13px] text-[#3A3A3A]">
                <p>Student Contribution = mean(clarity, context, constraint_quality, iteration_discipline) x 100</p>
                <p>AI Collaboration Quality = mean(verification_habit, output_judgment, workflow_efficiency, risk_awareness) x 100</p>
              </div>
            </div>

            <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] p-5">
              <h3 className="mb-2 text-[14px] font-medium text-[#030213]">Quality gating</h3>
              <p className="text-[13px] text-[#3A3A3A] mb-2">Before evaluation, each dimension is checked for minimum evidence. If a conversation doesn't contain enough signal for a dimension, it is <strong>skipped rather than scored low</strong>. The report shows how many dimensions were evaluated vs skipped.</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[12px] text-[#717182]">
                <p>Clarity: at least 2 user prompts with clear intent</p>
                <p>Verification: at least 1 checking behavior</p>
                <p>Context: at least 1 prompt with problem framing</p>
                <p>Output judgment: at least 2 accept/reject decisions</p>
                <p>Constraints: at least 1 prompt with explicit bounds</p>
                <p>Workflow: at least 3 multi-step turns</p>
                <p>Iteration: at least 2 turns responding to AI output</p>
                <p>Risk awareness: at least 1 instance of sensitive handling</p>
              </div>
            </div>
          </div>
        </div>

        {/* What scores do NOT measure */}
        <Card className="mb-10 border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-8">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-bold text-amber-900">What the scores do NOT measure</h2>
            </div>
            <p className="text-[14px] leading-relaxed text-amber-800 mb-3">
              The system does not assess the quality of the final paper or assignment. It does not check for
              plagiarism. It does not determine whether AI-generated text appears in the final submission.
              It measures only the student's behavior during the AI interaction — whether they led the process or followed it.
            </p>
            <p className="text-[14px] leading-relaxed text-amber-800">
              A student could score 90% (strong leadership) and still produce a poor paper if they directed the
              AI toward the wrong conclusions. Conversely, a student could score 30% (weak leadership) and submit
              excellent work if the AI happened to produce it. <strong>The proof page is evidence of process, not quality.</strong>
            </p>
          </CardContent>
        </Card>

        {/* Integrity Checks */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#717182]" />
            <h2 className="text-lg font-bold text-[#030213]">Integrity Checks</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: "Conversation structure", desc: "Verifies the export matches expected platform format (ChatGPT JSON, Claude export, etc)" },
              { name: "Timestamp consistency", desc: "Checks that message timestamps are sequential and plausible" },
              { name: "Content hashing", desc: "Creates a fingerprint of the conversation so re-uploads can be detected" },
              { name: "Manipulation likelihood", desc: "The evaluator flags conversations that appear staged or unusually performative" },
            ].map(c => (
              <div key={c.name} className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] p-4">
                <h3 className="mb-1 text-[13px] font-medium text-[#030213]">{c.name}</h3>
                <p className="text-[12px] text-[#717182]">{c.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] text-[#717182]">
            These checks are not foolproof. A sufficiently motivated student could fabricate a conversation that
            passes all checks. The system provides evidence, not certainty — the same way a draft history in Google
            Docs provides evidence of writing process without guaranteeing it.
          </p>
        </div>

        {/* Open Source Commitment */}
        <Card className="mb-10 border border-[rgba(0,0,0,0.08)] bg-white">
          <CardContent className="p-8">
            <div className="mb-3 flex items-center gap-2">
              <Code className="h-5 w-5 text-[#717182]" />
              <h2 className="text-lg font-bold text-[#030213]">Open Source Commitment</h2>
            </div>
            <p className="text-[14px] leading-relaxed text-[#3A3A3A] mb-4">
              The scoring methodology, dimension rubrics, weights, and thresholds described in this document
              are published for public review. Educators, institutions, and researchers are encouraged to:
            </p>
            <ul className="space-y-2 text-[14px] text-[#3A3A3A]">
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#717182] flex-shrink-0" />Audit the methodology against their own academic integrity standards</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#717182] flex-shrink-0" />Propose modifications for specific educational contexts</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#717182] flex-shrink-0" />Use the threshold definitions to develop their own AI use policies</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#717182] flex-shrink-0" />Contact us with concerns about specific scoring outcomes</li>
            </ul>
            <p className="mt-4 text-[14px] leading-relaxed text-[#3A3A3A] font-medium">
              We believe that AI-assisted work scoring must be transparent to be trusted. A black-box score
              is no better than a gut feeling. By publishing the equations, we invite the academic community
              to hold us accountable.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="border-t border-[rgba(0,0,0,0.08)] pt-6 text-center text-[13px] text-[#717182]">
          <div className="mb-1">ProofofAIWork — proofofaiwork.com — Adam Thomas LLC</div>
          <a href="mailto:support@proofofaiwork.com" className="text-blue-600 hover:underline">support@proofofaiwork.com</a>
        </div>
      </div>
    </div>
  );
}
