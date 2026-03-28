import { AlertCircle, Webhook, Upload, FileText, ClipboardList, Globe, Share2 } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Link } from "react-router";
import { useState } from "react";
import { ShareDialog } from "../components/ShareDialog";
import { useCurrentUser, useWorkProfile, usePool, useProjects, useAssessments, useProofPages, useActivity } from "../../hooks/useApi";

function formatRelativeTime(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function Dashboard() {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const { data: user } = useCurrentUser();
  const { data: workProfile } = useWorkProfile();
  const { data: pool } = usePool();
  const { data: projectsData } = useProjects();
  const { data: assessmentsData } = useAssessments();
  const { data: proofPagesData } = useProofPages();
  const { data: activityData } = useActivity();

  const userName = user?.name ?? user?.email ?? "—";
  const hls = workProfile?.human_leadership_score ?? 0;
  const ael = workProfile?.ai_execution_load ?? 0;
  const cai = workProfile?.cai ?? 0;
  const archetype = workProfile?.archetype ?? { primary: "—", secondary: "—" };
  const narrative = workProfile?.narrative ?? "";

  const conversationCount = pool?.total ?? 0;
  const projectCount = Array.isArray(projectsData) ? projectsData.length : (projectsData?.items?.length ?? 0);
  const assessmentCount = Array.isArray(assessmentsData) ? assessmentsData.length : (assessmentsData?.items?.length ?? 0);
  const proofPages = Array.isArray(proofPagesData) ? proofPagesData : (proofPagesData?.items ?? []);
  const publishedCount = proofPages.filter((p: any) => p.published).length;

  const activity: any[] = Array.isArray(activityData) ? activityData : (activityData?.items ?? []);

  const shareData = {
    name: userName,
    handle: user?.handle ?? "",
    hlsScore: hls,
    aelScore: Math.round(ael * 100),
    caiScore: cai,
    proofUrl: `https://proofofaiwork.com/p/${user?.handle ?? ""}`,
    conversationCount,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl tracking-tight">Dashboard</h1>
              <p className="mt-1 text-[13px] text-[#717182]">
                Welcome back, {userName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <AlertCircle className="mr-2 h-4 w-4" />
                Disputes
              </Button>
              <Button variant="outline" size="sm">
                <Webhook className="mr-2 h-4 w-4" />
                System
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* AI Work Profile Hero Card */}
        <Card className="mb-8 border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="mb-1 text-[15px]">Your AI Work Profile</h2>
              {workProfile?.evaluated_at && (
                <p className="text-[13px] text-[#717182]">
                  Last updated {new Date(workProfile.evaluated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • {conversationCount} conversations analyzed
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setShareDialogOpen(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>

          {/* Four Scores */}
          <div className="grid grid-cols-4 gap-6">
            <div className="border-r border-[rgba(0,0,0,0.06)] pr-6">
              <div className="mb-2 text-[13px] text-[#717182]">Human Leadership</div>
              <div className="mb-1 text-5xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--score-hls)' }}>
                {hls}%
              </div>
              <div className="text-[13px] text-[#717182]">leadership score</div>
            </div>

            <div className="border-r border-[rgba(0,0,0,0.06)] pr-6">
              <div className="mb-2 text-[13px] text-[#717182]">AI Execution Load</div>
              <div className="mb-1 text-5xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--score-execution)' }}>
                {(ael * 100).toFixed(0)}%
              </div>
              <div className="text-[13px] text-[#717182]">AI-generated output</div>
            </div>

            <div className="border-r border-[rgba(0,0,0,0.06)] pr-6">
              <div className="mb-2 text-[13px] text-[#717182]">Amplified</div>
              <div className="mb-1 text-5xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--score-cai)' }}>
                {workProfile?.amplified_capabilities ?? cai}x
              </div>
              <div className="text-[13px] text-[#717182]">existing skills boosted</div>
            </div>

            <div>
              <div className="mb-2 text-[13px] text-[#717182]">Unlocked</div>
              <div className="mb-1 text-5xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: '#10B981' }}>
                +{workProfile?.unlocked_capabilities?.count ?? 0}
              </div>
              <div className="text-[13px] text-[#717182]">new domains via AI</div>
              {(workProfile?.unlocked_capabilities?.count ?? 0) > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {workProfile.unlocked_capabilities.domains?.slice(0, 4).map((d: any) => (
                    <span key={d.name} className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-700 capitalize">
                      {d.name.replace("_", " ")}
                    </span>
                  ))}
                  {(workProfile.unlocked_capabilities.domains?.length ?? 0) > 4 && (
                    <span className="text-[11px] text-[#717182]">+{workProfile.unlocked_capabilities.domains.length - 4} more</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Archetype */}
          <div className="mb-6 flex items-center gap-3 border-t border-[rgba(0,0,0,0.06)] pt-6">
            <div className="text-[13px] uppercase tracking-wider text-[#717182]">Archetype</div>
            {archetype.primary && archetype.primary !== "—" && (
              <div className="rounded-sm bg-[#F5F5F7] px-3 py-1.5 font-mono text-[13px] tracking-tight">
                {archetype.primary}
              </div>
            )}
            {archetype.secondary && archetype.secondary !== "—" && (
              <div className="rounded-sm bg-[#F5F5F7] px-3 py-1.5 font-mono text-[13px] tracking-tight text-[#717182]">
                {Array.isArray(archetype.secondary) ? archetype.secondary[0] : archetype.secondary}
              </div>
            )}
          </div>

          {/* Narrative */}
          {narrative && (
            <div className="border-t border-[rgba(0,0,0,0.06)] pt-6">
              <div className="mb-3 text-[13px] uppercase tracking-wider text-[#717182]">
                Interpretation
              </div>
              <p className="leading-relaxed text-[#3A3A3A]">{narrative}</p>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-6 border-t border-[rgba(0,0,0,0.06)] pt-6">
            <Link to="/work-profile">
              <Button size="sm">View Full Work Profile</Button>
            </Link>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-4 gap-4">
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#F5F5F7]">
                <Upload className="h-4 w-4 text-[#717182]" />
              </div>
            </div>
            <div className="mb-1 text-3xl tracking-tight">{conversationCount}</div>
            <div className="text-[13px] text-[#717182]">Conversations</div>
          </Card>

          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#F5F5F7]">
                <FileText className="h-4 w-4 text-[#717182]" />
              </div>
            </div>
            <div className="mb-1 text-3xl tracking-tight">{projectCount}</div>
            <div className="text-[13px] text-[#717182]">Projects</div>
          </Card>

          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#F5F5F7]">
                <ClipboardList className="h-4 w-4 text-[#717182]" />
              </div>
            </div>
            <div className="mb-1 text-3xl tracking-tight">{assessmentCount}</div>
            <div className="text-[13px] text-[#717182]">Assessments</div>
          </Card>

          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#F5F5F7]">
                <Globe className="h-4 w-4 text-[#717182]" />
              </div>
            </div>
            <div className="mb-1 text-3xl tracking-tight">{publishedCount}</div>
            <div className="text-[13px] text-[#717182]">Published Proofs</div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Activity Feed */}
          <Card className="col-span-2 border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
            <div className="border-b border-[rgba(0,0,0,0.06)] px-6 py-4">
              <h3 className="text-[15px]">Recent Activity</h3>
            </div>
            <div className="divide-y divide-[rgba(0,0,0,0.04)]">
              {activity.length === 0 ? (
                <div className="px-6 py-8 text-center text-[13px] text-[#717182]">
                  No activity yet
                </div>
              ) : (
                activity.slice(0, 5).map((item: any, i: number) => (
                  <div key={item.id ?? i} className="px-6 py-4 hover:bg-[#FAFAFA] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-0.5 text-[14px]">{item.action}</div>
                        <div className="text-[13px] text-[#717182]">{item.detail}</div>
                      </div>
                      <div className="font-mono text-[12px] text-[#717182] whitespace-nowrap">
                        {formatRelativeTime(item.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-[rgba(0,0,0,0.06)] px-6 py-3">
              <Button variant="ghost" size="sm" className="w-full">
                View All Activity
              </Button>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
            <div className="border-b border-[rgba(0,0,0,0.06)] px-6 py-4">
              <h3 className="text-[15px]">Quick Actions</h3>
            </div>
            <div className="space-y-2 p-4">
              <Link to="/upload">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Conversations
                </Button>
              </Link>
              <Link to="/projects">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </Link>
              <Link to="/assessments">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Run Assessment
                </Button>
              </Link>
              <Link to="/proof-pages">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Globe className="mr-2 h-4 w-4" />
                  Publish Proof Page
                </Button>
              </Link>
            </div>
            <div className="border-t border-[rgba(0,0,0,0.06)] p-4">
              <Link to="/upload">
                <Button className="w-full" size="sm">
                  View Upload Pool
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <ShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} data={shareData} />
    </div>
  );
}
