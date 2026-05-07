import type { ReactNode } from "react";

type EditorialSectionProps = {
  kicker?: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
};

type LedgerItem = {
  label: string;
  value: ReactNode;
  note?: ReactNode;
};

type VerificationBlockProps = {
  canonical: string;
  hash?: string;
  status?: string;
};

type Artifact = {
  id: string;
  title: string;
  summary?: string;
  kind?: string;
  turns?: string[];
  status?: string;
  confidence?: number;
  tags?: string[];
};

export function EditorialSection({ kicker, title, aside, children }: EditorialSectionProps) {
  return (
    <section className="editorial-section">
      <div className="editorial-section-head">
        <div>
          {kicker ? <p className="eyebrow">{kicker}</p> : null}
          <h2>{title}</h2>
        </div>
        {aside ? <div className="editorial-section-aside">{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function LedgerPanel({ items }: { items: LedgerItem[] }) {
  return (
    <div className="ledger-panel">
      {items.map((item) => (
        <div key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.note ? <em>{item.note}</em> : null}
        </div>
      ))}
    </div>
  );
}

export function VerificationBlock({ canonical, hash, status = "Public-safe verified receipt" }: VerificationBlockProps) {
  return (
    <section className="verification-block">
      <p className="eyebrow">Integrity</p>
      <h2>Verification</h2>
      <div>
        <span>Canonical</span>
        <code>{canonical}</code>
      </div>
      <div>
        <span>Proof hash</span>
        <code>{hash ?? "pending"}</code>
      </div>
      <div>
        <span>Status</span>
        <strong>{status}</strong>
      </div>
    </section>
  );
}

export function ArtifactGrid({ artifacts, emptyCopy }: { artifacts: Artifact[]; emptyCopy?: ReactNode }) {
  if (artifacts.length === 0) {
    return <div className="artifact-empty">{emptyCopy ?? "No public artifacts are filed yet."}</div>;
  }

  return (
    <div className="artifact-grid">
      {artifacts.map((artifact, index) => (
        <article className={index === 0 ? "artifact-featured" : index % 5 === 3 ? "artifact-wide" : undefined} key={artifact.id}>
          <div className="artifact-card-meta">
            {artifact.kind ? <span>{artifact.kind}</span> : null}
            {artifact.status ? <small>{artifact.status}</small> : null}
            {artifact.confidence != null ? <small>{artifact.confidence}% confidence</small> : null}
          </div>
          <h3>{artifact.title}</h3>
          {artifact.summary ? <p>{artifact.summary}</p> : null}
          {artifact.turns && artifact.turns.length > 0 ? (
            <div className="turn-list">
              {artifact.turns.slice(0, 3).map((turn) => (
                <code key={turn}>{turn}</code>
              ))}
            </div>
          ) : null}
          {artifact.tags && artifact.tags.length > 0 ? (
            <div className="artifact-tags">
              {artifact.tags.slice(0, 4).map((tag) => (
                <em key={tag}>{tag}</em>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
