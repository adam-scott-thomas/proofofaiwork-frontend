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
  canonical_url: string;
  title: string;
  operator_name?: string;
  handle?: string;
  archetype_label?: string;
  summary?: string;
  ai_leverage_score?: number;
  ownership?: number;
  execution?: number;
  leverage_score?: number;
  evidence_confidence?: number;
  output_multiplier?: number;
  completed_actions?: number;
  decisions?: number;
  alternatives?: number;
  turns_analyzed?: number;
  artifacts?: number;
  proof_hash?: string;
  published_at?: string;
  evidence_cards: PublicReceiptEvidenceCard[];
  timeline: PublicReceiptEvidenceCard[];
  artifact_cards: PublicReceiptEvidenceCard[];
  og_image_url?: string;
  oembed_url?: string;
  verification_state?: string;
};

export type PublicReceiptListItem = PublicReceipt;

export type PublicDossier = {
  handle: string;
  operator_name: string;
  canonical_url: string;
  description: string;
  public_proofs: PublicReceipt[];
  archetype_distribution: Record<string, number>;
  evidence_totals: Record<string, number>;
  featured_proof?: PublicReceipt;
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

function evidenceCardArray(value: unknown): PublicReceiptEvidenceCard[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((item, index) => ({
      id: stringField(item.id) ?? `evidence-${index + 1}`,
      title: stringField(item.claim) ?? `Evidence ${index + 1}`,
      summary: stringField(item.claim) ?? "",
      kind: stringField(item.kind),
      turns: turnsField(item.evidence_turn_ids),
    }))
    .slice(0, 12);
}

function timelineCardArray(value: unknown): PublicReceiptEvidenceCard[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((item, index) => ({
      id: `timeline-${numberField(item.sequence) ?? index + 1}`,
      title: stringField(item.title) ?? `Timeline ${index + 1}`,
      summary: stringField(item.state) ?? "",
      kind: stringField(item.event_type),
      turns: [],
    }))
    .slice(0, 12);
}

function artifactCardArray(value: unknown): PublicReceiptEvidenceCard[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((item, index) => ({
      id: stringField(item.id) ?? `artifact-${index + 1}`,
      title: stringField(item.title) ?? `Artifact ${index + 1}`,
      summary: stringField(item.state) ?? "",
      kind: stringField(item.artifact_type),
      turns: [],
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
  const canonical_url = requiredString(receipt.canonical_url);
  const title = requiredString(receipt.title);

  if (!slug || !canonical_url || !title) return null;

  return {
    slug,
    canonical_url,
    title,
    operator_name: stringField(receipt.operator_name),
    handle: stringField(receipt.handle),
    archetype_label: stringField(receipt.archetype_label),
    summary: stringField(receipt.summary),
    ai_leverage_score: scoreField(receipt.ai_leverage_score),
    ownership: scoreField(receipt.ownership),
    execution: scoreField(receipt.execution),
    leverage_score: scoreField(receipt.leverage_score),
    evidence_confidence: scoreField(receipt.evidence_confidence),
    output_multiplier: multiplierField(receipt.output_multiplier),
    completed_actions: countField(receipt.completed_actions),
    decisions: countField(receipt.decisions),
    alternatives: countField(receipt.alternatives),
    turns_analyzed: countField(receipt.turns_analyzed),
    artifacts: countField(receipt.artifacts),
    proof_hash: stringField(receipt.proof_hash),
    published_at: stringField(receipt.published_at),
    evidence_cards: evidenceCardArray(receipt.evidence_cards),
    timeline: timelineCardArray(receipt.timeline),
    artifact_cards: artifactCardArray(receipt.artifact_cards),
    og_image_url: stringField(receipt.og_image_url),
    oembed_url: stringField(receipt.oembed_url),
    verification_state: stringField(receipt.verification_state),
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
  const public_proofs = Array.isArray(dossier.public_proofs)
    ? dossier.public_proofs.map(normalizeReceipt).filter((item): item is PublicReceipt => item !== null)
    : [];
  const featured_proof = normalizeReceipt(dossier.featured_proof);
  return {
    handle: requiredString(dossier.handle),
    operator_name: requiredString(dossier.operator_name) || "Anonymous",
    canonical_url: requiredString(dossier.canonical_url),
    description: requiredString(dossier.description),
    public_proofs,
    archetype_distribution: numberRecord(dossier.archetype_distribution),
    evidence_totals: numberRecord(dossier.evidence_totals),
    featured_proof: featured_proof ?? undefined,
  };
}
