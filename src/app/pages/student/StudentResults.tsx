import { Share2, Download, Twitter, Linkedin, Link as LinkIcon, Check, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAssessmentResults } from "../../../hooks/useApi";

export default function StudentResults() {
  const [copied, setCopied] = useState(false);
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get("id") || "";
  const navigate = useNavigate();

  const { data: resultsData, isLoading, isError } = useAssessmentResults(assessmentId);

  // Map API data to UI scores — try both snake_case and camelCase variants
  const hlsScore: number | null =
    resultsData?.hls ??
    resultsData?.hls_score ??
    resultsData?.scores?.hls ??
    null;
  const aiExecutionLoad: number | null =
    resultsData?.ai_load ??
    resultsData?.ai_execution_load ??
    resultsData?.scores?.ai_load ??
    null;
  const caiMultiplier: number | null =
    resultsData?.cai ??
    resultsData?.cai_multiplier ??
    resultsData?.scores?.cai ??
    null;

  const strengths: string[] =
    resultsData?.strengths ??
    resultsData?.profile?.strengths ??
    [];
  const actions: string[] =
    resultsData?.actions ??
    resultsData?.profile?.actions ??
    [];
  const gaps: string[] =
    resultsData?.gaps ??
    resultsData?.profile?.gaps ??
    [];
  const verdict: string =
    resultsData?.verdict ??
    resultsData?.profile?.verdict ??
    "";

  // Only show share/download when there is at least one real score
  const hasRealResults = hlsScore != null || aiExecutionLoad != null || caiMultiplier != null;

  const shareUrl = assessmentId
    ? `https://proofofaiwork.com/p/${assessmentId}`
    : "https://proofofaiwork.com/";

  const scoreFragment =
    hlsScore != null && aiExecutionLoad != null && caiMultiplier != null
      ? ` HLS: ${hlsScore}% | AI Load: ${aiExecutionLoad}% | CAI: ${caiMultiplier}x`
      : "";
  const shareText = `I analyzed my AI work style.${scoreFragment}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: "twitter" | "linkedin") => {
    let url = "";

    if (platform === "twitter") {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    } else {
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    }

    window.open(url, "_blank", "width=600,height=400");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[#717182]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-[15px]">Loading your results...</p>
        </div>
      </div>
    );
  }

  // Redirect to upload if there's no assessment ID at all
  if (!assessmentId) {
    navigate("/student/upload", { replace: true });
    return null;
  }

  if (isError || (!isLoading && !resultsData)) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-8">
        <div className="text-center">
          <p className="mb-4 text-[15px] text-[#717182]">
            Could not load results. The assessment may still be processing.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-4xl tracking-tight">Your AI Work Style</h1>
          <p className="text-[15px] text-[#717182]">
            Based on analysis of your AI conversations
          </p>
        </div>

        {/* Main Assessment Card */}
        <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white p-8">
          {/* Metrics Grid */}
          <div className="mb-8 grid grid-cols-3 gap-4">
            <div className="rounded-md bg-[#FAFAFA] p-4 text-center">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-[#717182]">
                HLS
              </div>
              <div className="text-3xl tracking-tight">
                {hlsScore != null ? `${hlsScore}%` : "—"}
              </div>
              <div className="mt-1 text-[11px] text-[#717182]">
                Human-Led Steering
              </div>
            </div>

            <div className="rounded-md bg-[#FAFAFA] p-4 text-center">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-[#717182]">
                AI Load
              </div>
              <div className="text-3xl tracking-tight">
                {aiExecutionLoad != null ? `${aiExecutionLoad}%` : "—"}
              </div>
              <div className="mt-1 text-[11px] text-[#717182]">
                Execution Load
              </div>
            </div>

            <div className="rounded-md bg-[#FAFAFA] p-4 text-center">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-[#717182]">
                CAI
              </div>
              <div className="text-3xl tracking-tight">
                {caiMultiplier != null ? `${caiMultiplier}x` : "—"}
              </div>
              <div className="mt-1 text-[11px] text-[#717182]">
                Collaborative AI
              </div>
            </div>
          </div>

          <div className="border-t border-[rgba(0,0,0,0.06)] pt-8">
            {/* Strengths */}
            {strengths.length > 0 && (
              <div className="mb-6">
                <p className="mb-4 text-xl leading-relaxed">
                  You are strong at{" "}
                  <strong>{strengths.join(", ")}</strong>.
                </p>
              </div>
            )}

            {/* What You Do */}
            {actions.length > 0 && (
              <div className="mb-6">
                <div className="mb-2 text-[13px] uppercase tracking-wider text-[#717182]">
                  You:
                </div>
                <ul className="space-y-2">
                  {actions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2 text-[15px]">
                      <span className="text-[#717182]">−</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {gaps.length > 0 && (
              <div className="mb-6">
                <div className="mb-2 text-[13px] uppercase tracking-wider text-[#717182]">
                  But:
                </div>
                <ul className="space-y-2">
                  {gaps.map((gap, index) => (
                    <li key={index} className="flex items-start gap-2 text-[15px]">
                      <span className="text-[#717182]">−</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Verdict */}
            {verdict && (
              <div className="rounded-md bg-[#FAFAFA] p-6">
                <div className="mb-2 text-[13px] uppercase tracking-wider text-[#717182]">
                  Net:
                </div>
                <p className="text-xl leading-relaxed">{verdict}</p>
              </div>
            )}

            {/* Fallback if no profile data yet */}
            {!strengths.length && !actions.length && !gaps.length && !verdict && (
              <div className="rounded-md bg-[#FAFAFA] p-6 text-center text-[15px] text-[#717182]">
                Profile analysis is being generated. Check back shortly.
              </div>
            )}
          </div>
        </Card>

        {/* Share Actions — only shown when real results exist */}
        {hasRealResults && (
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6">
            <div className="mb-4 text-center text-[13px] uppercase tracking-wider text-[#717182]">
              Share Your Results
            </div>

            {/* Copy Link */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 rounded-md border border-[rgba(0,0,0,0.12)] bg-[#FAFAFA] px-4 py-2 text-[13px] text-[#717182]"
                />
                <Button variant="outline" onClick={handleCopyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => handleShare("twitter")}
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => handleShare("linkedin")}
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={() => toast.info("Download coming soon")}>
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </Card>
        )}

        {/* Next Steps */}
        <div className="mt-8 text-center">
          <p className="mb-4 text-[13px] text-[#717182]">
            Want deeper insights and AI-organized project views?
          </p>
          <Button variant="outline" size="lg" onClick={() => navigate("/sign-in")}>
            Upgrade to Full Platform
          </Button>
        </div>
      </div>
    </div>
  );
}
