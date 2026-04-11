import { Download, Share2, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useState } from "react";
import { ShareDialog } from "../components/ShareDialog";
import { useWorkProfile } from "../../hooks/useApi";

function DimensionBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[13px]">
        <span className="text-[#3A3A3A]">{label}</span>
        <span className="font-mono text-[#717182]">{value}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#F5F5F7]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#6B46C1] to-[#8B5CF6]"
          style={{ width: `${value}%` }}
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

  const { data: wp, isLoading } = useWorkProfile();

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center text-[13px] text-[#717182]">Loading...</div>
  );

  const hlsScore = wp?.human_leadership_score ?? wp?.hls ?? 0;
  const aelLoad = wp?.ai_execution_load ?? 0;
  const cai = wp?.cai ?? 0;
  const confidence = wp?.confidence ?? "low";
  const narrative = wp?.narrative ?? "";
  const archetype = wp?.archetype ?? null;
  const hlsDimensions = wp?.hls_dimensions ?? wp?.dimensions?.hls ?? null;
  const caiDimensions = wp?.cai_dimensions ?? wp?.dimensions?.cai ?? null;
  const evidence = wp?.evidence ?? null;
  const confidenceRationale = Array.isArray(wp?.confidence_rationale) ? wp.confidence_rationale : [];
  const integrity = wp?.integrity ?? null;
  const evaluatedAt = wp?.evaluated_at ?? null;
  const projectCount = wp?.project_count ?? 0;
  const conversationCount = wp?.conversation_count ?? 0;

  const shareData = {
    name: "",
    handle: "",
    hlsScore,
    aelScore: Math.round(aelLoad * 100),
    caiScore: cai,
    proofUrl: "https://proofofaiwork.com/p/profile",
    conversationCount,
    date: evaluatedAt ? new Date(evaluatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "",
  };

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
        {!wp ? (
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-8 text-center shadow-sm">
            <p className="text-[15px] text-[#717182]">No work profile yet. Upload conversations and run an assessment to generate your profile.</p>
          </Card>
        ) : (
          <>
            {/* Verdict */}
            <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  {narrative ? (
                    <p className="text-[15px] leading-relaxed text-[#717182]">{narrative}</p>
                  ) : (
                    <p className="text-xl leading-relaxed text-[#3A3A3A]">
                      Work profile generated.
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {String(confidence || "").toUpperCase()} CONFIDENCE
                </Badge>
              </div>
              {(projectCount > 0 || conversationCount > 0 || evaluatedAt) && (
                <div className="border-t border-[rgba(0,0,0,0.06)] pt-4">
                  <div className="text-[13px] text-[#717182]">
                    {projectCount > 0 && `${projectCount} projects`}
                    {projectCount > 0 && conversationCount > 0 && ", "}
                    {conversationCount > 0 && `${conversationCount} conversations`}
                    {evaluatedAt && ` • Evaluated ${new Date(evaluatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </div>
                </div>
              )}
            </Card>

            {/* Signals (Main Metrics) */}
            <Card className="mb-8 border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
              <div className="mb-6">
                <h3 className="mb-1 text-[15px]">Signals</h3>
                <p className="text-[13px] text-[#717182]">
                  The three core metrics that define your AI work profile
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="mb-1 text-6xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--score-hls)' }}>
                      {hlsScore}
                    </div>
                    <div className="text-[13px] text-[#717182]">Human Leadership</div>
                  </div>
                  <div className="pt-2">
                    <p className="text-[15px] leading-relaxed text-[#3A3A3A]">
                      You maintain strong strategic control and originate goals independently.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6 border-t border-[rgba(0,0,0,0.06)] pt-6">
                  <div className="flex-shrink-0">
                    <div className="mb-1 text-6xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--score-execution)' }}>
                      {(aelLoad * 100).toFixed(0)}%
                    </div>
                    <div className="text-[13px] text-[#717182]">AI Execution Load</div>
                  </div>
                  <div className="pt-2">
                    <p className="text-[15px] leading-relaxed text-[#3A3A3A]">
                      You delegate heavily to AI for execution while keeping control of direction.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6 border-t border-[rgba(0,0,0,0.06)] pt-6">
                  <div className="flex-shrink-0">
                    <div className="mb-1 text-6xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--score-cai)' }}>
                      {cai}
                    </div>
                    <div className="text-[13px] text-[#717182]">Cognitive Amplification</div>
                  </div>
                  <div className="pt-2">
                    <p className="text-[15px] leading-relaxed text-[#3A3A3A]">
                      You significantly extend your output capacity using AI.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Detailed Signals (for nerds) */}
            <details className="mb-8">
              <summary className="mb-6 cursor-pointer text-[15px] text-[#717182] hover:text-[#3A3A3A]">
                Detailed Signals (for nerds) →
              </summary>

              <div className="space-y-6 pl-4">
                {/* HLS Dimensions */}
                {hlsDimensions && (
                  <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
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
                    </div>
                  </Card>
                )}

                {/* CAI Dimensions */}
                {caiDimensions && (
                  <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
                    <div className="mb-6">
                      <h3 className="mb-1 text-[15px]">CAI Dimensions</h3>
                      <p className="text-[13px] text-[#717182]">
                        Six factors contributing to cognitive capacity amplification
                      </p>
                    </div>
                    <div className="space-y-4">
                      {caiDimensions.complexity_ceiling != null && <DimensionBar label="Complexity Ceiling" value={caiDimensions.complexity_ceiling} />}
                      {caiDimensions.iteration_depth != null && <DimensionBar label="Iteration Depth" value={caiDimensions.iteration_depth} />}
                      {caiDimensions.velocity != null && <DimensionBar label="Velocity" value={caiDimensions.velocity} />}
                      {caiDimensions.domain_span != null && <DimensionBar label="Domain Span" value={caiDimensions.domain_span} />}
                      {caiDimensions.throughput != null && <DimensionBar label="Throughput" value={caiDimensions.throughput} />}
                      {caiDimensions.leverage_maturity != null && <DimensionBar label="Leverage Maturity" value={caiDimensions.leverage_maturity} />}
                    </div>
                  </Card>
                )}

                {/* Evidence Grid */}
                {evidence && (
                  <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-8 shadow-sm">
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
                    {Array.isArray(evidence.validated_domains) && evidence.validated_domains.length > 0 && (
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
              </div>
            </details>

            {/* Confidence & Integrity */}
            <div className="grid grid-cols-2 gap-6">
              {confidenceRationale.length > 0 && (
                <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <h3 className="text-[15px]">Confidence Rationale</h3>
                  </div>
                  <ul className="space-y-2">
                    {confidenceRationale.map((reason: string, i: number) => (
                      <li key={i} className="flex gap-2 text-[13px] text-[#3A3A3A]">
                        <span className="text-[#717182]">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {integrity && (
                <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <h3 className="text-[15px]">Integrity Check</h3>
                  </div>
                  <div className="space-y-3">
                    {integrity.manipulation_likelihood && (
                      <div>
                        <div className="text-[13px] text-[#717182]">Manipulation Likelihood</div>
                        <Badge variant="secondary" className="mt-1 bg-green-50 text-green-700 border-green-200">
                          {String(integrity.manipulation_likelihood || "").toUpperCase()}
                        </Badge>
                      </div>
                    )}
                    {(!integrity.flags || integrity.flags.length === 0) && (
                      <div className="rounded-sm bg-green-50 px-3 py-2 text-[13px] text-green-800">
                        No integrity flags detected
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </>
        )}
      </div>

      <ShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} data={shareData} />
    </div>
  );
}
