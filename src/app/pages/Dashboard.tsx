import {
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  Check,
  Clock,
  FileBarChart,
  FolderKanban,
  Globe,
  Loader2,
  Mail,
  Sparkles,
  Upload as UploadIcon,
  UserCheck,
  UserX,
} from "lucide-react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  useAssessments,
  useCurrentUser,
  usePool,
  useProjects,
  useProofPages,
  useWorkProfile,
} from "../../hooks/useApi";
import { apiFetch, apiPost } from "../../lib/api";
import { asArray, dateTime, proofPagePath } from "../lib/poaw";

type ActivityEvent = {
  type: "assessment" | "project" | "proof_page" | "upload";
  action: string;
  id: string;
  title?: string;
  timestamp: string;
  detail?: string | null;
};

type DirectoryStatus = {
  enabled: boolean;
  total_published: number;
  threshold: number;
  message?: string;
};

type ViewerRequest = {
  id: string;
  proof_page_id: string;
  name: string;
  email: string;
  organization: string | null;
  reason: string | null;
  message: string | null;
  status: "pending" | "accepted" | "rejected" | string;
  responded_at: string | null;
  created_at: string;
};

type Dispute = {
  id: string;
  observation_id: string;
  dimension: string;
  reason: string;
  status: "open" | "reviewed" | "resolved" | "superseded";
  resolution_note: string | null;
  created_at: string;
};

const STATUS_STYLE: Record<string, string> = {
  complete: "bg-[#D3E9D9] text-[#1F6A3F]",
  partial: "bg-[#F8E5C2] text-[#8A5F10]",
  failed: "bg-[#F3D1D1] text-[#8B2F2F]",
  published: "bg-[#D3E9D9] text-[#1F6A3F]",
  draft: "bg-[#EAE3CF] text-[#6B6B66]",
  confirmed: "bg-[#D3E9D9] text-[#1F6A3F]",
  suggested: "bg-[#DCE4F0] text-[#315D8A]",
  processing: "bg-[#EDE3FF] text-[#5D3FA0]",
  in_progress: "bg-[#EDE3FF] text-[#5D3FA0]",
  pending: "bg-[#EAE3CF] text-[#6B6B66]",
  open: "bg-[#F8E5C2] text-[#8A5F10]",
  reviewed: "bg-[#DCE4F0] text-[#315D8A]",
  resolved: "bg-[#D3E9D9] text-[#1F6A3F]",
  superseded: "bg-[#EAE3CF] text-[#6B6B66]",
};

function StatusPill({ status }: { status: string }) {
  const style = STATUS_STYLE[status] || "bg-[#EAE3CF] text-[#6B6B66]";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase ${style}`}>
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  detail,
  href,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  detail: string;
  href?: string;
  tone?: "neutral" | "blue" | "green" | "amber" | "violet";
}) {
  const toneClass =
    tone === "blue"
      ? "before:bg-[#315D8A]"
      : tone === "green"
      ? "before:bg-[#1F6A3F]"
      : tone === "amber"
      ? "before:bg-[#A8741A]"
      : tone === "violet"
      ? "before:bg-[#5D3FA0]"
      : "before:bg-[#D8D2C4]";
  const content = (
    <Card className={`group relative overflow-hidden border border-[#D8D2C4] bg-white p-5 shadow-sm transition-colors hover:border-[#A88F5F] hover:bg-[#FBF8F1] before:absolute before:inset-x-0 before:top-0 before:h-1 ${toneClass}`}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-[12px] uppercase tracking-[0.12em] text-[#6B6B66]">{label}</div>
        {href ? <ArrowUpRight className="h-3.5 w-3.5 text-[#6B6B66] opacity-0 transition-opacity group-hover:opacity-100" /> : null}
      </div>
      <div className="mt-2 text-3xl tracking-tight text-[#161616]">{value}</div>
      <div className="mt-1 text-[12px] leading-snug text-[#6B6B66]">{detail}</div>
    </Card>
  );
  return href ? <Link to={href}>{content}</Link> : content;
}

export default function Dashboard() {
  const { data: me } = useCurrentUser();
  const { data: poolData, isLoading: poolLoading } = usePool();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const { data: assessmentsData, isLoading: assessmentsLoading } = useAssessments();
  const { data: proofPagesData, isLoading: proofPagesLoading } = useProofPages();
  const { data: workProfile } = useWorkProfile();

  const directoryQuery = useQuery<DirectoryStatus>({
    queryKey: ["directory-status"],
    queryFn: () => apiFetch<DirectoryStatus>(`/directory`),
    retry: false,
  });
  const activityQuery = useQuery<ActivityEvent[]>({
    queryKey: ["activity"],
    queryFn: () => apiFetch<ActivityEvent[]>(`/activity`),
    retry: false,
  });
  const disputesQuery = useQuery<Dispute[]>({
    queryKey: ["disputes"],
    queryFn: () => apiFetch<Dispute[]>(`/disputes`),
    retry: false,
  });
  const requestsQuery = useQuery<ViewerRequest[]>({
    queryKey: ["viewer-requests"],
    queryFn: () => apiFetch<ViewerRequest[]>(`/requests`),
    retry: false,
  });
  const queryClient = useQueryClient();
  const respondRequest = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "accept" | "reject" }) =>
      apiPost(`/requests/${id}/respond`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viewer-requests"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Response failed"),
  });

  const loading = poolLoading || projectsLoading || assessmentsLoading || proofPagesLoading;

  const projects = asArray<any>(projectsData);
  const assessments = asArray<any>(assessmentsData);
  const proofPages = asArray<any>(proofPagesData);
  const totalConversations = poolData?.total ?? 0;
  const unassigned = poolData?.unassigned ?? 0;
  const publishedProofs = proofPages.filter((page) => page?.status === "published");
  const recentAssessments = [...assessments]
    .sort((a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime())
    .slice(0, 4);
  const recentProofPages = [...proofPages]
    .sort((a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime())
    .slice(0, 3);
  const activity = activityQuery.data ?? [];
  const disputes = disputesQuery.data ?? [];
  const activeDisputes = disputes.filter((d) => d.status === "open" || d.status === "reviewed");
  const requests = requestsQuery.data ?? [];
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const handle = me?.handle ? `@${String(me.handle).replace(/^@/, "")}` : me?.email ?? "operator";
  const pulse = dashboardPulse({
    assessments: assessments.length,
    publishedProofs: publishedProofs.length,
    activeDisputes: activeDisputes.length,
    pendingRequests: pendingRequests.length,
    totalConversations,
    archetype: workProfile?.archetype?.label || null,
  });
  const wins = dashboardWins({
    totalConversations,
    projects: projects.length,
    assessments: assessments.length,
    publishedProofs: publishedProofs.length,
    archetype: workProfile?.archetype?.label || null,
    pendingRequests: pendingRequests.length,
    activeDisputes: activeDisputes.length,
    directoryEnabled: directoryQuery.data?.enabled ?? false,
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading workspace...
      </div>
    );
  }

  const completeness = profileCompleteness({
    uploads: totalConversations,
    projects: projects.length,
    assessments: assessments.length,
    profilesHlsAvailable: workProfile?.human_leadership_score != null,
    proofsPublished: publishedProofs.length,
  });

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Evidence Desk</div>
              <h1 className="mt-2 text-3xl tracking-tight">Welcome back, {handle}.</h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#5C5C5C]">
                {pulse.lede}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {wins.slice(0, 4).map((win) => (
                  <div
                    key={win.label}
                    className="inline-flex items-center gap-2 rounded-full border border-[#D8D2C4] bg-white px-3 py-1.5 text-[12px] text-[#4F4F49]"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: win.color }} />
                    <span className="text-[#161616]">{win.value}</span>
                    <span>{win.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid min-w-[280px] gap-3">
              <PulsePanel pulse={pulse} />
              <CompletenessPanel completeness={completeness} />
            </div>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Pool"
              value={totalConversations}
              detail={unassigned > 0 ? `${unassigned} still need a project` : "Everything is assigned"}
              href="/app/upload"
              tone="blue"
            />
            <StatCard
              label="Projects"
              value={projects.length}
              detail={projects.length === 0 ? "Create your first project" : "Confirmed and suggested streams"}
              href="/app/projects"
              tone="amber"
            />
            <StatCard
              label="Assessments"
              value={assessments.length}
              detail={assessments.length === 0 ? "No evaluations yet" : "Results ready for review"}
              href="/app/assessments"
              tone="violet"
            />
            <StatCard
              label="Published"
              value={publishedProofs.length}
              detail={publishedProofs.length === 0 ? "Nothing public yet" : "Live proof pages in explore"}
              href="/explore"
              tone="green"
            />
          </section>

          <section className="grid gap-3 md:grid-cols-4">
            {wins.map((win) => (
              <Card key={win.label} className="border border-[#D8D2C4] bg-[#FBF8F1] p-4 shadow-sm">
                <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">{win.label}</div>
                <div className="mt-2 text-[22px] tracking-tight text-[#161616]">{win.value}</div>
                <div className="mt-1 text-[12px] leading-snug text-[#6B6B66]">{win.detail}</div>
              </Card>
            ))}
          </section>

          {workProfile ? (
            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <div>
                  <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Work profile</div>
                  <h2 className="text-xl tracking-tight">
                    {workProfile.archetype?.label || "Profile signal"}
                  </h2>
                </div>
                <Link to="/app/assessments" className="text-[12px] text-[#6B6B66] hover:text-[#161616]">
                  See full profile →
                </Link>
              </div>
              <Card className="border border-[#D8D2C4] bg-white p-6">
                <div className="grid gap-5 md:grid-cols-4">
                  <ScoreBlock label="Human leadership" value={workProfile.human_leadership_score} color="#315D8A" />
                  <ScoreBlock
                    label="AI execution load"
                    value={workProfile.ai_execution_load != null ? Math.round(workProfile.ai_execution_load * 100) : null}
                    suffix="%"
                    color="#A8741A"
                  />
                  <ScoreBlock label="CAI" value={workProfile.cai} color="#2F6B3B" />
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">Confidence</div>
                    <div className="mt-1 text-lg">{workProfile.confidence || "—"}</div>
                    {workProfile.evaluated_at ? (
                      <div className="mt-1 text-[11px] text-[#6B6B66]">As of {dateTime(workProfile.evaluated_at)}</div>
                    ) : null}
                  </div>
                </div>
                {workProfile.narrative ? (
                  <p className="mt-5 border-t border-[#EAE3CF] pt-4 text-[13px] leading-relaxed text-[#5C5C5C]">
                    {workProfile.narrative}
                  </p>
                ) : null}
              </Card>
            </section>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <div>
                  <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Recent</div>
                  <h2 className="text-xl tracking-tight">Assessments</h2>
                </div>
                <Link to="/app/assessments" className="text-[12px] text-[#6B6B66] hover:text-[#161616]">
                  All →
                </Link>
              </div>
              {recentAssessments.length > 0 ? (
                <div className="space-y-2">
                  {recentAssessments.map((assessment) => {
                    const status = assessment.status ?? "pending";
                    const isFinal = status === "complete" || status === "partial";
                    const href = isFinal
                      ? `/app/assessment/${assessment.id}/results`
                      : `/app/assessment/${assessment.id}/processing`;
                    return (
                      <Link key={assessment.id} to={href}>
                        <Card className="group border border-[#D8D2C4] bg-white p-4 transition-colors hover:border-[#A88F5F] hover:bg-[#FBF8F1]">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <StatusPill status={status} />
                                <div className="truncate text-[14px]">
                                  {assessment.project_title || assessment.task_context || `Assessment ${String(assessment.id ?? "").slice(0, 8)}`}
                                </div>
                              </div>
                              <div className="mt-1 text-[11px] text-[#6B6B66]">
                                {assessment.upload_count ?? 0} upload{(assessment.upload_count ?? 0) === 1 ? "" : "s"}
                                {" · "}
                                {dateTime(assessment.updated_at || assessment.created_at)}
                                {assessment.confidence ? <> · <span className="text-[#161616]">{assessment.confidence}</span> confidence</> : null}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-[#6B6B66] opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <EmptyCard>
                  No assessments yet.{" "}
                  <Link to="/app/upload" className="underline">
                    Upload conversations to start one.
                  </Link>
                </EmptyCard>
              )}

              {activeDisputes.length > 0 ? (
                <div className="mt-6">
                  <div className="mb-2 flex items-baseline justify-between">
                    <div>
                      <div className="text-[12px] uppercase tracking-[0.16em] text-[#8A5F10]">Active disputes</div>
                      <h2 className="text-lg tracking-tight">{activeDisputes.length} observation{activeDisputes.length === 1 ? "" : "s"} flagged</h2>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {activeDisputes.slice(0, 3).map((dispute) => (
                      <Card key={dispute.id} className="border border-[#E8CE9C] bg-[#FDF4DC] p-3">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#8A5F10]" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <StatusPill status={dispute.status} />
                              <div className="text-[13px] text-[#161616]">{dispute.dimension}</div>
                            </div>
                            <div className="mt-1 truncate text-[12px] text-[#6B6B66]">{dispute.reason}</div>
                          </div>
                          <span className="shrink-0 text-[11px] text-[#6B6B66]">{dateTime(dispute.created_at)}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : null}

              {pendingRequests.length > 0 ? (
                <div className="mt-6">
                  <div className="mb-2 flex items-baseline justify-between">
                    <div>
                      <div className="text-[12px] uppercase tracking-[0.16em] text-[#5D3FA0]">Contact requests</div>
                      <h2 className="text-lg tracking-tight">{pendingRequests.length} pending intro{pendingRequests.length === 1 ? "" : "s"}</h2>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {pendingRequests.slice(0, 4).map((request) => (
                      <Card key={request.id} className="border border-[#D8D2C4] bg-white p-3">
                        <div className="flex items-start gap-3">
                          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#5D3FA0]" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-[13px] text-[#161616]">{request.name}</div>
                              {request.organization ? (
                                <span className="text-[11px] text-[#6B6B66]">· {request.organization}</span>
                              ) : null}
                              <span className="ml-auto text-[11px] text-[#6B6B66]">{dateTime(request.created_at)}</span>
                            </div>
                            {request.message ? (
                              <div className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#5C5C5C]">
                                {request.message}
                              </div>
                            ) : null}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-[11px] text-[#6B6B66]">{request.email}</span>
                              <div className="ml-auto flex gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    respondRequest.mutate(
                                      { id: request.id, action: "accept" },
                                      { onSuccess: () => toast.success("Accepted") },
                                    )
                                  }
                                  disabled={respondRequest.isPending}
                                  className="inline-flex items-center gap-1 rounded-md border border-[#1F6A3F] bg-[#D3E9D9] px-2 py-0.5 text-[11px] text-[#1F6A3F] disabled:opacity-50"
                                >
                                  <UserCheck className="h-3 w-3" />
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    respondRequest.mutate(
                                      { id: request.id, action: "reject" },
                                      { onSuccess: () => toast.success("Declined") },
                                    )
                                  }
                                  disabled={respondRequest.isPending}
                                  className="inline-flex items-center gap-1 rounded-md border border-[#D8D2C4] bg-white px-2 py-0.5 text-[11px] text-[#6B6B66] hover:border-[#8B2F2F] hover:text-[#8B2F2F] disabled:opacity-50"
                                >
                                  <UserX className="h-3 w-3" />
                                  Decline
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <div>
                  <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Activity</div>
                  <h2 className="text-xl tracking-tight">What's moved</h2>
                </div>
              </div>
              <Card className="border border-[#D8D2C4] bg-white p-0">
                {activity.length > 0 ? (
                  <div className="divide-y divide-[#EAE3CF]">
                    {activity.slice(0, 10).map((event, index) => (
                      <ActivityRow key={`${event.type}-${event.id}-${index}`} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="p-5 text-center text-[13px] text-[#6B6B66]">
                    Nothing has happened yet. Upload a file to start the trail.
                  </div>
                )}
              </Card>
            </section>
          </div>

          {recentProofPages.length > 0 ? (
            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <div>
                  <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Proof pages</div>
                  <h2 className="text-xl tracking-tight">Your public artifacts</h2>
                </div>
                <Link to="/app/proof-pages" className="text-[12px] text-[#6B6B66] hover:text-[#161616]">
                  Manage →
                </Link>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {recentProofPages.map((page) => {
                  const path = proofPagePath(page);
                  return (
                    <Card key={page.id} className="border border-[#D8D2C4] bg-white p-4">
                      <div className="flex items-center gap-2">
                        <StatusPill status={page.status ?? "draft"} />
                        {page.visibility ? (
                          <span className="text-[11px] uppercase tracking-[0.08em] text-[#6B6B66]">{page.visibility}</span>
                        ) : null}
                      </div>
                      <div className="mt-2 truncate text-[14px]">
                        {page.project_title || page.headline || "Untitled proof"}
                      </div>
                      {page.summary ? (
                        <div className="mt-1 line-clamp-2 text-[12px] leading-snug text-[#6B6B66]">{page.summary}</div>
                      ) : null}
                      <div className="mt-3 flex items-center justify-between text-[11px] text-[#6B6B66]">
                        <span>{page.view_count ?? 0} views</span>
                        {path && page.status === "published" ? (
                          <a href={path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#315D8A] hover:underline">
                            Open <ArrowUpRight className="h-3 w-3" />
                          </a>
                        ) : null}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="grid gap-3 md:grid-cols-2">
            <DirectoryCard data={directoryQuery.data} />
            <Card className="border border-[#D8D2C4] bg-[#FBF8F1] p-5">
              <div className="text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">Next steps</div>
              <div className="mt-3 space-y-1">
                <NextStep icon={<UploadIcon className="h-4 w-4 text-[#315D8A]" />} to="/app/upload" title="Upload conversations" detail="Intake files and merge exports." />
                <NextStep icon={<FolderKanban className="h-4 w-4 text-[#315D8A]" />} to="/app/projects" title="Cluster into projects" detail="Confirm or rename suggested work streams." />
                <NextStep icon={<FileBarChart className="h-4 w-4 text-[#315D8A]" />} to="/app/assessments" title="Run an assessment" detail="Turn confirmed projects into evidence." />
                <NextStep icon={<Globe className="h-4 w-4 text-[#315D8A]" />} to="/app/proof-pages" title="Publish proof" detail="Curate excerpts and go public." />
                <NextStep icon={<ArrowUpRight className="h-4 w-4 text-[#315D8A]" />} to="/explore" title="Browse explore" detail="See every published proof page in the public explore feed." />
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

function ScoreBlock({ label, value, suffix, color }: { label: string; value: number | null | undefined; suffix?: string; color: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">{label}</div>
      <div className="mt-1 text-4xl tracking-tight" style={{ color }}>
        {value != null ? value : "—"}
        {value != null && suffix ? <span className="text-lg">{suffix}</span> : null}
      </div>
    </div>
  );
}

type Completeness = {
  pct: number;
  total: number;
  done: number;
  nextLabel: string | null;
};

function profileCompleteness(stats: {
  uploads: number;
  projects: number;
  assessments: number;
  profilesHlsAvailable: boolean;
  proofsPublished: number;
}): Completeness {
  const checklist: Array<{ ok: boolean; label: string }> = [
    { ok: stats.uploads > 0, label: "Upload conversations" },
    { ok: stats.projects > 0, label: "Confirm a project" },
    { ok: stats.assessments > 0, label: "Run an assessment" },
    { ok: stats.profilesHlsAvailable, label: "Generate a work profile" },
    { ok: stats.proofsPublished > 0, label: "Publish a proof page" },
  ];
  const done = checklist.filter((c) => c.ok).length;
  const nextLabel = checklist.find((c) => !c.ok)?.label ?? null;
  return { pct: Math.round((done / checklist.length) * 100), total: checklist.length, done, nextLabel };
}

function CompletenessPanel({ completeness }: { completeness: Completeness }) {
  return (
    <div className="min-w-[240px] rounded-lg border border-[#D8D2C4] bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.14em] text-[#6B6B66]">Profile completeness</div>
        <div className="text-[11px] text-[#6B6B66]">{completeness.done} / {completeness.total}</div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-3xl tracking-tight">{completeness.pct}<span className="text-base text-[#6B6B66]">%</span></div>
        {completeness.pct === 100 ? <Check className="h-5 w-5 text-[#1F6A3F]" /> : null}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EAE3CF]">
        <div className="h-full bg-[#315D8A]" style={{ width: `${completeness.pct}%` }} />
      </div>
      {completeness.nextLabel ? (
        <div className="mt-2 text-[11px] text-[#6B6B66]">Next: <span className="text-[#161616]">{completeness.nextLabel}</span></div>
      ) : (
        <div className="mt-2 text-[11px] text-[#1F6A3F]">Everything critical is live. Now compound it.</div>
      )}
    </div>
  );
}

type DashboardPulse = {
  title: string;
  lede: string;
  badge: string;
  accent: string;
  stats: Array<{ label: string; value: string }>;
};

function dashboardPulse(input: {
  assessments: number;
  publishedProofs: number;
  activeDisputes: number;
  pendingRequests: number;
  totalConversations: number;
  archetype: string | null;
}): DashboardPulse {
  if (input.publishedProofs > 0) {
    return {
      title: "Public momentum",
      badge: "LIVE",
      accent: "#1F6A3F",
      lede:
        input.pendingRequests > 0
          ? `Your proof is live and pulling people in. ${input.pendingRequests} pending intro${input.pendingRequests === 1 ? "" : "s"} waiting on you.`
          : `You have public proof in the world. Now the game is compounding signal, not wondering if the work is legible.`,
      stats: [
        { label: "published", value: String(input.publishedProofs) },
        { label: "assessments", value: String(input.assessments) },
        { label: "active disputes", value: String(input.activeDisputes) },
      ],
    };
  }
  if (input.assessments > 0) {
    return {
      title: "Private momentum",
      badge: "READY",
      accent: "#5D3FA0",
      lede: `You already have evidence in the system. ${input.assessments} assessment${input.assessments === 1 ? "" : "s"} are sitting there waiting to become public proof.`,
      stats: [
        { label: "assessments", value: String(input.assessments) },
        { label: "conversations", value: String(input.totalConversations) },
        { label: "archetype", value: input.archetype || "pending" },
      ],
    };
  }
  return {
    title: "Cold start",
    badge: "START",
    accent: "#315D8A",
    lede: "Nothing is broken. You just have no evidence in motion yet. Upload something real and the dashboard starts breathing.",
    stats: [
      { label: "conversations", value: String(input.totalConversations) },
      { label: "assessments", value: String(input.assessments) },
      { label: "published", value: String(input.publishedProofs) },
    ],
  };
}

function PulsePanel({ pulse }: { pulse: DashboardPulse }) {
  return (
    <div className="min-w-[240px] rounded-lg border border-[#D8D2C4] bg-[#111114] p-4 text-white shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.14em] text-[rgba(255,255,255,0.58)]">Current pulse</div>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase"
          style={{ background: `${pulse.accent}33`, color: "#fff" }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: pulse.accent }} />
          {pulse.badge}
        </span>
      </div>
      <div className="mt-2 text-2xl tracking-tight">{pulse.title}</div>
      <p className="mt-2 text-[12px] leading-relaxed text-[rgba(255,255,255,0.72)]">{pulse.lede}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {pulse.stats.map((stat) => (
          <div key={stat.label} className="rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-2 py-2">
            <div className="text-[18px] tracking-tight">{stat.value}</div>
            <div className="text-[10px] uppercase tracking-[0.08em] text-[rgba(255,255,255,0.52)]">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function dashboardWins(input: {
  totalConversations: number;
  projects: number;
  assessments: number;
  publishedProofs: number;
  archetype: string | null;
  pendingRequests: number;
  activeDisputes: number;
  directoryEnabled: boolean;
}) {
  return [
    {
      label: "evidence captured",
      value: `${input.totalConversations}`,
      detail: input.totalConversations > 0 ? "raw conversations in the system" : "nothing ingested yet",
      color: "#315D8A",
    },
    {
      label: "work shape",
      value: input.archetype || (input.projects > 0 ? `${input.projects} projects` : "unformed"),
      detail: input.archetype ? "latest work-profile read" : "projects become profile signal",
      color: "#A8741A",
    },
    {
      label: "public surface",
      value: input.publishedProofs > 0 ? `${input.publishedProofs} live` : "private",
      detail: input.directoryEnabled ? "eligible for explore discovery" : "publish to become visible",
      color: "#1F6A3F",
    },
    {
      label: "inbound heat",
      value: input.pendingRequests > 0 ? `${input.pendingRequests} waiting` : input.activeDisputes > 0 ? `${input.activeDisputes} challenged` : "quiet",
      detail: input.pendingRequests > 0 ? "people want access or contact" : input.activeDisputes > 0 ? "observations need review" : "good time to publish harder",
      color: "#5D3FA0",
    },
  ];
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  const href = activityHref(event);
  const icon =
    event.type === "assessment" ? <FileBarChart className="h-4 w-4 text-[#315D8A]" /> :
    event.type === "project" ? <FolderKanban className="h-4 w-4 text-[#315D8A]" /> :
    event.type === "proof_page" ? <Globe className="h-4 w-4 text-[#315D8A]" /> :
    <UploadIcon className="h-4 w-4 text-[#315D8A]" />;
  const content = (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#FBF8F1]">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] uppercase tracking-[0.08em] text-[#6B6B66]">{event.type.replace("_", " ")}</span>
          <StatusPill status={event.action} />
        </div>
        <div className="truncate text-[13px] text-[#161616]">
          {event.title || event.detail || event.id.slice(0, 8)}
        </div>
      </div>
      <div className="shrink-0 text-[11px] text-[#6B6B66]">{relativeTime(event.timestamp)}</div>
    </div>
  );
  return href ? <Link to={href}>{content}</Link> : <div>{content}</div>;
}

function activityHref(event: ActivityEvent): string | null {
  switch (event.type) {
    case "assessment":
      return event.action === "complete" || event.action === "partial"
        ? `/app/assessment/${event.id}/results`
        : `/app/assessment/${event.id}/processing`;
    case "project":
      return `/app/projects/${event.id}`;
    case "proof_page":
      return `/app/proof-pages`;
    default:
      return null;
  }
}

function relativeTime(iso: string) {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 60_000) return "just now";
  if (diffMs < 3_600_000) return `${Math.round(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.round(diffMs / 3_600_000)}h ago`;
  return `${Math.round(diffMs / 86_400_000)}d ago`;
}

function NextStep({ icon, to, title, detail }: { icon: React.ReactNode; to: string; title: string; detail: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-md border border-transparent px-2 py-2 transition-colors hover:border-[#D8D2C4] hover:bg-white">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px]">{title}</div>
        <div className="text-[12px] text-[#6B6B66]">{detail}</div>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-[#6B6B66]" />
    </Link>
  );
}

function DirectoryCard({ data }: { data?: DirectoryStatus }) {
  if (!data) {
    return (
      <Card className="border border-[#D8D2C4] bg-white p-5">
        <div className="text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">Public explore</div>
        <div className="mt-3 text-[13px] text-[#5C5C5C]">Checking directory status...</div>
      </Card>
    );
  }
  const pct = Math.min(100, Math.round((data.total_published / Math.max(data.threshold, 1)) * 100));
  return (
    <Card className="border border-[#D8D2C4] bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">Public explore</div>
        <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.08em] text-[#6B6B66]">
          {data.enabled ? <><Check className="h-3 w-3 text-[#1F6A3F]" /> Live</> : <><Clock className="h-3 w-3" /> Gated</>}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-3xl tracking-tight">{data.total_published}</div>
        <div className="text-[13px] text-[#6B6B66]">of {data.threshold} published needed</div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EAE3CF]">
        <div className="h-full bg-[#1F6A3F]" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 text-[12px] leading-relaxed text-[#5C5C5C]">
        {data.enabled
          ? "Explore is live. Published proof pages now show up there automatically."
          : `${data.threshold - data.total_published} more proof page${data.threshold - data.total_published === 1 ? "" : "s"} until the public explore feed opens.`}
      </div>
      <Link to="/explore" className="mt-4 inline-flex items-center gap-1 text-[12px] text-[#315D8A] hover:underline">
        Open explore <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </Card>
  );
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-5 text-center text-[13px] text-[#6B6B66]">
      <Sparkles className="mx-auto mb-2 h-4 w-4 text-[#6B6B66]" />
      {children}
    </Card>
  );
}
