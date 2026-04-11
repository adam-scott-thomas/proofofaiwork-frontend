import { Search, Globe, TrendingUp, Users, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";

export default function Explore() {
  const { data: directory } = useQuery({
    queryKey: ["directory-public"],
    queryFn: () => apiFetch<any>("/directory"),
  });

  const isOpen = directory?.enabled ?? false;
  const profiles: any[] = isOpen ? (directory?.profiles ?? directory?.items ?? []) : [];
  const totalPublished = directory?.total_published ?? 0;
  const threshold = directory?.threshold ?? 15;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="mx-auto max-w-5xl px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Globe className="h-8 w-8" />
                <h1 className="text-4xl tracking-tight">Explore</h1>
              </div>
              <p className="text-xl text-[#717182]">
                Discover verified AI operators and their proof of work
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/leaderboard">
                <Button variant="outline">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Leaderboard
                </Button>
              </Link>
              <Link to="/sign-in">
                <Button>
                  Get Your Score
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-8 py-8">
        {isOpen ? (
          <>
            {/* Search */}
            <div className="mb-8 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#717182]" />
                <Input placeholder="Search operators by name or skill..." className="pl-10" />
              </div>
            </div>

            {/* Profile grid */}
            <div className="grid grid-cols-3 gap-4">
              {profiles.map((profile: any) => (
                <Link key={profile.id ?? profile.handle} to={`/@${profile.handle ?? profile.slug ?? profile.id}`}>
                  <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="mb-3 text-[15px] font-medium">{profile.name ?? profile.handle}</div>
                    {profile.archetype && (
                      <div className="mb-3 text-[13px] text-[#717182] uppercase tracking-wider">
                        {profile.archetype}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-[13px]">
                      {profile.hls != null && (
                        <span style={{ color: "var(--score-hls)" }}>{profile.hls}% HLS</span>
                      )}
                      {profile.cai != null && (
                        <span style={{ color: "var(--score-cai)" }}>{profile.cai}x CAI</span>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {profiles.length === 0 && (
              <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-16 text-center">
                <Users className="mx-auto mb-4 h-10 w-10 text-[#717182]" />
                <p className="text-[15px] text-[#717182]">No public profiles yet.</p>
              </Card>
            )}
          </>
        ) : (
          /* Directory not yet open */
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-16 text-center">
            <Users className="mx-auto mb-6 h-12 w-12 text-[#717182]" />
            <h2 className="mb-4 text-2xl tracking-tight">Directory opens soon</h2>
            <p className="mx-auto mb-2 max-w-md text-[15px] text-[#717182]">
              The explore directory opens when {threshold} proof pages are published.
            </p>
            <p className="mx-auto mb-8 max-w-md text-[15px] text-[#717182]">
              Currently <span className="font-medium text-[#030213]">{totalPublished}</span> of {threshold} published.
            </p>

            {/* Progress bar */}
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
              Upload your conversations and be one of the first →
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
