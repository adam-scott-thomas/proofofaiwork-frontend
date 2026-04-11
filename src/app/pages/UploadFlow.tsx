import { Upload, Sparkles, Lock, FolderKanban, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useState } from "react";
import { useNavigate } from "react-router";
import { PaymentModal } from "../components/PaymentModal";
import { useDirectUpload, useAssessment, useAssessmentResults, useProjects } from "../../hooks/useApi";

type FlowStep = "upload" | "processing" | "partial-results" | "unlock";

// Map backend assessment status to UI processing step index (0–3)
function statusToStepIndex(status: string): number {
  switch (status) {
    case "pending":
    case "parsing":
      return 0;
    case "normalizing":
      return 1;
    case "gating":
    case "evaluating":
      return 2;
    case "aggregating":
      return 3;
    default:
      return 0;
  }
}

// Map backend status to approximate progress percentage
function statusToProgress(status: string): number {
  switch (status) {
    case "pending":
      return 5;
    case "parsing":
      return 20;
    case "normalizing":
      return 40;
    case "gating":
      return 55;
    case "evaluating":
      return 70;
    case "aggregating":
      return 85;
    case "complete":
    case "partial":
      return 100;
    default:
      return 5;
  }
}

const processingStepLabels = [
  "Reading conversations",
  "Detecting patterns",
  "Mapping projects",
  "Generating insights",
];

export default function UploadFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<FlowStep>("upload");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const directUpload = useDirectUpload();

  // Poll assessment status every 2s while in processing step
  const { data: assessmentData } = useAssessment(assessmentId ?? "", {
    refetchInterval: step === "processing" ? 2000 : false,
  });

  const currentStatus: string = assessmentData?.status ?? "pending";
  const isDone = currentStatus === "complete" || currentStatus === "partial";
  const currentProcessingStep = statusToStepIndex(currentStatus);
  const progress = statusToProgress(currentStatus);

  // When polling detects done, advance to partial-results
  if (step === "processing" && isDone && assessmentId) {
    setStep("partial-results");
  }

  // Partial results data
  const { data: resultsData } = useAssessmentResults(
    step === "partial-results" && assessmentId ? assessmentId : ""
  );
  const { data: projectsData } = useProjects();

  const projects: any[] = projectsData?.items ?? projectsData ?? [];
  const conversationCount: number =
    resultsData?.conversation_count ??
    resultsData?.observations?.length ??
    null;
  const projectCount: number = projects.length || null;

  // Compute "days of work" from project date ranges if available
  let daysOfWork: number | null = null;
  if (projects.length > 0) {
    const timestamps = projects
      .flatMap((p: any) => [p.start_date, p.end_date, p.first_seen, p.last_seen])
      .filter(Boolean)
      .map((d: string) => new Date(d).getTime())
      .filter((t) => !isNaN(t));
    if (timestamps.length >= 2) {
      const span = Math.max(...timestamps) - Math.min(...timestamps);
      daysOfWork = Math.max(1, Math.round(span / (1000 * 60 * 60 * 24)));
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadError(null);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setUploadError(null);

    directUpload.mutate(
      { files: [file] },
      {
        onSuccess: (result: any) => {
          const id: string =
            result?.assessment_id ??
            result?.assessmentId ??
            result?.id ??
            null;
          if (id) {
            setAssessmentId(id);
          }
          setStep("processing");
        },
        onError: (err: any) => {
          const msg =
            err?.message ??
            err?.detail ??
            "Upload failed. Please try again.";
          setUploadError(msg);
        },
      }
    );
  };

  const handleUnlock = () => {
    setPaymentModalOpen(true);
  };

  // Upload Step
  if (step === "upload") {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-start justify-center px-8 py-16 overflow-y-auto">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-5xl tracking-tight">Upload your conversations</h1>
            <p className="text-xl text-[#717182]">
              ChatGPT, Claude, or Grok exports accepted
            </p>
          </div>

          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-12">
            <label
              htmlFor="file-upload"
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[rgba(0,0,0,0.12)] bg-[#FAFAFA] px-8 py-16 transition-colors hover:border-[rgba(0,0,0,0.24)] hover:bg-[#F5F5F7]"
            >
              <Upload className="mb-4 h-12 w-12 text-[#717182]" />
              <div className="mb-2 text-lg">
                {file ? file.name : "Click to upload or drag and drop"}
              </div>
              <div className="text-[13px] text-[#717182]">
                ZIP, JSON, or TXT files accepted
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".zip,.json,.txt"
                onChange={handleFileSelect}
              />
            </label>

            {uploadError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                {uploadError}
              </div>
            )}

            {file && (
              <Button
                size="lg"
                className="mt-6 w-full text-lg"
                onClick={handleUpload}
                disabled={directUpload.isPending}
              >
                {directUpload.isPending ? "Uploading..." : "Start Analysis"}
              </Button>
            )}
          </Card>

          <div className="mt-8 text-center text-[13px] text-[#717182]">
            Your data is processed securely and never shared
          </div>
        </div>
      </div>
    );
  }

  // Processing Step
  if (step === "processing") {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-8">
        <div className="w-full max-w-xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#F5F5F7]">
              <Sparkles className="h-12 w-12 text-[#030213] animate-pulse" />
            </div>
          </div>

          <h2 className="mb-3 text-3xl tracking-tight">
            We're analyzing your work
          </h2>
          <p className="mb-8 text-lg text-[#717182]">
            {processingStepLabels[currentProcessingStep]}
          </p>

          <div className="mb-3">
            <Progress value={progress} className="h-2" />
          </div>
          <div className="text-[13px] text-[#717182]">{progress}%</div>
        </div>
      </div>
    );
  }

  // Partial Results Step
  if (step === "partial-results") {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#00C853]">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="mb-3 text-5xl tracking-tight">We've mapped your work</h1>
            <p className="text-xl text-[#717182]">
              Here's what we found in your conversations
            </p>
          </div>

          {/* Detected Projects */}
          <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white p-8">
            <div className="mb-6 flex items-center gap-3">
              <FolderKanban className="h-6 w-6" />
              <h2 className="text-2xl tracking-tight">Detected Projects</h2>
            </div>

            <div className="space-y-3">
              {projects.length > 0 ? (
                projects.slice(0, 3).map((project: any) => {
                  const convCount =
                    project.conversation_count ??
                    project.conversations?.length ??
                    project.count ??
                    null;
                  const startDate = project.start_date ?? project.first_seen ?? null;
                  const endDate = project.end_date ?? project.last_seen ?? null;
                  const dateRange =
                    startDate && endDate
                      ? `${new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                      : null;

                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-lg border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] p-4"
                    >
                      <div>
                        <div className="mb-1 text-[15px] font-medium">
                          {project.name ?? project.title ?? "Unnamed Project"}
                        </div>
                        {convCount !== null && (
                          <div className="text-[13px] text-[#717182]">
                            {convCount} conversation{convCount !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                      {dateRange && (
                        <div className="text-[13px] text-[#717182]">{dateRange}</div>
                      )}
                    </div>
                  );
                })
              ) : (
                // Fallback placeholders while data loads
                <>
                  <div className="flex items-center justify-between rounded-lg border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] p-4">
                    <div>
                      <div className="mb-1 text-[15px] font-medium">
                        Landing Page Redesign
                      </div>
                      <div className="text-[13px] text-[#717182]">
                        23 conversations
                      </div>
                    </div>
                    <div className="text-[13px] text-[#717182]">Mar 15 - Mar 28</div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] p-4">
                    <div>
                      <div className="mb-1 text-[15px] font-medium">API Integration</div>
                      <div className="text-[13px] text-[#717182]">
                        18 conversations
                      </div>
                    </div>
                    <div className="text-[13px] text-[#717182]">Mar 8 - Mar 20</div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] p-4">
                    <div>
                      <div className="mb-1 text-[15px] font-medium">
                        Database Optimization
                      </div>
                      <div className="text-[13px] text-[#717182]">
                        12 conversations
                      </div>
                    </div>
                    <div className="text-[13px] text-[#717182]">Feb 28 - Mar 12</div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 text-center">
              <div className="mb-2 text-3xl tracking-tight">
                {conversationCount !== null ? conversationCount : "87"}
              </div>
              <div className="text-[13px] text-[#717182]">Total Conversations</div>
            </Card>
            <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 text-center">
              <div className="mb-2 text-3xl tracking-tight">
                {projectCount !== null ? projectCount : "6"}
              </div>
              <div className="text-[13px] text-[#717182]">Projects Identified</div>
            </Card>
            <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 text-center">
              <div className="mb-2 text-3xl tracking-tight">
                {daysOfWork !== null ? daysOfWork : "42"}
              </div>
              <div className="text-[13px] text-[#717182]">Days of Work</div>
            </Card>
          </div>

          {/* Locked Section */}
          <Card className="relative overflow-hidden border-2 border-[rgba(0,0,0,0.12)] bg-white p-8">
            {/* Blurred Preview */}
            <div className="blur-sm select-none pointer-events-none">
              <div className="mb-6 flex items-center gap-3">
                <TrendingUp className="h-6 w-6" />
                <h2 className="text-2xl tracking-tight">Your Full Profile</h2>
              </div>

              <div className="mb-6 rounded-lg bg-[#FAFAFA] p-6">
                <div className="mb-3 text-[11px] uppercase tracking-wider text-[#717182]">
                  Operator Level
                </div>
                <div className="text-5xl tracking-tight">ADVANCED–INTERMEDIATE</div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-2 text-[13px] uppercase tracking-wider text-[#717182]">
                    Strengths
                  </div>
                  <div className="text-[15px]">
                    You control direction and get outcomes
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-[13px] uppercase tracking-wider text-[#717182]">
                    Gaps
                  </div>
                  <div className="text-[15px]">
                    You don't define constraints early
                  </div>
                </div>
              </div>
            </div>

            {/* Unlock Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
              <div className="max-w-md text-center">
                <div className="mb-6 flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F5F5F7]">
                    <Lock className="h-10 w-10 text-[#030213]" />
                  </div>
                </div>

                <h3 className="mb-4 text-3xl tracking-tight">
                  Unlock your full analysis
                </h3>

                <ul className="mb-8 space-y-2 text-left text-[15px] text-[#717182]">
                  <li className="flex items-start gap-2">
                    <span>—</span>
                    <span>Your operator level (ADVANCED, INTERMEDIATE, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>—</span>
                    <span>Detailed strengths and gaps analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>—</span>
                    <span>Shareable proof page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>—</span>
                    <span>Knowledge map visualization</span>
                  </li>
                </ul>

                <Button
                  size="lg"
                  className="h-14 min-w-[240px] text-lg font-medium"
                  onClick={handleUnlock}
                >
                  Unlock full analysis — $7
                </Button>

                <p className="mt-4 text-[13px] text-[#717182]">
                  One-time payment. Full access forever.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          onComplete={() => {
            setPaymentModalOpen(false);
            navigate("/app");
          }}
        />
      </div>
    );
  }

  return null;
}
