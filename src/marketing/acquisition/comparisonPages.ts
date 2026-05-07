import type { ComparisonOpportunity } from "./types";

export const comparisonOpportunities: ComparisonOpportunity[] = [
  {
    slug: "resumes-vs-proof-of-work",
    title: "Resumes vs Proof of Work",
    comparison: "Resume claims against inspectable work artifacts",
    angle: "AI-generated resumes make screening claims cheaper while proof artifacts make capability easier to inspect.",
    whyItConverts: "Hiring teams already feel resume signal decay. This page gives them a better screening primitive.",
    mustInclude: ["Resume claim versus proof artifact", "AI-generated resume inflation", "Ownership and validation checklist", "Links to proof receipts"],
    cta: "See proof artifacts",
  },
  {
    slug: "ai-skills-tests-vs-work-samples",
    title: "AI Skills Tests vs Work Samples",
    comparison: "Short tests against real AI-assisted task evidence",
    angle: "Tests can measure fragments of knowledge; work samples reveal task framing, judgment, iteration, and delivery.",
    whyItConverts: "This intercepts assessment-platform searches and reframes the buying criteria around demonstrated work.",
    mustInclude: ["Where tests are useful", "Where tests fail for AI work", "Work-sample rubric", "Method comparison table"],
    cta: "Assess with work samples",
  },
  {
    slug: "linkedin-profiles-vs-proof-artifacts",
    title: "LinkedIn Profiles vs Proof Artifacts",
    comparison: "Professional profiles against evidence records",
    angle: "LinkedIn is useful for distribution and reputation, but it does not show how someone produced AI-assisted work.",
    whyItConverts: "It bridges candidate behavior with employer trust and can push both audiences toward profile-linked proof.",
    mustInclude: ["Profile claim versus proof receipt", "Proof links for candidates", "Recruiter validation workflow", "Outreach example"],
    cta: "Add proof to your profile",
  },
  {
    slug: "portfolios-vs-verified-work-samples",
    title: "Portfolios vs Verified Work Samples",
    comparison: "Finished portfolio pieces against verified process evidence",
    angle: "A portfolio shows the artifact. Verified work samples show process, authorship, AI use, and evidence quality.",
    whyItConverts: "It differentiates ProofOfAIWork from generic portfolio builders without dismissing portfolios.",
    mustInclude: ["When a portfolio is enough", "When verification matters", "Before-and-after portfolio example", "Verified sample links"],
    cta: "Verify work samples",
  },
  {
    slug: "certifications-vs-demonstrated-ai-capability",
    title: "Certifications vs Demonstrated AI Capability",
    comparison: "Credentials against current real-work evidence",
    angle: "AI certifications can show learning effort, but demonstrated capability shows whether someone can produce useful work now.",
    whyItConverts: "This serves hiring, L&D, and candidate audiences while pushing away low-value credential chasing.",
    mustInclude: ["What certifications prove", "Why AI skills decay quickly", "Demonstrated capability rubric", "Certification-to-proof path"],
    cta: "Show demonstrated capability",
  },
];
