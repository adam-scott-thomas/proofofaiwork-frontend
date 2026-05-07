export type CommercialValue = "medium" | "medium-high" | "high" | "very-high";

export type SeoCluster = {
  id: string;
  name: string;
  primaryKeyword: string;
  supportingKeywords: string[];
  searchIntent: string;
  likelyAudience: string[];
  commercialValue: CommercialValue;
  recommendedPageType: string;
  sampleTitleTag: string;
  sampleMetaDescription: string;
  internalLinksNeeded: string[];
  conversionCta: string;
};

export type SeoPage = {
  priority: number;
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  pageType: string;
  targetCluster: string;
  intent: string;
  audience: string[];
  commercialValue: CommercialValue;
  brief: string;
  primaryCta: string;
  secondaryCta?: string;
  internalLinks: string[];
  sections: string[];
  proofAssets: string[];
  avoid: string[];
};

export type ComparisonOpportunity = {
  slug: string;
  title: string;
  comparison: string;
  angle: string;
  whyItConverts: string;
  mustInclude: string[];
  cta: string;
};

export type PublishingPlanItem = {
  day: number;
  phase: string;
  slug: string;
  task: string;
  successCheck: string;
};
