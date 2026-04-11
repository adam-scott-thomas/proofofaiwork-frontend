import { ExternalLink, TrendingUp, Loader2 } from "lucide-react";
import { Card } from "../components/ui/card";
import { Link, useParams } from "react-router";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

interface PublicProfileData {
  name: string;
  username: string;
  tagline?: string;
  verdict?: string;
  level?: string;
  signals?: {
    leadership?: number;
    aiExecution?: number;
    amplification?: number;
  };
  recentProofs?: Array<{
    id: string;
    title: string;
    assessment?: string;
    slug: string;
  }>;
  trend?: string[];
  stats?: {
    projects?: number;
    conversations?: number;
    publishedProofs?: number;
  };
}

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setNotFound(false);
    apiFetch<PublicProfileData>(`/u/${username}`)
      .then((data) => {
        setProfile(data);
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [username]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#717182]" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="mx-auto max-w-3xl px-8 py-16 text-center">
          <h1 className="mb-4 text-4xl tracking-tight">Profile not found</h1>
          <p className="mb-8 text-[15px] text-[#717182]">
            No profile found for @{username}.
          </p>
          <Link
            to="/"
            className="text-[15px] text-[#030213] underline underline-offset-4 hover:text-[#717182]"
          >
            Go to homepage →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="mx-auto max-w-3xl px-8 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-3 text-5xl tracking-tight">{profile.name}</h1>
          {profile.tagline && (
            <p className="mb-2 text-xl text-[#717182]">{profile.tagline}</p>
          )}
          {profile.verdict && (
            <p className="mb-6 text-lg">{profile.verdict}</p>
          )}

          {profile.level && (
            <div className="inline-block rounded-lg border-2 border-[var(--score-execution)] bg-[#FAFAFA] px-6 py-3">
              <div className="text-[11px] uppercase tracking-wider text-[#717182]">
                AI Operator Level
              </div>
              <div className="mt-1 text-2xl tracking-tight font-medium">
                {profile.level}
              </div>
            </div>
          )}
        </div>

        {/* Signal Snapshot */}
        {profile.signals && (
          <Card className="mb-8 border border-[rgba(0,0,0,0.08)] bg-white p-8">
            <div className="mb-6 text-[13px] uppercase tracking-wider text-[#717182]">
              Signal Snapshot
            </div>
            <div className="grid grid-cols-3 gap-6">
              {profile.signals.leadership != null && (
                <div>
                  <div className="mb-1 text-4xl tracking-tight">
                    {profile.signals.leadership}%
                  </div>
                  <div className="text-[13px] text-[#717182]">Leadership</div>
                </div>
              )}
              {profile.signals.aiExecution != null && (
                <div>
                  <div className="mb-1 text-4xl tracking-tight">
                    {profile.signals.aiExecution}%
                  </div>
                  <div className="text-[13px] text-[#717182]">AI Execution</div>
                </div>
              )}
              {profile.signals.amplification != null && (
                <div>
                  <div className="mb-1 text-4xl tracking-tight">
                    {profile.signals.amplification}x
                  </div>
                  <div className="text-[13px] text-[#717182]">Amplification</div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Recent Proofs */}
        {profile.recentProofs && profile.recentProofs.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-6 text-2xl tracking-tight">Recent Proofs</h2>
            <div className="space-y-3">
              {profile.recentProofs.map((proof) => (
                <Link
                  key={proof.id}
                  to={`/@${profile.username}/${proof.slug}`}
                  className="group block"
                >
                  <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 transition-all hover:border-[rgba(0,0,0,0.2)] hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 text-lg font-medium tracking-tight group-hover:underline">
                          {proof.title}
                        </div>
                        {proof.assessment && (
                          <div className="text-[15px] text-[#717182]">
                            → {proof.assessment}
                          </div>
                        )}
                      </div>
                      <ExternalLink className="h-4 w-4 text-[#717182] opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pattern Over Time */}
        {profile.trend && profile.trend.length > 0 && (
          <Card className="mb-8 border border-[rgba(0,0,0,0.08)] bg-white p-8">
            <div className="mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <h2 className="text-2xl tracking-tight">Trend</h2>
            </div>
            <div className="space-y-3">
              {profile.trend.map((item, index) => (
                <div key={index} className="flex items-start gap-2 text-[15px]">
                  <span className="text-[#717182]">—</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Project Snapshot */}
        {profile.stats && (
          <div className="grid grid-cols-3 gap-4">
            {profile.stats.projects != null && (
              <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 text-center">
                <div className="mb-1 text-3xl tracking-tight">
                  {profile.stats.projects}
                </div>
                <div className="text-[13px] text-[#717182]">Projects</div>
              </Card>
            )}
            {profile.stats.conversations != null && (
              <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 text-center">
                <div className="mb-1 text-3xl tracking-tight">
                  {profile.stats.conversations}
                </div>
                <div className="text-[13px] text-[#717182]">Conversations</div>
              </Card>
            )}
            {profile.stats.publishedProofs != null && (
              <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 text-center">
                <div className="mb-1 text-3xl tracking-tight">
                  {profile.stats.publishedProofs}
                </div>
                <div className="text-[13px] text-[#717182]">Published Proofs</div>
              </Card>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-[13px] text-[#717182]">
            Proof generated by Proof of AI Work
          </p>
          <Link
            to="/"
            className="text-[13px] text-[#030213] underline underline-offset-4 hover:text-[#717182]"
          >
            Create your own proof →
          </Link>
        </div>
      </div>
    </div>
  );
}
