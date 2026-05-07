export type ResumeCommercialValue = "medium" | "medium-high" | "high" | "very-high";

export type ResumeSeoCluster = {
  id: string;
  name: string;
  verdict: "build" | "avoid" | "supporting";
  primaryKeyword: string;
  supportingKeywords: string[];
  searchIntent: string;
  likelyAudience: string[];
  commercialValue: ResumeCommercialValue;
  recommendedPageType: string;
  titleTag: string;
  metaDescription: string;
  internalLinks: string[];
  cta: string;
};

export type ResumeSeoPage = {
  priority: number;
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  pageType: string;
  intent: string;
  audience: string[];
  commercialValue: ResumeCommercialValue;
  angle: string;
  sections: string[];
  proofAssets: string[];
  internalLinks: string[];
  cta: string;
};

export type ResumePublishingTask = {
  day: number;
  phase: string;
  slug: string;
  task: string;
  acceptanceCheck: string;
};
