import { ArrowRight, TrendingUp, Clock, MessageSquare, FolderKanban, CheckCircle2, AlertCircle, Sparkles, Upload, Share2, Webhook, FileText, ClipboardList, Globe } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Link } from "react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ShareDialog } from "../components/ShareDialog";
import { PaymentModal } from "../components/PaymentModal";
import {
  useCurrentUser,
  useWorkProfile,
  useActivity,
  useProjects,
  useConversations,
  useAssessments,
  useProofPages,
} from "../../hooks/useApi";

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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Real API data
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: workProfile, isLoading: wpLoading } = useWorkProfile();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const { data: conversationsData, isLoading: conversationsLoading } = useConversations();
  const { data: assessmentsData } = useAssessments();
  const { data: proofPagesData } = useProofPages();
  const { data: activityData, isLoading: activityLoading } = useActivity();

  // Derive counts — API may return arrays or paginated objects
  const projects = Array.isArray(projectsData) ? projectsData : (projectsData?.items ?? projectsData?.projects ?? []);
  const conversations = Array.isArray(conversationsData) ? conversationsData : (conversationsData?.items ?? conversationsData?.conversations ?? []);
  const assessments = Array.isArray(assessmentsData) ? assessmentsData : (assessmentsData?.items ?? assessmentsData?.assessments ?? []);
  const proofPages = Array.isArray(proofPagesData) ? proofPagesData : (proofPagesData?.items ?? proofPagesData?.proof_pages ?? []);
  const activityItems = Array.isArray(activityData) ? activityData : (activityData?.items ?? activityData?.activity ?? []);

  const projectCount = projects?.length ?? 0;
  const conversationCount = conversations?.length ?? 0;
  const assessmentCount = assessments?.length ?? 0;
  const publishedProofCount = proofPages?.filter((p: any) => p.published || p.status === "published")?.length ?? 0;

  // "Has AI Sorted" = user has at least one project
  const hasAISorted = projectCount > 0;

  // Work profile scores with safe defaults
  const hlsScore = workProfile?.human_leadership_score ?? 0;
  const aelScore = workProfile?.ai_execution_load ?? 0;
  const caiScore = workProfile?.cai ?? 0;

  // User info with fallbacks
  const userName = user?.name ?? user?.display_name ?? "—";
  const userHandle = user?.handle ? `@${user.handle.replace(/^@/, "")}` : (user?.email ? `@${user.email.split("@")[0]}` : "—");

  // ShareDialog data built from real data
  const shareData = {
    name: userName,
    handle: userHandle,
    hlsScore: hlsScore,
    aelScore: Math.round(aelScore * 100),
    caiScore: caiScore,
    proofUrl: `https://proofofaiwork.com/p/${userHandle.replace(/^@/, "")}-proof`,
    conversationCount: conversationCount,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  };

  // Loading state — show while core data is fetching
  const isLoading = userLoading || projectsLoading || conversationsLoading || wpLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[rgba(0,0,0,0.12)] border-t-[#3A3A3A]" />
          <p className="text-[14px] text-[#717182]">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl tracking-tight">Dashboard</h1>
              <p className="mt-1 text-[15px] leading-relaxed text-[#3A3A3A] max-w-3xl">
                You get results. But not consistently. You rely on iteration instead of structure — which is costing you efficiency.
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
        {/* Hero - Always visible */}
        <div className="mb-12 max-w-4xl">
          <h2 className="mb-4 text-4xl tracking-tight leading-tight">
            You get results.
          </h2>
          <h2 className="mb-4 text-4xl tracking-tight leading-tight text-[#717182]">
            But not consistently.
          </h2>
          <p className="text-xl text-[#717182] leading-relaxed">
            You rely on iteration instead of structure — and it's slowing you down.
          </p>
        </div>

        {/* AI Sort CTA or Status */}
        {!hasAISorted ? (
          <Card className="mb-12 border-2 border-[rgba(0,0,0,0.12)] bg-[#FAFAFA] p-10 shadow-sm">
            <div className="mb-6">
              <h3 className="mb-4 text-2xl tracking-tight">Your work is unstructured.</h3>
              <div className="space-y-2 text-[15px] leading-relaxed text-[#3A3A3A]">
                <div className="flex items-center gap-2">
                  <span className="text-[#717182]">→</span>
                  <span>{conversationCount > 0 ? `${conversationCount} conversations sitting in raw form` : "No conversations uploaded yet"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#717182]">→</span>
                  <span>No consistent grouping</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#717182]">→</span>
                  <span>Low-confidence results</span>
                </div>
              </div>
            </div>

            <div className="mb-8 border-t border-[rgba(0,0,0,0.08)] pt-6">
              <p className="text-[15px] leading-relaxed text-[#3A3A3A]">
                Run AI Sort to turn this into real work.
              </p>
            </div>

            <Button className="w-full justify-between" size="lg" onClick={() => setPaymentModalOpen(true)}>
              <span className="flex items-center">
                <Sparkles className="mr-2 h-5 w-5" />
                Run AI Sort
              </span>
              <span className="text-[15px] font-mono">$7</span>
            </Button>
          </Card>
        ) : (
          <>
            {/* Level - Huge */}
            <div className="mb-12">
              <div className="mb-6 flex items-start justify-between group">
                <div className="flex items-center gap-4">
                  <div className="text-6xl tracking-tight font-medium">
                    {workProfile?.archetype?.primary
                      ? `${String(workProfile.archetype.primary).toUpperCase()}${workProfile.archetype.secondary ? `–${String(workProfile.archetype.secondary).toUpperCase()}` : ""}`
                      : "ANALYZING"}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <Share2 className="h-4 w-4 text-[#717182]" />
                  </Button>
                </div>
              </div>

              {/* One-block assessment */}
              <div className="border-l-4 border-[rgba(0,0,0,0.08)] pl-6">
                <p className="mb-4 text-xl leading-relaxed text-[#3A3A3A]">
                  You control direction and get outcomes.
                </p>
                <p className="text-xl leading-relaxed text-[#717182]">
                  {workProfile?.narrative ?? "But you don't define constraints early — so you waste cycles fixing things later."}
                </p>
              </div>
            </div>

            {/* Status banner */}
            <Card className="mb-12 border-l-4 border-[var(--score-execution)] bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-[15px] text-[#717182]">Your work is now structured.</h3>
              </div>

              <div className="mb-4 flex items-center gap-8 text-[15px]">
                <div>
                  <span className="font-medium text-[#3A3A3A]">{projectCount} real project{projectCount !== 1 ? "s" : ""}</span>
                </div>
                <div>
                  <span className="font-medium text-[#3A3A3A]">Verified profile</span>
                </div>
                <div>
                  <span className="font-medium text-[#3A3A3A]">Proof pages ready</span>
                </div>
              </div>

              <p className="text-[13px] text-[#717182]">
                Your output is measurable.
              </p>
            </Card>
          </>
        )}

        {/* Performance Signals - Demoted, smaller */}
        {hasAISorted && (
          <div className="mb-8">
            <div className="mb-4 text-[13px] uppercase tracking-wider text-[#717182]">Signals</div>
            <div className="grid grid-cols-3 gap-6">
              <div className="group">
                <div className="mb-2 flex items-center gap-2">
                  <div className="text-4xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--score-hls)' }}>
                    {hlsScore}%
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <Share2 className="h-3.5 w-3.5 text-[#717182]" />
                  </Button>
                </div>
                <div className="mb-1 text-[12px] text-[#717182]">Human Leadership</div>
                <p className="text-[13px] text-[#717182]">→ You lead the work</p>
              </div>

              <div className="group">
                <div className="mb-2 flex items-center gap-2">
                  <div className="text-4xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--score-execution)' }}>
                    {(aelScore * 100).toFixed(0)}%
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <Share2 className="h-3.5 w-3.5 text-[#717182]" />
                  </Button>
                </div>
                <div className="mb-1 text-[12px] text-[#717182]">AI Execution Load</div>
                <p className="text-[13px] text-[#717182]">→ You delegate execution</p>
              </div>

              <div className="group">
                <div className="mb-2 flex items-center gap-2">
                  <div className="text-4xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--score-cai)' }}>
                    {caiScore}x
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <Share2 className="h-3.5 w-3.5 text-[#717182]" />
                  </Button>
                </div>
                <div className="mb-1 text-[12px] text-[#717182]">Cognitive Amplification</div>
                <p className="text-[13px] text-[#717182]">→ You amplify output with AI</p>
              </div>
            </div>
          </div>
        )}


        {/* Stats Grid - Demoted */}
        <div className="mb-8 pt-8 border-t border-[rgba(0,0,0,0.06)]">
          <div className="mb-3 text-[11px] uppercase tracking-wider text-[#717182]">Volume</div>
          <div className="grid grid-cols-4 gap-4">
            <div className="group">
              <div className="mb-1 flex items-center gap-2">
                <div className="text-2xl tracking-tight text-[#717182]">{conversationCount}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setShareDialogOpen(true)}
                >
                  <Share2 className="h-3 w-3 text-[#C0C0C5]" />
                </Button>
              </div>
              <div className="text-[12px] text-[#717182]">Conversations</div>
              <div className="mt-1 text-[11px] text-[#C0C0C5]">
                → sufficient for confidence
              </div>
            </div>

            <div className="group">
              <div className="mb-1 flex items-center gap-2">
                <div className="text-2xl tracking-tight text-[#717182]">{projectCount}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setShareDialogOpen(true)}
                >
                  <Share2 className="h-3 w-3 text-[#C0C0C5]" />
                </Button>
              </div>
              <div className="text-[12px] text-[#717182]">Projects</div>
            </div>

            <div className="group">
              <div className="mb-1 flex items-center gap-2">
                <div className="text-2xl tracking-tight text-[#717182]">{assessmentCount}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setShareDialogOpen(true)}
                >
                  <Share2 className="h-3 w-3 text-[#C0C0C5]" />
                </Button>
              </div>
              <div className="text-[12px] text-[#717182]">Assessments</div>
            </div>

            <div className="group">
              <div className="mb-1 flex items-center gap-2">
                <div className="text-2xl tracking-tight text-[#717182]">{publishedProofCount}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setShareDialogOpen(true)}
                >
                  <Share2 className="h-3 w-3 text-[#C0C0C5]" />
                </Button>
              </div>
              <div className="text-[12px] text-[#717182]">Published Proofs</div>
              <div className="mt-1 text-[11px] text-[#C0C0C5]">
                → proof-grade output
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Activity Feed */}
          <Card className="col-span-2 border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
            <div className="border-b border-[rgba(0,0,0,0.06)] px-6 py-4">
              <h3 className="text-[15px]">Recent Activity</h3>
            </div>
            <div className="divide-y divide-[rgba(0,0,0,0.04)]">
              {activityLoading ? (
                <div className="px-6 py-8 text-center text-[14px] text-[#717182]">Loading…</div>
              ) : activityItems.length === 0 ? (
                <div className="px-6 py-8 text-center text-[14px] text-[#717182]">No activity yet.</div>
              ) : (
                activityItems.slice(0, 10).map((item: any) => (
                  <div key={item.id} className="px-6 py-4 hover:bg-[#FAFAFA] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-0.5 text-[14px]">{item.action ?? item.type ?? item.event ?? "Activity"}</div>
                        <div className="text-[13px] text-[#717182]">{item.detail ?? item.description ?? item.message ?? ""}</div>
                      </div>
                      <div className="font-mono text-[12px] text-[#717182] whitespace-nowrap">
                        {item.timestamp ? formatRelativeTime(item.timestamp) : item.created_at ? formatRelativeTime(item.created_at) : ""}
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
              {!hasAISorted && (
                <>
                  <Button className="w-full justify-between" size="sm" onClick={() => setPaymentModalOpen(true)}>
                    <span className="flex items-center">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Run AI Sort
                    </span>
                    <span className="text-[13px] font-mono">$7</span>
                  </Button>
                  <div className="px-2 py-1 mb-2">
                    <div className="text-[12px] leading-relaxed text-[#717182]">
                      → organize conversations into real work
                    </div>
                  </div>
                </>
              )}
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload Conversations
              </Button>
              <div className="px-2 py-1">
                <div className="text-[12px] leading-relaxed text-[#717182]">
                  → increase sample size for stronger signals
                </div>
              </div>
              {hasAISorted && (
                <>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Globe className="mr-2 h-4 w-4" />
                    Publish Proof Page
                  </Button>
                  <div className="px-2 py-1">
                    <div className="text-[12px] leading-relaxed text-[#717182]">
                      → publish verified evidence of your capacity
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      <ShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} data={shareData} />
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["projects"] });
        }}
      />
    </div>
  );
}
