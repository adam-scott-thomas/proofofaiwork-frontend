import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Upload as UploadIcon,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { usePresignUpload, useCompleteUpload } from "../../hooks/useApi";
import { apiFetch, apiPost } from "../../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";

const ALLOWED_EXTENSIONS = ["txt", "json", "zip", "jsonl"] as const;
type AllowedExt = (typeof ALLOWED_EXTENSIONS)[number];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type SubmitStep = "form" | "uploading" | "creating" | "done" | "error";

export default function StudentSubmit() {
  const navigate = useNavigate();

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [className, setClassName] = useState("");
  const [assignmentName, setAssignmentName] = useState("");
  const [aiTools, setAiTools] = useState("");
  const [description, setDescription] = useState("");

  // Upload state
  const [step, setStep] = useState<SubmitStep>("form");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const presignMutation = usePresignUpload();
  const completeMutation = useCompleteUpload();

  const validateFile = (f: File): string | null => {
    if (f.size > MAX_FILE_SIZE) return `File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`;
    if (f.size === 0) return "File is empty.";
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext as AllowedExt))
      return `Unsupported file type. Upload a ${ALLOWED_EXTENSIONS.join(", ")} export from ChatGPT or Claude.`;
    return null;
  };

  const handleFile = (f: File) => {
    const err = validateFile(f);
    if (err) {
      setErrorMsg(err);
      setStep("error");
      return;
    }
    setFile(f);
    setErrorMsg("");
    setStep("form");
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = useCallback(async () => {
    if (!file || !assignmentName.trim()) return;

    const taskContext = [
      className.trim() && `Class: ${className.trim()}`,
      `Assignment: ${assignmentName.trim()}`,
      aiTools.trim() && `AI tools used: ${aiTools.trim()}`,
      description.trim() && `Description: ${description.trim()}`,
    ].filter(Boolean).join("\n");

    setStep("uploading");
    setProgress(0);

    try {
      // 1. Presign
      const ext = file.name.split(".").pop()?.toLowerCase() as AllowedExt;
      const presign = await presignMutation.mutateAsync({
        file_name: file.name,
        file_type: ext,
        file_size_bytes: file.size,
        allow_data_use: false,
      });

      // 2. Upload to S3
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presign.presigned_url);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 60));
        };
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      setProgress(65);

      // 3. Complete upload (triggers parsing)
      await completeMutation.mutateAsync({ upload_id: presign.upload_id });

      // 4. Poll parse status
      const uploadId = String(presign.upload_id);
      const parseStart = Date.now();
      let parsed = false;
      for (let i = 0; i < 300; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        try {
          const status = await apiFetch<{ status: string; conversations_found: number; conversations_parsed: number }>(
            `/uploads/parse-status/${uploadId}`
          );
          const found = status.conversations_found || 0;
          const done = status.conversations_parsed || 0;
          const parsePct = found > 0 ? Math.round((done / found) * 30) : 0;
          setProgress(65 + parsePct);

          if (status.status === "complete") { parsed = true; break; }
          if (status.status === "failed") throw new Error("Parsing failed. Please try a different file.");
        } catch (e) {
          if (e instanceof Error && e.message.includes("Parsing failed")) throw e;
        }
        if (Date.now() - parseStart > 5 * 60 * 1000) break;
      }
      if (!parsed) {
        // Proceed anyway — some files parse quickly
        setProgress(95);
      }

      setStep("creating");
      setProgress(96);

      // 5. Create assessment with task_context
      const assessment = await apiPost<{ id: string; status: string }>("/assessments", {
        upload_ids: [presign.upload_id],
        task_context: taskContext,
      });

      setProgress(100);
      setStep("done");

      // 6. Navigate to processing
      setTimeout(() => {
        navigate(`/student/processing/${assessment.id}`);
      }, 800);

    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      setStep("error");
    }
  }, [file, className, assignmentName, aiTools, description, presignMutation, completeMutation, navigate]);

  const isSubmitting = step === "uploading" || step === "creating";
  const canSubmit = file && assignmentName.trim() && !isSubmitting;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </div>
          <h1 className="text-xl tracking-tight">Submit your work</h1>
        </div>
        <p className="text-[14px] leading-relaxed text-[#717182]">
          Upload the AI conversation you used for your assignment. We'll analyze how much
          was your direction versus AI output, so you can prove your contribution to
          your professor.
        </p>
      </div>

      {/* Upload zone */}
      <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <CardContent className="p-6">
          <label className="mb-2 block text-[13px] font-medium text-[#030213]">
            AI conversation export <span className="text-red-500">*</span>
          </label>

          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                isDragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.2)]"
              }`}
            >
              <UploadIcon className="mx-auto mb-3 h-8 w-8 text-[#717182]" />
              <p className="mb-1 text-[14px] text-[#030213]">Drop your file here or click to browse</p>
              <p className="mb-4 text-[12px] text-[#717182]">
                JSON, JSONL, ZIP, or TXT export from ChatGPT or Claude
              </p>
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-2 rounded-md bg-[#030213] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#1a1a2e]">
                  <UploadIcon className="h-4 w-4" />
                  Choose file
                </span>
                <input
                  type="file"
                  accept=".txt,.json,.zip,.jsonl"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] p-4">
              <FileText className="h-8 w-8 flex-shrink-0 text-blue-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-[#030213]">{file.name}</p>
                <p className="text-[12px] text-[#717182]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              {!isSubmitting && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFile(null); setStep("form"); setErrorMsg(""); }}
                  className="text-[12px] text-[#717182]"
                >
                  Remove
                </Button>
              )}
            </div>
          )}

          <p className="mt-3 text-[11px] text-[#717182]">
            How to export: <strong>ChatGPT</strong> → Settings → Data controls → Export data.{" "}
            <strong>Claude</strong> → Settings → Export conversations.
          </p>
        </CardContent>
      </Card>

      {/* Assignment context */}
      <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-4 text-[15px] font-medium text-[#030213]">About your assignment</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#030213]">
                Assignment name <span className="text-red-500">*</span>
              </label>
              <Input
                value={assignmentName}
                onChange={(e) => setAssignmentName(e.target.value)}
                placeholder="e.g. Research paper on climate policy"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#030213]">
                Class
              </label>
              <Input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. English 201, CS 101"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#030213]">
                AI tools used
              </label>
              <Input
                value={aiTools}
                onChange={(e) => setAiTools(e.target.value)}
                placeholder="e.g. ChatGPT, Claude, Copilot"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#030213]">
                What did you use AI for?
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. I used ChatGPT to help brainstorm my thesis outline and find sources, then wrote the paper myself and used it for editing feedback."
                disabled={isSubmitting}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {step === "error" && errorMsg && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <p className="text-[14px] font-medium text-red-900">Upload failed</p>
            <p className="mt-0.5 text-[13px] text-red-700">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Progress */}
      {isSubmitting && (
        <Card className="mb-6 border border-blue-200 bg-blue-50 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <p className="text-[14px] font-medium text-blue-900">
                {step === "uploading" && progress < 60 && "Uploading your conversation..."}
                {step === "uploading" && progress >= 60 && "Parsing conversations..."}
                {step === "creating" && "Starting evaluation..."}
              </p>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Done */}
      {step === "done" && (
        <Card className="mb-6 border border-green-200 bg-green-50 shadow-sm">
          <CardContent className="flex items-center gap-3 p-6">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-[14px] font-medium text-green-900">Submitted!</p>
              <p className="text-[13px] text-green-700">Taking you to your results...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-6 text-[15px]"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            Analyze my work
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>

      {/* Fine print */}
      <p className="mt-4 text-center text-[11px] text-[#717182]">
        Your uploaded files are automatically deleted 72 hours after evaluation completes.
        Only structured analysis results are retained.
      </p>
    </div>
  );
}
