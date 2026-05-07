import type { ResumePublishingTask } from "./types";

const tasks = [
  ["Foundation", "your-ai-resume", "Publish the product category page.", "The page positions Your AI-Resume as proof-backed, not as a generic AI resume builder."],
  ["Foundation", "verified-ai-resume", "Publish the verified resume feature page.", "The page explains claim-to-proof mapping without overclaiming verification."],
  ["Foundation", "ai-resume-proof-examples", "Publish example claim-to-proof maps.", "The page includes at least four role-specific examples."],
  ["Comparison", "ai-resume-vs-proof-of-work", "Publish the comparison page.", "The page clearly contrasts polished claims with inspectable artifacts."],
  ["Problem", "ai-generated-resumes-are-not-enough", "Publish the employer-trust problem page.", "The page addresses resume sameness and routes to proof artifacts."],
  ["Audience", "ai-resume-for-ai-capable-candidates", "Publish the candidate page.", "The page gives candidates a concrete proof-backed resume workflow."],
  ["Audience", "ai-resume-for-hiring-teams", "Publish the employer page.", "The page gives hiring teams a fair proof-request workflow."],
  ["Alternative", "ai-resume-builder-alternative", "Publish the alternative page.", "The page avoids template-builder promises and sells proof instead."],
  ["How-to", "how-to-add-proof-to-an-ai-resume", "Publish the practical guide.", "The page includes a step-by-step workflow and link placement examples."],
  ["Governance", "ai-resume-mistakes-to-avoid", "Publish internal guidance.", "The page blocks generic builder, ATS myth, and doorway-page drift."],
  ["Internal linking", "your-ai-resume-linking-pass", "Connect the package to the core proof hub.", "Every page links to AI capability proof, AI work samples, and at least one resume comparison page."],
  ["Refresh", "your-ai-resume-snippet-review", "Review title tags, intros, and CTAs.", "No page sounds like a standard AI resume generator."],
  ["Examples", "marketing-ai-resume-proof-example", "Create a marketing claim-to-proof example.", "The example links a campaign claim to an AI work receipt."],
  ["Examples", "engineering-ai-resume-proof-example", "Create an engineering claim-to-proof example.", "The example links a code-review claim to a proof artifact."],
  ["Examples", "operations-ai-resume-proof-example", "Create an operations claim-to-proof example.", "The example links a process improvement claim to a workflow receipt."],
] as const;

export const yourAiResumePublishingPlan: ResumePublishingTask[] = tasks.map((task, index) => ({
  day: index + 1,
  phase: task[0],
  slug: task[1],
  task: task[2],
  acceptanceCheck: task[3],
}));
