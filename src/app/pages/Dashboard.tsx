import { ArrowRight, FileBarChart, FolderKanban, Globe, Upload } from "lucide-react";
import { Link } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAssessments, useCurrentUser, usePool, useProjects, useProofPages, useWorkProfile } from "../../hooks/useApi";
import { asArray } from "../lib/poaw";

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-sm">
      <div className="text-[12px] uppercase tracking-[0.12em] text-[#6B6B66]">{label}</div>
      <div className="mt-2 text-3xl tracking-tight text-[#161616]">{value}</div>
      <div className="mt-1 text-[13px] text-[#6B6B66]">{detail}</div>
    </Card>
  );
}

export default function Dashboard() {
  const { data: me } = useCurrentUser();
  const { data: poolData, isLoading: poolLoading } = usePool();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const { data: assessmentsData, isLoading: assessmentsLoading } = useAssessments();
  const { data: proofPagesData, isLoading: proofPagesLoading } = useProofPages();
  const { data: workProfile } = useWorkProfile();

  const loading = poolLoading || projectsLoading || assessmentsLoading || proofPagesLoading;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        Loading workspace...
      </div>
    );
  }

  const projects = asArray<any>(projectsData);
  const assessments = asArray<any>(assessmentsData);
  const proofPages = asArray<any>(proofPagesData);
  const totalConversations = poolData?.total ?? 0;
  const unassigned = poolData?.unassigned ?? 0;
  const publishedProofs = proofPages.filter((page) => page?.status === "published").length;
  const handle = me?.handle ? `@${String(me.handle).replace(/^@/, "")}` : me?.email ?? "operator";

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-8">
          <div className="max-w-5xl">
            <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Evidence Desk</div>
            <h1 className="mt-2 text-3xl tracking-tight">Welcome back, {handle}.</h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#5C5C5C]">
              This is the shortest path through the system: upload conversations, assign them to projects,
              run an evaluation, publish a proof page, and opt it into the public directory.
            </p>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Pool"
            value={totalConversations}
            detail={unassigned > 0 ? `${unassigned} still need a project` : "Everything is assigned"}
          />
          <StatCard
            label="Projects"
            value={projects.length}
            detail={projects.length === 0 ? "Create or cluster your first project" : "Confirmed and suggested work streams"}
          />
          <StatCard
            label="Assessments"
            value={assessments.length}
            detail={assessments.length === 0 ? "No evaluations yet" : "Run results from confirmed projects"}
          />
          <StatCard
            label="Published"
            value={publishedProofs}
            detail={publishedProofs === 0 ? "Nothing public yet" : "Live proof pages"}
          />
        </div>

        <div className="mt-8 grid grid-cols-[1.5fr_1fr] gap-6">
          <Card className="border border-[#D8D2C4] bg-[#FBF8F1] p-6 shadow-sm">
            <div className="mb-5 text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Next steps</div>
            <div className="space-y-4">
              <Link to="/app/upload" className="block">
                <div className="flex items-center justify-between rounded-lg border border-[#D8D2C4] bg-white px-4 py-4 transition-colors hover:bg-[#F3EEE2]">
                  <div className="flex items-center gap-3">
                    <Upload className="h-4 w-4 text-[#315D8A]" />
                    <div>
                      <div className="text-[14px]">Upload and parse conversations</div>
                      <div className="text-[13px] text-[#5C5C5C]">Intake files, merge exports, and create an assessment.</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#6B6B66]" />
                </div>
              </Link>

              <Link to="/app/projects" className="block">
                <div className="flex items-center justify-between rounded-lg border border-[#D8D2C4] bg-white px-4 py-4 transition-colors hover:bg-[#F3EEE2]">
                  <div className="flex items-center gap-3">
                    <FolderKanban className="h-4 w-4 text-[#315D8A]" />
                    <div>
                      <div className="text-[14px]">Turn parsed conversations into projects</div>
                      <div className="text-[13px] text-[#5C5C5C]">Cluster, rename, confirm, and move conversations manually.</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#6B6B66]" />
                </div>
              </Link>

              <Link to="/app/assessments" className="block">
                <div className="flex items-center justify-between rounded-lg border border-[#D8D2C4] bg-white px-4 py-4 transition-colors hover:bg-[#F3EEE2]">
                  <div className="flex items-center gap-3">
                    <FileBarChart className="h-4 w-4 text-[#315D8A]" />
                    <div>
                      <div className="text-[14px]">Review results and work profile</div>
                      <div className="text-[13px] text-[#5C5C5C]">Inspect strengths, weaknesses, and evidence summary.</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#6B6B66]" />
                </div>
              </Link>

              <Link to="/app/proof-pages" className="block">
                <div className="flex items-center justify-between rounded-lg border border-[#D8D2C4] bg-white px-4 py-4 transition-colors hover:bg-[#F3EEE2]">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-[#315D8A]" />
                    <div>
                      <div className="text-[14px]">Publish proof and opt into the directory</div>
                      <div className="text-[13px] text-[#5C5C5C]">Create a public page and list it for browsing.</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#6B6B66]" />
                </div>
              </Link>
            </div>
          </Card>

          <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
            <div className="text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Profile signal</div>
            {workProfile ? (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-[12px] text-[#6B6B66]">Human Leadership Score</div>
                  <div className="mt-1 text-4xl tracking-tight text-[#315D8A]">
                    {workProfile.human_leadership_score ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[12px] text-[#6B6B66]">AI Execution Load</div>
                  <div className="mt-1 text-3xl tracking-tight text-[#A8741A]">
                    {workProfile.ai_execution_load != null
                      ? `${Math.round(workProfile.ai_execution_load * 100)}%`
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[12px] text-[#6B6B66]">CAI</div>
                  <div className="mt-1 text-3xl tracking-tight text-[#2F6B3B]">{workProfile.cai ?? "—"}</div>
                </div>
                <Link to="/app/work-profile">
                  <Button variant="outline" className="w-full">Open work profile</Button>
                </Link>
              </div>
            ) : (
              <div className="mt-4 text-[14px] leading-relaxed text-[#5C5C5C]">
                Your work profile appears after you have enough evaluated material.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
