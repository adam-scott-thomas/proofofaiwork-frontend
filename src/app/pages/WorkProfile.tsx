import {
  Activity,
  AlertTriangle,
  Check,
  Compass,
  Loader2,
  ShieldAlert,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useWorkProfile } from "../../hooks/useApi";
import { dateTime } from "../lib/poaw";
import { Link } from "react-router";

const HLS_DIMENSIONS: Array<{ key: keyof HLSDimensions; label: string; help: string }> = [
  { key: "goal_origination", label: "Goal origination", help: "Who set the direction?" },
  { key: "constraint_setting", label: "Constraint setting", help: "Who bounded the problem?" },
  { key: "decision_control", label: "Decision control", help: "Who chose between options?" },
  { key: "correction_pressure", label: "Correction pressure", help: "Who rejected weak output?" },
  { key: "strategic_pivots", label: "Strategic pivots", help: "Who re-steered mid-task?" },
  { key: "final_ownership", label: "Final ownership", help: "Who signed off on the artifact?" },
  { key: "continuity", label: "Continuity", help: "How consistent across sessions?" },
];

const CAI_DIMENSIONS: Array<{ key: keyof CAIDimensions; label: string; help: string }> = [
  { key: "complexity_ceiling", label: "Complexity ceiling", help: "How hard the work was." },
  { key: "iteration_depth", label: "Iteration depth", help: "How many refinement rounds." },
  { key: "velocity", label: "Velocity", help: "How fast relative to baseline." },
  { key: "domain_span", label: "Domain span", help: "Breadth of validated domains." },
  { key: "throughput", label: "Throughput", help: "Volume of accepted artifacts." },
];

type HLSDimensions = {
  goal_origination: number;
  constraint_setting: number;
  decision_control: number;
  correction_pressure: number;
  strategic_pivots: number;
  final_ownership: number;
  continuity: number;
};

type CAIDimensions = {
  complexity_ceiling: number;
  iteration_depth: number;
  velocity: number;
  domain_span: number;
  throughput: number;
};

export default function WorkProfile() {
  const { data, isLoading, error } = useWorkProfile();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading work profile...
      </div>
    );
  }

  // 404 or other failure → treat as "no profile yet"
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
        <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
          <div className="px-8 py-7">
            <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Work profile</div>
            <h1 className="mt-2 text-3xl tracking-tight">Your aggregate AI work profile.</h1>
          </div>
        </header>
        <div className="px-8 py-10">
          <Card className="mx-auto max-w-2xl border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-10 text-center text-[14px] text-[#5C5C5C]">
            <Activity className="mx-auto mb-3 h-6 w-6 text-[#6B6B66]" />
            <div className="text-[#161616]">No work profile yet.</div>
            <div className="mt-1">
              Evaluate a confirmed project first — the aggregate profile builds from assessment results.
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <Link to="/app/projects">
                <Button variant="outline">Go to projects</Button>
              </Link>
              <Link to="/app/upload/new">
                <Button>Upload conversations</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const hls = data.hls_dimensions || {};
  const cai = data.cai_dimensions || {};
  const evidence = data.evidence || {};
  const unlocked = data.unlocked_capabilities;

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Work profile</div>
              <h1 className="mt-2 text-3xl tracking-tight">
                {data.archetype?.primary || "Your aggregate AI work profile."}
              </h1>
              {Array.isArray(data.archetype?.secondary) && data.archetype.secondary.length > 0 ? (
                <p className="mt-1 text-[13px] text-[#6B6B66]">
                  secondary: {data.archetype.secondary.join(" · ")}
                </p>
              ) : null}
              {data.narrative ? (
                <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#5C5C5C]">
                  {data.narrative}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#6B6B66]">
                <span>status {data.status}</span>
                {data.confidence ? <span>confidence {data.confidence}</span> : null}
                {data.evaluated_at ? <span>evaluated {dateTime(data.evaluated_at)}</span> : null}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <ScoreCard
              label="Human leadership"
              value={data.human_leadership_score}
              color="#315D8A"
              icon={Target}
              help="How much of the direction came from you."
            />
            <ScoreCard
              label="AI execution load"
              value={data.ai_execution_load != null ? Math.round(data.ai_execution_load * 100) : null}
              suffix="%"
              color="#A8741A"
              icon={Zap}
              help="Share of output produced by the AI."
            />
            <ScoreCard
              label="CAI"
              value={data.cai}
              color="#2F6B3B"
              icon={TrendingUp}
              help="Capability amplification index."
            />
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <DimensionsCard
              title="HLS dimensions"
              eyebrow="How the leadership score splits"
              rows={HLS_DIMENSIONS.map(({ key, label, help }) => ({
                label,
                help,
                value: (hls as any)[key] ?? 0,
              }))}
              accent="#315D8A"
            />
            <DimensionsCard
              title="CAI dimensions"
              eyebrow="How amplification splits"
              rows={CAI_DIMENSIONS.map(({ key, label, help }) => ({
                label,
                help,
                value: (cai as any)[key] ?? 0,
              }))}
              accent="#2F6B3B"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border border-[#D8D2C4] bg-white p-5">
              <div className="text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">Evidence</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <EvidenceRow label="Accepted artifacts" value={evidence.accepted_artifacts ?? 0} />
                <EvidenceRow label="Rejected drafts" value={evidence.rejected_drafts ?? 0} />
                <EvidenceRow label="Constructive revisions" value={evidence.constructive_revisions ?? 0} />
                <EvidenceRow label="Strategic pivots" value={evidence.strategic_pivots ?? 0} />
                <EvidenceRow label="Validated domains" value={evidence.validated_domains ?? 0} />
                <EvidenceRow
                  label="Velocity"
                  value={evidence.velocity_days != null ? `${evidence.velocity_days.toFixed(1)}d` : "—"}
                  sub={
                    evidence.velocity_baseline_days != null
                      ? `baseline ${evidence.velocity_baseline_days.toFixed(1)}d`
                      : undefined
                  }
                />
                {evidence.complexity_percentile != null ? (
                  <EvidenceRow label="Complexity percentile" value={`${Math.round(evidence.complexity_percentile)}th`} />
                ) : null}
                {evidence.prompt_sophistication_gain != null ? (
                  <EvidenceRow
                    label="Prompt sophistication gain"
                    value={`${Math.round(evidence.prompt_sophistication_gain * 100)}%`}
                  />
                ) : null}
              </div>
            </Card>

            <Card className="border border-[#D8D2C4] bg-white p-5">
              <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">
                <ShieldAlert className="h-3.5 w-3.5" />
                Integrity
              </div>
              <div className="mt-3 text-[13px] text-[#161616]">
                Manipulation likelihood:{" "}
                <span className="font-medium">{data.integrity?.manipulation_likelihood || "—"}</span>
              </div>
              {Array.isArray(data.integrity?.flags) && data.integrity.flags.length > 0 ? (
                <div className="mt-3 space-y-1">
                  {data.integrity.flags.map((flag: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 rounded-md border border-[#E8CE9C] bg-[#FDF4DC] px-3 py-1.5 text-[12px] text-[#8A5F10]"
                    >
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                      {flag}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 inline-flex items-center gap-1 text-[12px] text-[#1F6A3F]">
                  <Check className="h-3 w-3" />
                  No flags
                </div>
              )}
              {Array.isArray(data.integrity?.adjustments) && data.integrity.adjustments.length > 0 ? (
                <div className="mt-3">
                  <div className="text-[11px] uppercase tracking-[0.1em] text-[#6B6B66]">Adjustments applied</div>
                  <ul className="mt-1 space-y-1 text-[11px] leading-relaxed text-[#5C5C5C]">
                    {data.integrity.adjustments.map((adj: string, index: number) => (
                      <li key={index}>— {adj}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {data.continuity_score != null ? (
                <div className="mt-4 border-t border-[#EAE3CF] pt-3">
                  <div className="text-[11px] uppercase tracking-[0.1em] text-[#6B6B66]">Continuity</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <div className="text-2xl tracking-tight">{Math.round(data.continuity_score * 100)}</div>
                    <div className="text-[11px] text-[#6B6B66]">consistency across sessions</div>
                  </div>
                </div>
              ) : null}
            </Card>
          </div>

          {unlocked && unlocked.count > 0 ? (
            <Card className="border border-[#D8D2C4] bg-white p-5">
              <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">
                <Compass className="h-3.5 w-3.5" />
                Unlocked capabilities ({unlocked.count})
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {unlocked.domains.map((domain) => (
                  <div key={domain.name} className="rounded-md border border-[#EAE3CF] bg-[#FBF8F1] p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[13px] text-[#161616]">{domain.name}</div>
                      {domain.percentile != null ? (
                        <div className="text-[11px] text-[#6B6B66]">{domain.percentile}th %ile</div>
                      ) : null}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-[11px] text-[#6B6B66]">{domain.proficiency}</div>
                      {domain.benchmark_level ? (
                        <div className="text-[10px] uppercase tracking-[0.08em] text-[#486E9B]">
                          {domain.benchmark_level}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {Array.isArray(data.confidence_rationale) && data.confidence_rationale.length > 0 ? (
            <Card className="border border-[#D8D2C4] bg-white p-5">
              <div className="text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">Why this confidence</div>
              <ul className="mt-3 space-y-2">
                {data.confidence_rationale.map((reason: string, index: number) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 rounded-md border border-[#EAE3CF] bg-[#FBF8F1] px-3 py-2 text-[12px] leading-relaxed text-[#5C5C5C]"
                  >
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#486E9B]" />
                    {reason}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  suffix,
  color,
  icon: Icon,
  help,
}: {
  label: string;
  value: number | null | undefined;
  suffix?: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  help: string;
}) {
  return (
    <Card className="border border-[#D8D2C4] bg-white p-5">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1 text-5xl tracking-tight" style={{ color }}>
        {value != null ? value : "—"}
        {value != null && suffix ? <span className="text-xl">{suffix}</span> : null}
      </div>
      <div className="mt-1 text-[11px] text-[#6B6B66]">{help}</div>
    </Card>
  );
}

function DimensionsCard({
  title,
  eyebrow,
  rows,
  accent,
}: {
  title: string;
  eyebrow: string;
  rows: Array<{ label: string; help: string; value: number }>;
  accent: string;
}) {
  return (
    <Card className="border border-[#D8D2C4] bg-white p-5">
      <div className="text-[12px] uppercase tracking-[0.14em] text-[#6B6B66]">{title}</div>
      <div className="text-[11px] text-[#6B6B66]">{eyebrow}</div>
      <div className="mt-4 space-y-3">
        {rows.map((row) => {
          const pct = Math.max(0, Math.min(100, row.value <= 1 ? row.value * 100 : row.value));
          return (
            <div key={row.label}>
              <div className="flex items-baseline justify-between">
                <div className="text-[12px] text-[#161616]">{row.label}</div>
                <div className="text-[11px] text-[#6B6B66]">{Math.round(pct)}%</div>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#EAE3CF]">
                <div className="h-full" style={{ backgroundColor: accent, width: `${pct}%` }} />
              </div>
              <div className="mt-0.5 text-[10px] text-[#6B6B66]">{row.help}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function EvidenceRow({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-md border border-[#EAE3CF] bg-[#FBF8F1] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.1em] text-[#6B6B66]">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <div className="text-lg tracking-tight">{value}</div>
        {sub ? <div className="text-[10px] text-[#6B6B66]">{sub}</div> : null}
      </div>
    </div>
  );
}
