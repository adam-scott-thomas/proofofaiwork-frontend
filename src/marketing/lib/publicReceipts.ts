import { PUBLIC_API_BASE } from "./constants";

export type PublicReceiptEvidenceCard = {
  id: string;
  title: string;
  summary: string;
  kind?: string;
  turns: string[];
};

export type PublicReceipt = {
  slug: string;
  canonicalUrl: string;
  title: string;
  operatorName?: string;
  handle?: string;
  archetypeLabel?: string;
  summary?: string;
  aiLeverageScore?: number;
  ownership?: number;
  execution?: number;
  leverageScore?: number;
  evidenceConfidence?: number;
  outputMultiplier?: number;
  completedActions?: number;
  decisions?: number;
  alternatives?: number;
  turnsAnalyzed?: number;
  artifacts?: number;
  proofHash?: string;
  publishedAt?: string;
  evidenceCards: PublicReceiptEvidenceCard[];
  timeline: PublicReceiptEvidenceCard[];
  artifactCards: PublicReceiptEvidenceCard[];
  ogImageUrl?: string;
  oembedUrl?: string;
  verificationState?: string;
};

export type PublicReceiptListItem = PublicReceipt;

export type PublicDossier = {
  handle: string;
  operatorName: string;
  canonicalUrl: string;
  description: string;
  publicProofs: PublicReceipt[];
  archetypeDistribution: Record<string, number>;
  evidenceTotals: Record<string, number>;
  featuredProof?: PublicReceipt;
};

type PublicReceiptContract = {
  slug: unknown;
  canonical_url: unknown;
  title: unknown;
  operator_name?: unknown;
  handle?: unknown;
  archetype_label?: unknown;
  summary?: unknown;
  ai_leverage_score?: unknown;
  ownership?: unknown;
  execution?: unknown;
  leverage_score?: unknown;
  evidence_confidence?: unknown;
  output_multiplier?: unknown;
  completed_actions?: unknown;
  decisions?: unknown;
  alternatives?: unknown;
  turns_analyzed?: unknown;
  artifacts?: unknown;
  proof_hash?: unknown;
  published_at?: unknown;
  evidence_cards?: unknown;
  timeline?: unknown;
  artifact_cards?: unknown;
  og_image_url?: unknown;
  oembed_url?: unknown;
  verification_state?: unknown;
};

type AnyRecord = Record<string, unknown>;

type PublicDossierContract = {
  handle?: unknown;
  operator_name?: unknown;
  canonical_url?: unknown;
  description?: unknown;
  public_proofs?: unknown;
  archetype_distribution?: unknown;
  evidence_totals?: unknown;
  featured_proof?: unknown;
};

function isRecord(value: unknown): value is AnyRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function stringField(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requiredString(value: unknown) {
  return stringField(value) ?? "";
}

function numberField(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
}

function scoreField(value: unknown) {
  const number = numberField(value);
  if (number == null) return undefined;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function countField(value: unknown) {
  const number = numberField(value);
  if (number == null) return undefined;
  return Math.max(0, Math.round(number));
}

function multiplierField(value: unknown) {
  const number = numberField(value);
  if (number == null) return undefined;
  return Math.round(number * 10) / 10;
}

function turnsField(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, 5);
}

function cardArray(value: unknown): PublicReceiptEvidenceCard[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((item, index) => ({
      id: stringField(item.id) ?? `entry-${index + 1}`,
      title: stringField(item.title) ?? stringField(item.claim) ?? `Entry ${index + 1}`,
      summary: stringField(item.summary) ?? stringField(item.state) ?? stringField(item.completion_status) ?? "",
      kind: stringField(item.kind) ?? stringField(item.event_type) ?? stringField(item.artifact_type),
      turns: turnsField(item.turns ?? item.evidence_turn_ids),
    }))
    .slice(0, 12);
}

function numberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => {
      const number = numberField(item);
      return number == null ? [] : [[key, number]];
    }),
  );
}

function normalizeReceipt(payload: unknown): PublicReceipt | null {
  if (!isRecord(payload)) return null;
  const receipt = payload as PublicReceiptContract;
  const slug = requiredString(receipt.slug);
  const canonicalUrl = requiredString(receipt.canonical_url);
  const title = requiredString(receipt.title);

  if (!slug || !canonicalUrl || !title) return null;

  return {
    slug,
    canonicalUrl,
    title,
    operatorName: stringField(receipt.operator_name),
    handle: stringField(receipt.handle),
    archetypeLabel: stringField(receipt.archetype_label),
    summary: stringField(receipt.summary),
    aiLeverageScore: scoreField(receipt.ai_leverage_score),
    ownership: scoreField(receipt.ownership),
    execution: scoreField(receipt.execution),
    leverageScore: scoreField(receipt.leverage_score),
    evidenceConfidence: scoreField(receipt.evidence_confidence),
    outputMultiplier: multiplierField(receipt.output_multiplier),
    completedActions: countField(receipt.completed_actions),
    decisions: countField(receipt.decisions),
    alternatives: countField(receipt.alternatives),
    turnsAnalyzed: countField(receipt.turns_analyzed),
    artifacts: countField(receipt.artifacts),
    proofHash: stringField(receipt.proof_hash),
    publishedAt: stringField(receipt.published_at),
    evidenceCards: cardArray(receipt.evidence_cards),
    timeline: cardArray(receipt.timeline),
    artifactCards: cardArray(receipt.artifact_cards),
    ogImageUrl: stringField(receipt.og_image_url),
    oembedUrl: stringField(receipt.oembed_url),
    verificationState: stringField(receipt.verification_state),
  };
}

export async function fetchPublicReceipt(slug: string, signal?: AbortSignal) {
  const response = await fetch(`${PUBLIC_API_BASE}/receipts/by-slug/${encodeURIComponent(slug)}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) return null;
  return normalizeReceipt(await response.json());
}

export async function fetchPublicReceipts(signal?: AbortSignal): Promise<PublicReceiptListItem[] | null> {
  const response = await fetch(`${PUBLIC_API_BASE}/receipts/public`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) return null;
  const payload = await response.json();
  const items = isRecord(payload) && Array.isArray(payload.items) ? payload.items : [];
  return items.map(normalizeReceipt).filter((item): item is PublicReceipt => item !== null);
}

export async function fetchPublicDossier(handle: string, signal?: AbortSignal): Promise<PublicDossier | null> {
  const response = await fetch(`${PUBLIC_API_BASE}/dossiers/${encodeURIComponent(handle)}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) return null;
  const payload = await response.json();
  if (!isRecord(payload)) return null;
  const dossier = payload as PublicDossierContract;
  const publicProofs = Array.isArray(dossier.public_proofs)
    ? dossier.public_proofs.map(normalizeReceipt).filter((item): item is PublicReceipt => item !== null)
    : [];
  const featuredProof = normalizeReceipt(dossier.featured_proof);
  return {
    handle: requiredString(dossier.handle),
    operatorName: requiredString(dossier.operator_name) || "Anonymous",
    canonicalUrl: requiredString(dossier.canonical_url),
    description: requiredString(dossier.description),
    publicProofs,
    archetypeDistribution: numberRecord(dossier.archetype_distribution),
    evidenceTotals: numberRecord(dossier.evidence_totals),
    featuredProof: featuredProof ?? undefined,
  };
}
