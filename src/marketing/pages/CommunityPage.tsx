import { ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import ProofCard from "../components/ProofCard";
import { identityClusters } from "../data/clusters";
import { useSeo } from "../hooks/useSeo";
import { APP_URL, siteMetadata } from "../lib/constants";
import { fetchPublicReceipts, type PublicReceiptListItem } from "../lib/publicReceipts";

export default function CommunityPage() {
  const [items, setItems] = useState<PublicReceiptListItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "ProofOfAIWork Community Proof Archive",
    description: "A public evidence gallery of published ProofOfAIWork capability artifacts.",
    url: `${siteMetadata.canonical}/community`,
  };

  useSeo(
    "Community proof archive",
    "Browse public ProofOfAIWork capability artifacts when operators choose to publish them.",
    "/community",
    undefined,
    "website",
    jsonLd,
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchPublicReceipts(controller.signal)
      .then((receipts) => setItems(receipts))
      .catch(() => setItems(null))
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <section className="community-archive">
      <header className="archive-masthead">
        <p className="eyebrow">Public Evidence Gallery</p>
        <h1>Operators who left proof.</h1>
        <p>
          A curated archive of public capability artifacts. No follower counts, no comments, no leaderboard mechanics.
          Each card is a published receipt.
        </p>
      </header>

      <div className="archive-rulebar">
        <span>Proof of work, not proof of person</span>
        <span>{items?.length ?? 0} public receipts indexed</span>
      </div>

      <div className="cluster-rail" aria-label="Discovery clusters">
        {identityClusters.map((cluster) => (
          <div key={cluster.name}>
            <strong>{cluster.name}</strong>
            <span>{cluster.description}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="community-state">
          <Loader2 className="spin" size={22} />
          <p>Checking the public receipt archive...</p>
        </div>
      ) : items && items.length > 0 ? (
        <div className="printer-tray">
          {items.map((item) => (
            <ProofCard receipt={item} compact key={item.slug} />
          ))}
        </div>
      ) : (
        <div className="archive-empty">
          <p className="eyebrow">Archive awaiting public artifacts</p>
          <h2>No public receipts are filed yet.</h2>
          <p>
            Individual canonical proof links are live at <code>/proof/:slug</code>. This gallery will remain empty until
            real operators publish receipts through the public list endpoint.
          </p>
        </div>
      )}

      <div className="cta-row archive-actions">
        <a className="button primary" href={APP_URL}>
          Upload and analyze your work
          <ArrowRight size={18} />
        </a>
        <Link className="button secondary" to="/scores">
          Methodology
        </Link>
      </div>
    </section>
  );
}
