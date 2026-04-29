import { ArrowRight, FileBarChart, FolderKanban, Globe, Loader2, MessageSquare, Sparkles, Upload as UploadIcon } from "lucide-react";
import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAiCluster, useClusterStatus, useCurrentUser, useFrontendState } from "../../hooks/useApi";

type ActionState = boolean | { enabled?: boolean; disabled?: boolean; reason?: string; label?: string; href?: string };

function actionEnabled(actions: Record<string, ActionState> | undefined, key: string, fallback = true) {
  const action = actions?.[key];
  if (action == null) return fallback;
  if (typeof action === "boolean") return action;
  if (action.disabled != null) return !action.disabled;
  return action.enabled ?? fallback;
}

function recommendedAction(raw: any) {
  if (!raw) return { label: "Upload conversations", href: "/app/upload" };
  if (typeof raw === "string") return actionMap(raw);
  return {
    label: raw.label ?? actionMap(raw.action).label,
    href: raw.href ?? actionMap(raw.action).href,
    disabled: raw.disabled,
    reason: raw.reason,
  };
}

function actionMap(action?: string) {
  switch ((action ?? "").toLowerCase()) {
    case "upload":
    case "upload_conversations":
      return { label: "Upload conversations", href: "/app/upload" };
    case "ai_group":
    case "ai_group_conversations":
    case "cluster":
      return { label: "AI group conversations", href: "/app/upload" };
    case "review_projects":
    case "projects":
      return { label: "Review projects", href: "/app/projects" };
    case "run_assessment":
    case "assessments":
      return { label: "Run assessment", href: "/app/assessments" };
    case "publish_proof":
    case "proof_pages":
      return { label: "Publish proof page", href: "/app/proof-pages" };
    default:
      return { label: "Open workspace", href: "/app/upload" };
  }
}

function countValue(source: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value != null && !Number.isNaN(Number(value))) return Number(value);
  }
  return 0;
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: me } = useCurrentUser();
  const { data: state, isLoading } = useFrontendState();
  const aiCluster = useAiCluster();
  const [clusterJobId, setClusterJobId] = useState<string | null>(null);
  const [clusterDone, setClusterDone] = useState(false);
  const clusterStatus = useClusterStatus(clusterJobId, !clusterDone);

  const counts = useMemo(() => ({
    ...(state?.counts ?? {}),
    ...(state?.dashboard?.counts ?? {}),
  }), [state]);
  const actions = state?.actions ?? {};
  const primary = recommendedAction(state?.dashboard?.next_recommended_action);
  const handle = me?.handle ? `@${String(me.handle).replace(/^@/, "")}` : me?.email ?? "operator";

  useEffect(() => {
    const status = clusterStatus.data?.status;
    if (!clusterJobId || clusterDone || !status) return;
    if (status === "complete") {
      setClusterDone(true);
      toast.success("AI group conversations complete");
      queryClient.invalidateQueries({ queryKey: ["state"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
    if (status === "failed") {
      setClusterDone(true);
      toast.error(clusterStatus.data.error_message || "AI group conversations failed");
    }
  }, [clusterDone, clusterJobId, clusterStatus.data, queryClient]);

  const clusterActive = !!clusterJobId && !clusterDone && clusterStatus.data?.status !== "failed";
  const canAiGroup = actionEnabled(actions, "ai_group_conversations", actionEnabled(actions, "ai_group", true));

  const stats = [
    { label: "Conversations", value: countValue(counts, ["total_conversations", "conversations", "uploads"]), href: "/app/conversations", icon: MessageSquare },
    { label: "Projects", value: countValue(counts, ["projects", "project_count"]), href: "/app/projects", icon: FolderKanban },
    { label: "Assessments", value: countValue(counts, ["assessments", "assessment_count"]), href: "/app/assessments", icon: FileBarChart },
    { label: "Proof pages", value: countValue(counts, ["proof_pages", "published_proofs", "published_proof_pages"]), href: "/app/proof-pages", icon: Globe },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Dashboard</div>
              <h1 className="mt-2 text-3xl tracking-tight">Welcome back, {handle}.</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#5C5C5C]">
                This view is driven by the backend workspace state.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {primary.href ? (
                <Link to={primary.href}>
                  <Button disabled={!!primary.disabled}>
                    {primary.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : null}
              <Button
                variant="outline"
                disabled={!canAiGroup || aiCluster.isPending || clusterActive}
                onClick={() => {
                  toast.info("Calling AI group conversations API...");
                  aiCluster.mutate(
                    { tier: "free" },
                    {
                      onSuccess: (result) => {
                        setClusterDone(false);
                        setClusterJobId(result.job_id);
                        toast.success("AI group conversations queued");
                      },
                      onError: (error: any) => toast.error(error?.message ?? "AI group conversations failed"),
                    },
                  );
                }}
              >
                {aiCluster.isPending || clusterActive ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                AI group conversations
              </Button>
            </div>
          </div>
          {primary.reason ? <div className="mt-3 text-[12px] text-[#6B6B66]">{primary.reason}</div> : null}
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link key={stat.label} to={stat.href}>
                  <Card className="group border border-[#D8D2C4] bg-white p-5 shadow-sm transition-colors hover:border-[#A88F5F] hover:bg-[#FBF8F1]">
                    <div className="flex items-center justify-between">
                      <div className="text-[12px] uppercase tracking-[0.12em] text-[#6B6B66]">{stat.label}</div>
                      <Icon className="h-4 w-4 text-[#6B6B66]" />
                    </div>
                    <div className="mt-3 text-3xl tracking-tight text-[#161616]">{stat.value}</div>
                  </Card>
                </Link>
              );
            })}
          </section>

          {clusterJobId ? (
            <Card className="border border-[#D8D2C4] bg-white p-4">
              <div className="flex items-center gap-2 text-[13px] text-[#5C5C5C]">
                {clusterActive ? <Loader2 className="h-4 w-4 animate-spin text-[#315D8A]" /> : null}
                <span>
                  {clusterStatus.data?.status === "complete"
                    ? "AI group conversations complete."
                    : clusterStatus.data?.status === "failed"
                      ? "AI group conversations failed."
                      : clusterStatus.data?.status === "running"
                        ? "AI is grouping conversations..."
                        : "AI group conversations queued."}
                </span>
              </div>
            </Card>
          ) : null}

          <Card className="border border-[#D8D2C4] bg-[#FBF8F1] p-5">
            <div className="text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">Next steps</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <NextStep to="/app/upload" icon={<UploadIcon className="h-4 w-4 text-[#315D8A]" />} title="Upload conversations" />
              <NextStep to="/app/projects" icon={<FolderKanban className="h-4 w-4 text-[#315D8A]" />} title="Review projects" />
              <NextStep to="/app/assessments" icon={<FileBarChart className="h-4 w-4 text-[#315D8A]" />} title="Run assessments" />
              <NextStep to="/app/proof-pages" icon={<Globe className="h-4 w-4 text-[#315D8A]" />} title="Publish proof pages" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NextStep({ to, icon, title }: { to: string; icon: React.ReactNode; title: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-md border border-[#D8D2C4] bg-white px-3 py-3 text-[13px] text-[#161616] hover:bg-[#FBF8F1]">
      {icon}
      <span className="flex-1">{title}</span>
      <ArrowRight className="h-3.5 w-3.5 text-[#6B6B66]" />
    </Link>
  );
}
