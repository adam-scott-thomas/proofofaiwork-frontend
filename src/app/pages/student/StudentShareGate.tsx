import { Twitter, Linkedin, Lock, Unlock } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAssessmentResults } from "../../../hooks/useApi";

export default function StudentShareGate() {
  const [hasShared, setHasShared] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get("id") || "";

  const { data: resultsData } = useAssessmentResults(assessmentId);

  // Build share text with real scores when available
  const hlsScore = resultsData?.hls ?? resultsData?.hls_score ?? null;
  const aiLoad = resultsData?.ai_load ?? resultsData?.ai_execution_load ?? null;
  const cai = resultsData?.cai ?? resultsData?.cai_multiplier ?? null;

  const scoreFragment =
    hlsScore != null && aiLoad != null && cai != null
      ? ` HLS: ${hlsScore}% | AI Load: ${aiLoad}% | CAI: ${cai}x.`
      : "";

  const shareText = `I just analyzed my AI work style with Proof of AI Work.${scoreFragment} See how you work with AI →`;
  const shareUrl = "https://proofofaiwork.com/student";

  const handleShare = (platform: "twitter" | "linkedin") => {
    let url = "";

    if (platform === "twitter") {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    } else {
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    }

    window.open(url, "_blank", "width=600,height=400");

    // Mark as shared after a brief delay (simulate share completion)
    setTimeout(() => {
      setHasShared(true);
    }, 1500);
  };

  const handleContinue = () => {
    const idParam = assessmentId ? `?id=${assessmentId}` : "";
    navigate(`/student/results${idParam}`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-8">
      <div className="max-w-xl w-full">
        {/* Lock/Unlock Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F5F5F7]">
            {hasShared ? (
              <Unlock className="h-10 w-10 text-[#00C853]" />
            ) : (
              <Lock className="h-10 w-10 text-[#717182]" />
            )}
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-3xl tracking-tight">
            {hasShared ? "Results Unlocked!" : "Share to See Your Results"}
          </h1>
          <p className="text-[15px] text-[#717182]">
            {hasShared
              ? "Your analysis is ready. View your AI work style profile below."
              : "Help us spread the word. Share this free tool and unlock your full analysis."}
          </p>
        </div>

        {!hasShared ? (
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-8">
            <div className="mb-6 text-center">
              <div className="mb-4 text-[13px] uppercase tracking-wider text-[#717182]">
                Choose a Platform
              </div>
            </div>

            <div className="space-y-3">
              <Button
                size="lg"
                variant="outline"
                className="w-full justify-start gap-3 text-[15px]"
                onClick={() => handleShare("twitter")}
              >
                <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                Share on Twitter
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="w-full justify-start gap-3 text-[15px]"
                onClick={() => handleShare("linkedin")}
              >
                <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                Share on LinkedIn
              </Button>
            </div>

            <div className="mt-6 border-t border-[rgba(0,0,0,0.06)] pt-6">
              <div className="rounded-md bg-[#FAFAFA] p-4 text-[13px] text-[#717182]">
                <strong className="text-[#030213]">Preview:</strong>
                <p className="mt-2">{shareText}</p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="text-center">
            <Button size="lg" className="min-w-[200px]" onClick={handleContinue}>
              View Results
            </Button>

            <p className="mt-4 text-[13px] text-[#717182]">
              Thank you for sharing!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
