import { Download, Share2, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useState } from "react";
import { ShareDialog } from "../components/ShareDialog";
import { useWorkProfile, useCurrentUser } from "../../hooks/useApi";

function DimensionBar({ label, value, max = 1 }: { label: string; value: number; max?: number }) {
  const pct = max <= 1 ? value * 100 : (value / max) * 100;
  const display = max <= 1 ? Math.round(value * 100) : value.toFixed(1);
  const suffix = max <= 1 ? "/100" : `/${max}`;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[13px]">
        <span className="text-[#3A3A3A]">{label}</span>
        <span className="font-mono text-[#717182]">{display}{suffix}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#F5F5F7]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#6B46C1] to-[#8B5CF6]"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function EvidenceItem({ label, value, trend }: { label: string; value: string | number; trend?: 'up' | 'down' }) {
  return (
    <div className="rounded-sm border border-[rgba(0,0,0,0.06)] bg-white p-4">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-[#717182]">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl tracking-tight">{value}</div>
        {trend && (
          <TrendingUp
            className={`h-4 w-4 ${trend === 'up' ? 'text-green-600' : 'text-red-600 rotate-180'}`}
          />
        )}
      </div>
    </div>
  );
}

export default function WorkProfile() {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const { data: profile, isLoading, isError } = useWorkProfile();
  const { data: user } = useCurrentUser();

  const shareData = {
    name: user?.name ?? "—",
    handle: user?.handle ?? "",
    hlsScore: profile?.human_leadership_score ?? 0,
    aelScore: Math.round((profile?.ai_execution_load ?? 0) * 100),
    caiScore: profile?.cai ?? 0,
    proofUrl: `https://poaw.io/p/${user?.handle ?? ""}`,
    conversationCount: profile?.conversation_count ?? 0,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#717182]">
        Loading work profile...
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen">
        <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
          <div className="px-8 py-6">
            <h1 className="text-xl tracking-tight">Work Profile</h1>
            <p className="mt-1 text-[13px] text-[#717182]">Your verified AI work capacity across all projects</p>
          </div>
        </header>
        <div className="p-8">
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm text-center">
            <p className="mb-2 text-[15px]">No work profile yet</p>
            <p className="text-[13px] text-[#717182]">
              Upload conversations and run an assessment to generate your AI Work Profile.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const hlsDimensions = profile.hls_dimensions ?? {};
  const caiDimensions = profile.cai_dimensions ?? {};
  const evidence = profile.evidence ?? {};
  const archetype = profile.archetype ?? { primary: "—", secondary: [] };
  const secondaryArchetypes: string[] = Array.isArray(archetype.secondary)
    ? archetype.secondary
    : archetype.secondary
    ? [archetype.secondary]
    : [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl tracking-tight">Work Profile</h1>
              <p className="mt-1 text-[13px] text-[#717182]">
                Your verified AI work capacity across all projects
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShareDialogOpen(true)}>
                <Share2 className="mr-2 h-4 w-4" />
                Share Profile
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-8 py-8">
        {/* Header Card with Three Scores */}
        <Card className="mb-8 border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <div className="mb-1 text-[13px] uppercase tracking-wider text-[#717182]">
                Aggregate Work Profile
              </div>
              <div className="text-[15px] text-[#717182]">
                Based on {profile.project_count ?? 0} projects, {profile.conversation_count ?? 0} conversations
              </div>
              {profile.evaluated_at && (
                <div className="mt-1 text-[13px] text-[#717182] font-mono">
                  Evaluated {new Date(profile.evaluated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              )}
            </div>
            {profile.confidence && (
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {profile.confidence.toUpperCase()} CONFIDENCE
              </Badge>
            )}
          </div>

          {/* Four Scores */}
          <div className="grid grid-cols-4 gap-6">
            <div className="border-r border-[rgba(0,0,0,0.06)] pr-6">
              <div className="mb-2 text-[13px] text-[#717182]">Human Leadership</div>
              <div className="mb-1 text-6xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--score-hls)' }}>
                {profile.human_leadership_score}
              </div>
              <div className="text-[13px] text-[#717182]">of 100</div>
            </div>

            <div className="border-r border-[rgba(0,0,0,0.06)] pr-6">
              <div className="mb-2 text-[13px] text-[#717182]">AI Execution Load</div>
              <div className="mb-1 text-6xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--score-execution)' }}>
                {(profile.ai_execution_load * 100).toFixed(0)}%
              </div>
              <div className="text-[13px] text-[#717182]">AI-generated output</div>
            </div>

            <div className="border-r border-[rgba(0,0,0,0.06)] pr-6">
              <div className="mb-2 text-[13px] text-[#717182]">Amplified</div>
              <div className="mb-1 text-6xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--score-cai)' }}>
                {((profile.amplified_capabilities ?? profile.cai) / 100).toFixed(1)}x
              </div>
              <div className="text-[13px] text-[#717182]">existing skills boosted</div>
            </div>

            <div>
              <div className="mb-2 text-[13px] text-[#717182]">Unlocked</div>
              <div className="mb-1 text-6xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: '#10B981' }}>
                +{profile.unlocked_capabilities?.count ?? 0}
              </div>
              <div className="text-[13px] text-[#717182]">new domains via AI</div>
            </div>
          </div>

          {/* Archetype */}
          <div className="mt-8 flex items-center gap-3 border-t border-[rgba(0,0,0,0.06)] pt-8">
            <div className="text-[13px] uppercase tracking-wider text-[#717182]">Archetype</div>
            {archetype.primary && (
              <div className="rounded-sm bg-[#F5F5F7] px-3 py-1.5 font-mono text-[15px] tracking-tight">
                {archetype.primary}
              </div>
            )}
            {secondaryArchetypes.map((arch) => (
              <div key={arch} className="rounded-sm bg-[#F5F5F7] px-3 py-1.5 font-mono text-[13px] tracking-tight text-[#717182]">
                {arch}
              </div>
            ))}
          </div>
        </Card>

        {/* HLS Dimensions */}
        {Object.keys(hlsDimensions).length > 0 && (
          <Card className="mb-8 border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h3 className="mb-1 text-[15px]">Human Leadership Score Breakdown</h3>
              <p className="text-[13px] text-[#717182]">
                Six dimensions measuring human control and strategic direction
              </p>
            </div>
            <div className="space-y-4">
              {hlsDimensions.goal_origination != null && <DimensionBar label="Goal Origination" value={hlsDimensions.goal_origination} />}
              {hlsDimensions.constraint_setting != null && <DimensionBar label="Constraint Setting" value={hlsDimensions.constraint_setting} />}
              {hlsDimensions.decision_control != null && <DimensionBar label="Decision Control" value={hlsDimensions.decision_control} />}
              {hlsDimensions.correction_pressure != null && <DimensionBar label="Correction Pressure" value={hlsDimensions.correction_pressure} />}
              {hlsDimensions.strategic_pivots != null && <DimensionBar label="Strategic Pivots" value={hlsDimensions.strategic_pivots} />}
              {hlsDimensions.final_ownership != null && <DimensionBar label="Final Ownership" value={hlsDimensions.final_ownership} />}
              {hlsDimensions.continuity != null && hlsDimensions.continuity > 0 && <DimensionBar label="Continuity" value={hlsDimensions.continuity} />}
            </div>
          </Card>
        )}

        {/* CAI Dimensions */}
        {Object.keys(caiDimensions).length > 0 && (
          <Card className="mb-8 border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h3 className="mb-1 text-[15px]">CAI Dimensions</h3>
              <p className="text-[13px] text-[#717182]">
                Six factors contributing to cognitive capacity amplification
              </p>
            </div>
            <div className="space-y-4">
              {caiDimensions.complexity_ceiling != null && <DimensionBar label="Complexity Ceiling" value={caiDimensions.complexity_ceiling} max={5} />}
              {caiDimensions.iteration_depth != null && <DimensionBar label="Iteration Depth" value={caiDimensions.iteration_depth} max={10} />}
              {caiDimensions.velocity != null && <DimensionBar label="Velocity" value={caiDimensions.velocity} max={10} />}
              {caiDimensions.domain_span != null && <DimensionBar label="Domain Span" value={caiDimensions.domain_span} max={10} />}
              {caiDimensions.throughput != null && <DimensionBar label="Throughput" value={caiDimensions.throughput} max={10} />}
              {caiDimensions.leverage_maturity != null && <DimensionBar label="Leverage Maturity" value={caiDimensions.leverage_maturity} max={10} />}
            </div>
          </Card>
        )}

        {/* Unlocked Capabilities */}
        {profile.unlocked_capabilities && profile.unlocked_capabilities.count > 0 && (
          <Card className="mb-8 border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h3 className="mb-1 text-[15px]">Unlocked Capabilities</h3>
              <p className="text-[13px] text-[#717182]">
                Domains this user could not work in before AI — {profile.unlocked_capabilities.count} new capabilities
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {profile.unlocked_capabilities.domains.map((d: any) => (
                <div key={d.name} className="rounded-md border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] p-4">
                  <div className="mb-1 text-[14px] font-medium capitalize">{d.name}</div>
                  <div className="inline-block rounded-sm bg-[#F5F5F7] px-2 py-0.5 text-[12px] text-[#717182] capitalize">{d.proficiency}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Evidence Grid */}
        {evidence && Object.keys(evidence).length > 0 && (
          <Card className="mb-8 border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h3 className="mb-1 text-[15px]">Evidence Trail</h3>
              <p className="text-[13px] text-[#717182]">
                Quantified observations from conversation analysis
              </p>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {evidence.rejected_drafts != null && <EvidenceItem label="Rejected Drafts" value={evidence.rejected_drafts} />}
              {evidence.constructive_revisions != null && <EvidenceItem label="Constructive Revisions" value={evidence.constructive_revisions} />}
              {evidence.strategic_pivots != null && <EvidenceItem label="Strategic Pivots" value={evidence.strategic_pivots} />}
              {evidence.accepted_artifacts != null && <EvidenceItem label="Accepted Artifacts" value={evidence.accepted_artifacts} />}
              {evidence.velocity_days != null && <EvidenceItem label="Velocity (Days)" value={evidence.velocity_days} trend="up" />}
              {evidence.velocity_baseline_days != null && <EvidenceItem label="Baseline (Days)" value={evidence.velocity_baseline_days} />}
              {evidence.complexity_percentile != null && <EvidenceItem label="Complexity %ile" value={`${evidence.complexity_percentile}th`} />}
              {evidence.prompt_sophistication_gain != null && (
                <EvidenceItem label="Prompt Sophistication" value={`+${(evidence.prompt_sophistication_gain * 100).toFixed(0)}%`} trend="up" />
              )}
            </div>
            {evidence.validated_domains?.length > 0 && (
              <div className="mt-6 border-t border-[rgba(0,0,0,0.06)] pt-6">
                <div className="mb-2 text-[13px] uppercase tracking-wider text-[#717182]">Validated Domains</div>
                <div className="flex flex-wrap gap-2">
                  {evidence.validated_domains.map((domain: string) => (
                    <Badge key={domain} variant="outline" className="border-[rgba(0,0,0,0.08)] font-mono text-[12px]">
                      {domain}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Narrative Interpretation */}
        {profile.narrative && (
          <Card className="mb-8 border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
            <div className="mb-4">
              <h3 className="mb-1 text-[15px]">Narrative Interpretation</h3>
              <p className="text-[13px] text-[#717182]">
                LLM-generated summary of behavioral patterns and capabilities
              </p>
            </div>
            <p className="text-[15px] leading-relaxed text-[#3A3A3A]">
              {profile.narrative}
            </p>
          </Card>
        )}

        {/* Confidence & Integrity */}
        <div className="grid grid-cols-2 gap-6">
          {profile.confidence_rationale?.length > 0 && (
            <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <h3 className="text-[15px]">Confidence Rationale</h3>
              </div>
              <ul className="space-y-2">
                {profile.confidence_rationale.map((reason: string, i: number) => (
                  <li key={i} className="flex gap-2 text-[13px] text-[#3A3A3A]">
                    <span className="text-[#717182]">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {profile.integrity && (
            <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h3 className="text-[15px]">Integrity Check</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-[13px] text-[#717182]">Manipulation Likelihood</div>
                  <Badge variant="secondary" className="mt-1 bg-green-50 text-green-700 border-green-200">
                    {(profile.integrity.manipulation_likelihood ?? "low").toUpperCase()}
                  </Badge>
                </div>
                {(!profile.integrity.flags || profile.integrity.flags.length === 0) && (
                  <div className="rounded-sm bg-green-50 px-3 py-2 text-[13px] text-green-800">
                    No integrity flags detected
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      <ShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} data={shareData} />
    </div>
  );
}
