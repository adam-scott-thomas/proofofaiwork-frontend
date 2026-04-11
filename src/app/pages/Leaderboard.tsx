import { TrendingUp, Crown, Medal, Award, ArrowRight, Globe } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";

export default function Leaderboard() {
  const { data: directory } = useQuery({
    queryKey: ["directory-public"],
    queryFn: () => apiFetch<any>("/directory"),
  });

  const isOpen = directory?.enabled ?? false;
  const profiles: any[] = isOpen ? (directory?.profiles ?? directory?.items ?? []) : [];
  const totalPublished = directory?.total_published ?? 0;
  const threshold = directory?.threshold ?? 15;

  // Sort by HLS descending
  const ranked = [...profiles].sort((a: any, b: any) => (b.hls ?? b.human_leadership_score ?? 0) - (a.hls ?? a.human_leadership_score ?? 0));

  const rankIcon = (i: number) => {
    if (i === 0) return <Crown className="h-5 w-5 text-amber-500" />;
    if (i === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (i === 2) return <Award className="h-5 w-5 text-amber-700" />;
    return <span className="text-[15px] font-mono text-[#717182]">{i + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="mx-auto max-w-5xl px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <TrendingUp className="h-8 w-8" />
                <h1 className="text-4xl tracking-tight">Leaderboard</h1>
              </div>
              <p className="text-xl text-[#717182]">
                Top AI operators ranked by leadership, amplification, and proof
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/explore">
                <Button variant="outline">
                  <Globe className="mr-2 h-4 w-4" />
                  Explore
                </Button>
              </Link>
              <Link to="/upload">
                <Button>
                  Get Ranked
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-8 py-8">
        {isOpen && ranked.length > 0 ? (
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[60px_1fr_100px_100px_100px] gap-4 border-b border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] px-6 py-3">
              <div className="text-[11px] uppercase tracking-wider text-[#717182]">Rank</div>
              <div className="text-[11px] uppercase tracking-wider text-[#717182]">Operator</div>
              <div className="text-[11px] uppercase tracking-wider text-[#717182] text-right">HLS</div>
              <div className="text-[11px] uppercase tracking-wider text-[#717182] text-right">CAI</div>
              <div className="text-[11px] uppercase tracking-wider text-[#717182] text-right">AEL</div>
            </div>

            {/* Rows */}
            {ranked.map((profile: any, i: number) => {
              const handle = profile.handle ?? profile.slug ?? profile.id;
              const hls = profile.hls ?? profile.human_leadership_score ?? 0;
              const cai = profile.cai ?? 0;
              const ael = profile.ael ?? profile.ai_execution_load ?? 0;
              return (
                <Link
                  key={handle}
                  to={`/@${handle}`}
                  className="grid grid-cols-[60px_1fr_100px_100px_100px] gap-4 px-6 py-4 hover:bg-[#FAFAFA] transition-colors border-b border-[rgba(0,0,0,0.04)] last:border-0"
                >
                  <div className="flex items-center justify-center">{rankIcon(i)}</div>
                  <div>
                    <div className="text-[15px] font-medium">{profile.name ?? handle}</div>
                    {profile.archetype && (
                      <div className="text-[12px] text-[#717182] uppercase tracking-wider">{profile.archetype}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[15px] font-mono" style={{ color: "var(--score-hls)" }}>{hls}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[15px] font-mono" style={{ color: "var(--score-cai)" }}>{cai}x</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[15px] font-mono" style={{ color: "var(--score-execution)" }}>
                      {typeof ael === "number" && ael <= 1 ? `${Math.round(ael * 100)}%` : `${ael}%`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </Card>
        ) : (
          /* Not yet open */
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-16 text-center">
            <TrendingUp className="mx-auto mb-6 h-12 w-12 text-[#717182]" />
            <h2 className="mb-4 text-2xl tracking-tight">Leaderboard opens soon</h2>
            <p className="mx-auto mb-2 max-w-md text-[15px] text-[#717182]">
              The leaderboard opens when {threshold} proof pages are published.
            </p>
            <p className="mx-auto mb-8 max-w-md text-[15px] text-[#717182]">
              Currently <span className="font-medium text-[#030213]">{totalPublished}</span> of {threshold}.
            </p>

            <div className="mx-auto mb-8 max-w-xs">
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-[#030213] transition-all"
                  style={{ width: `${Math.min(100, (totalPublished / threshold) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-[12px] text-[#717182]">{totalPublished}/{threshold} proof pages</p>
            </div>

            <Link
              to="/upload"
              className="inline-block text-[15px] text-[#030213] underline underline-offset-4 hover:text-[#717182]"
            >
              Upload your conversations and get ranked →
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
