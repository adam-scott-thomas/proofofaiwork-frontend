import { ArrowRight, Check, RotateCw } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import type { PublicReceipt, PublicReceiptListItem } from "../lib/publicReceipts";

type ProofCardReceipt = PublicReceipt | PublicReceiptListItem;

type ProofCardProps = {
  receipt: ProofCardReceipt;
  compact?: boolean;
};

function numberOrDash(value?: number) {
  return value == null ? "--" : value.toLocaleString("en-US");
}

function multiplier(value?: number) {
  return value == null ? "--" : `${value}x`;
}

function hashShort(value?: string) {
  if (!value) return "hash pending";
  const clean = value.replace(/^sha256:/i, "");
  if (clean.length <= 14) return clean;
  return `${clean.slice(0, 6)}...${clean.slice(-6)}`;
}

export default function ProofCard({ receipt, compact = false }: ProofCardProps) {
  const [flipped, setFlipped] = useState(false);
  const archetype = receipt.archetype_label ?? "Verified Capability Artifact";
  const identity = receipt.operator_name ?? receipt.handle ?? "ProofOfAIWork receipt";
  const confidence = numberOrDash(receipt.evidence_confidence);
  const hash = hashShort(receipt.proof_hash);

  return (
    <article className={compact ? "proof-card compact" : "proof-card"} data-flipped={flipped}>
      <button
        className="proof-card-toggle"
        type="button"
        aria-pressed={flipped}
        aria-label={flipped ? "Show proof card front" : "Show proof card evidence side"}
        onClick={() => setFlipped((value) => !value)}
      >
        <span>Flip artifact</span>
        <RotateCw size={14} />
      </button>

      <div className="proof-card-stage">
        <div className="proof-card-face proof-card-front">
          <div className="proof-card-mast">
            <span>Verified AI Work Receipt</span>
            <span>{receipt.verification_state ?? hash}</span>
          </div>

          <div className="proof-card-identity">
            <p>Archetype</p>
            <h3>{archetype}</h3>
            <span>{identity} · proof of work, not proof of person</span>
          </div>

          <div className="proof-card-score">
            <strong>{numberOrDash(receipt.ai_leverage_score)}</strong>
            <div>
              <span>AI Leverage</span>
              <p>{receipt.title}</p>
            </div>
          </div>

          <div className="proof-card-metrics" aria-label="Ownership, execution, and leverage">
            {[
              ["Ownership", receipt.ownership],
              ["Execution", receipt.execution],
              ["Leverage", receipt.leverage_score],
            ].map(([label, value]) => (
              <div key={label as string}>
                <span>{label as string}</span>
                <strong>{numberOrDash(value as number | undefined)}</strong>
              </div>
            ))}
          </div>

          <div className="proof-card-footer">
            <span>
              <Check size={12} />
              conf {confidence}
            </span>
            <code>{hash}</code>
            <span className="flip-hint">tap to inspect</span>
          </div>
        </div>

        <div className="proof-card-face proof-card-back">
          <div className="proof-card-mast">
            <span>Evidence Ledger</span>
            <span>Public safe</span>
          </div>

          <div className="proof-card-ledger">
            {[
              ["Evidence confidence", confidence],
              ["Output multiplier", multiplier(receipt.output_multiplier)],
              ["Completed actions", numberOrDash(receipt.completed_actions)],
              ["Decisions", numberOrDash(receipt.decisions)],
              ["Alternatives", numberOrDash(receipt.alternatives)],
              ["Turns analyzed", numberOrDash(receipt.turns_analyzed)],
              ["Artifacts", numberOrDash(receipt.artifacts)],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="proof-card-hash">
            <span>Proof hash</span>
            <code>{receipt.proof_hash ?? "pending"}</code>
          </div>

          <div className="proof-card-canonical">
            <span>Canonical</span>
            <code>{receipt.canonical_url}</code>
          </div>

          <Link className="proof-card-open" to={`/proof/${receipt.slug}`}>
            Open Full Proof
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}
