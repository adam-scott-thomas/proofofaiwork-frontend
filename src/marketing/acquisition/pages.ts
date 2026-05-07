import type { SeoPage } from "./types";

const commonAvoid = [
  "Do not publish generic AI productivity advice.",
  "Do not make unsupported claims about verification.",
  "Do not write listicle filler without proof artifacts.",
];

const seedSpecs = [
  ["ai-capability-proof", "AI Capability Proof", "AI Capability Proof: Evidence That Someone Can Actually Use AI", "Replace AI fluency claims with proof artifacts, workflows, receipts, and verified outcomes.", "Core category hub", "ai-capability-proof", "Create proof of AI capability"],
  ["ai-work-samples", "AI Work Samples", "AI Work Samples: How to Prove Real AI Capability", "See what strong AI work samples look like and how employers can evaluate real AI-assisted output.", "Product-led guide with examples", "ai-work-samples", "View verified AI work samples"],
  ["ai-skills-assessment", "AI Skills Assessment", "AI Skills Assessment: Tests vs Real Work Samples", "Learn why AI skills tests miss workflow judgment, tool use, and real execution evidence.", "Comparison and assessment framework", "ai-skills-assessment", "Assess AI capability with work evidence"],
  ["hire-ai-capable-talent", "Hiring AI-Capable Talent", "Hiring AI-Capable Talent: What to Look For Beyond Resumes", "Learn how to identify candidates who can actually amplify their work with AI.", "Hiring solution page", "hiring-ai-capable-talent", "Review AI-capable candidates"],
  ["ai-leverage", "AI Leverage", "AI Leverage: Measuring Who Gets More Done With AI", "AI leverage is the ability to turn AI tools into better, faster work. Here is how to prove it.", "Category explainer", "ai-leverage", "Measure AI leverage"],
  ["workforce-ai-readiness", "Workforce AI Readiness", "Workforce AI Readiness: Measure Capability, Not Confidence", "Map who can use AI effectively by reviewing real work, not survey self-ratings.", "Assessment playbook", "workforce-ai-readiness", "Run an AI readiness review"],
  ["prompt-engineering-proof", "Prompt Engineering Proof", "Prompt Engineering Proof: How to Show Real Prompting Skill", "Strong prompt work is visible in task framing, iteration, validation, and final output quality.", "Artifact guide", "prompt-engineering-proof", "Publish a prompt proof artifact"],
  ["ai-assisted-workflow", "AI-Assisted Workflow", "AI-Assisted Workflow: How to Document Human + AI Work", "Show the workflow behind the result: prompts, tool choices, decisions, edits, and impact.", "Workflow template", "ai-assisted-workflow", "Document an AI-assisted workflow"],
  ["ai-work-portfolio", "AI Work Portfolio", "AI Work Portfolio: Build a Portfolio That Proves AI Capability", "Create a portfolio of verified AI-assisted work samples employers can inspect.", "Candidate acquisition page", "ai-work-portfolio", "Build your AI work portfolio"],
  ["resumes-vs-proof-of-work", "Resumes vs Proof of Work", "Resumes vs Proof of Work for AI-Capable Hiring", "AI resumes are easy to polish. Proof of work shows how candidates actually use AI.", "Comparison page", "hiring-ai-capable-talent", "See proof artifacts"],
  ["ai-skills-tests-vs-work-samples", "AI Skills Tests vs Work Samples", "AI Skills Tests vs Work Samples for Hiring", "Compare AI skills tests with real work samples for hiring, screening, and workforce assessment.", "Comparison page", "ai-skills-assessment", "Assess with work samples"],
  ["linkedin-profiles-vs-proof-artifacts", "LinkedIn Profiles vs Proof Artifacts", "LinkedIn Profiles vs Proof Artifacts for AI Skills", "LinkedIn can distribute claims. Proof artifacts show how AI-assisted work was actually done.", "Comparison page", "ai-work-portfolio", "Add proof to your profile"],
  ["portfolios-vs-verified-work-samples", "Portfolios vs Verified Work Samples", "Portfolios vs Verified Work Samples for AI-Assisted Work", "Portfolios show finished work. Verified work samples show process, authorship, AI use, and evidence.", "Comparison page", "ai-work-samples", "Verify work samples"],
  ["certifications-vs-demonstrated-ai-capability", "Certifications vs Demonstrated AI Capability", "AI Certifications vs Demonstrated AI Capability", "AI certificates can show learning effort. Demonstrated capability shows current work evidence.", "Comparison page", "ai-capability-proof", "Show demonstrated capability"],
  ["examples", "ProofOfAIWork Examples", "AI Work Sample Examples and Proof Artifacts", "Browse examples of AI-assisted work samples, proof artifacts, workflows, and work receipts.", "Examples index", "ai-work-samples", "Browse examples"],
] as const;

export const priorityAcquisitionPages: SeoPage[] = seedSpecs.map((spec, index) => ({
  priority: index + 1,
  slug: spec[0],
  title: spec[1],
  seoTitle: spec[2],
  metaDescription: spec[3],
  pageType: spec[4],
  targetCluster: spec[5],
  intent: "Capture high-intent searchers and route them toward proof artifacts, examples, scorecards, or hiring workflows.",
  audience: index < 9 ? ["Hiring teams", "Candidates", "Operators"] : ["Hiring teams", "Recruiters", "Candidates"],
  commercialValue: index < 6 || index === 9 || index === 10 ? "very-high" : "high",
  brief: `${spec[1]} explains the reader's problem, shows what strong evidence looks like, and avoids generic AI advice.`,
  primaryCta: spec[6],
  secondaryCta: "Browse examples",
  internalLinks: ["/ai-capability-proof", "/ai-work-samples", "/examples"],
  sections: ["Problem", "What weak evidence misses", "What strong proof includes", "ProofOfAIWork example", "Evaluation checklist", "Next action"],
  proofAssets: ["Example work receipt", "Evaluation rubric", "Checklist"],
  avoid: commonAvoid,
}));

const nextSpecs = [
  ["ai-work-sample-examples", "AI Work Sample Examples", "AI Work Sample Examples for Hiring and Portfolios"],
  ["how-to-evaluate-ai-work-samples", "How to Evaluate AI Work Samples", "How to Evaluate AI Work Samples"],
  ["ai-capability-scorecard", "AI Capability Scorecard", "AI Capability Scorecard for Work Samples"],
  ["ai-leverage-score", "AI Leverage Score", "AI Leverage Score: Measure AI-Amplified Work"],
  ["ai-work-receipt", "AI Work Receipt", "AI Work Receipt: Make AI-Assisted Work Inspectable"],
  ["proof-of-ai-work", "Proof of AI Work", "Proof of AI Work: Evidence for AI Capability"],
  ["ai-workflow-audit", "AI Workflow Audit", "AI Workflow Audit for Teams and Candidates"],
  ["ai-assisted-case-study-template", "AI-Assisted Case Study Template", "AI-Assisted Case Study Template"],
  ["prompt-engineering-portfolio-examples", "Prompt Engineering Portfolio Examples", "Prompt Engineering Portfolio Examples"],
  ["ai-candidate-screening", "AI Candidate Screening", "AI Candidate Screening Beyond Resumes"],
  ["ai-hiring-scorecard", "AI Hiring Scorecard", "AI Hiring Scorecard for AI-Capable Talent"],
  ["ai-native-hiring", "AI-Native Hiring", "AI-Native Hiring: How to Screen for Real Capability"],
  ["ai-ready-candidate", "AI-Ready Candidate", "What Makes an AI-Ready Candidate"],
  ["ai-skills-matrix", "AI Skills Matrix", "AI Skills Matrix for Modern Teams"],
  ["team-ai-readiness-assessment", "Team AI Readiness Assessment", "Team AI Readiness Assessment"],
  ["employee-ai-capability-assessment", "Employee AI Capability Assessment", "Employee AI Capability Assessment"],
  ["ai-productivity-proof", "AI Productivity Proof", "AI Productivity Proof for Knowledge Work"],
  ["knowledge-worker-ai-skills", "Knowledge Worker AI Skills", "Knowledge Worker AI Skills That Show Up in Real Work"],
  ["marketing-ai-work-samples", "Marketing AI Work Samples", "Marketing AI Work Samples"],
  ["engineering-ai-work-samples", "Engineering AI Work Samples", "Engineering AI Work Samples"],
  ["operations-ai-work-samples", "Operations AI Work Samples", "Operations AI Work Samples"],
  ["sales-ai-work-samples", "Sales AI Work Samples", "Sales AI Work Samples"],
  ["student-ai-portfolio", "Student AI Portfolio", "Student AI Portfolio for Job Search"],
  ["freelancer-ai-portfolio", "Freelancer AI Portfolio", "Freelancer AI Portfolio That Proves AI Capability"],
  ["verified-ai-work-samples", "Verified AI Work Samples", "Verified AI Work Samples for Hiring"],
] as const;

export const nextAcquisitionPages: SeoPage[] = nextSpecs.map((spec, index) => ({
  priority: index + 16,
  slug: spec[0],
  title: spec[1],
  seoTitle: spec[2],
  metaDescription: `${spec[1]} from ProofOfAIWork: turn AI capability claims into inspectable evidence.`,
  pageType: index < 8 ? "Guide or template" : index < 18 ? "Assessment or hiring page" : "Role or audience page",
  targetCluster: index < 6 ? "ai-capability-proof" : index < 9 ? "ai-assisted-workflow" : index < 18 ? "hiring-ai-capable-talent" : "ai-work-samples",
  intent: "Capture a focused long-tail query with a page that is useful only if it contains proof-backed examples.",
  audience: ["Hiring teams", "Candidates", "Operators"],
  commercialValue: index < 18 ? "high" : "medium-high",
  brief: `${spec[1]} uses real or realistic artifacts, a clear rubric, and a path into ProofOfAIWork.`,
  primaryCta: index < 18 ? "Use the proof framework" : "Browse relevant work samples",
  secondaryCta: "Create proof of AI work",
  internalLinks: ["/ai-capability-proof", "/ai-work-samples", "/examples"],
  sections: ["Problem", "What strong proof includes", "Example", "Evaluation checklist", "Next action"],
  proofAssets: ["Rubric", "Example artifact", "Checklist"],
  avoid: commonAvoid,
}));

export const acquisitionPages: SeoPage[] = [...priorityAcquisitionPages, ...nextAcquisitionPages];

export function getAcquisitionPage(slug: string) {
  return acquisitionPages.find((page) => page.slug === slug);
}
