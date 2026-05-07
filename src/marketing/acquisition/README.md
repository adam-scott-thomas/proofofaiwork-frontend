# ProofOfAIWork Acquisition Content Package

This directory contains the Phase 1 acquisition content system for high-intent searches around proving AI capability, AI work samples, hiring AI-capable talent, and workforce AI readiness.

It is intentionally isolated from live routing. The files can be imported later by a route generator, sitemap generator, or marketing page template without changing current site behavior.

## Files

- `clusters.ts`: keyword clusters with intent, audience, commercial value, recommended page type, title tags, meta descriptions, internal links, and CTAs.
- `pages.ts`: the first 15 seed pages plus the next 25 recommended pages.
- `comparisonPages.ts`: comparison-page opportunities.
- `internalLinking.ts`: hub-and-spoke linking recommendations.
- `pagesToAvoid.ts`: low-value page patterns to avoid.
- `publishingPlan.ts`: 30-day phased publishing plan.
- `pages/*.md`: editorial briefs for the first 15 seed pages.

## Phase 2 Routing Recommendation

Create one reusable acquisition page component that accepts a page object, renders the page structure, and calls the existing metadata helper. Add explicit route entries for the first 15 seed pages before generating the remaining 25.
