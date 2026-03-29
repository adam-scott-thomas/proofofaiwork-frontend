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
  X,
  Type,
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
type InputMode = "file" | "paste";

export default function StudentSubmit() {
  const navigate = useNavigate();

  // Form state
  const [files, setFiles] = useState<File[]>([]);
  const [pastedText, setPastedText] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("file");
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
    if (f.size > MAX_FILE_SIZE) return `${f.name} is too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`;
    if (f.size === 0) return `${f.name} is empty.`;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext as AllowedExt))
      return `${f.name}: unsupported file type. Upload ${ALLOWED_EXTENSIONS.join(", ")} exports.`;
    return null;
  };

  const addFiles = (newFiles: File[]) => {
    for (const f of newFiles) {
      const err = validateFile(f);
      if (err) {
        setErrorMsg(err);
        setStep("error");
        return;
      }
    }
    setFiles((prev) => [...prev, ...newFiles]);
    setErrorMsg("");
    setStep("form");
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) addFiles(dropped);
  };

  const hasInput = inputMode === "file" ? files.length > 0 : pastedText.trim().length > 20;

  const handleSubmit = useCallback(async () => {
    if (!hasInput || !assignmentName.trim()) return;

    const taskContext = [
      className.trim() && `Class: ${className.trim()}`,
      `Assignment: ${assignmentName.trim()}`,
      aiTools.trim() && `AI tools used: ${aiTools.trim()}`,
      description.trim() && `Description: ${description.trim()}`,
    ].filter(Boolean).join("\n");

    setStep("uploading");
    setProgress(0);

    try {
      // Build file list — if paste mode, convert text to a .txt file
      let filesToUpload: File[];
      if (inputMode === "paste") {
        const blob = new Blob([pastedText], { type: "text/plain" });
        filesToUpload = [new File([blob], "pasted-conversation.txt", { type: "text/plain" })];
      } else {
        filesToUpload = files;
      }

      const totalFiles = filesToUpload.length;
      const uploadIds: string[] = [];

      for (let i = 0; i < totalFiles; i++) {
        const file = filesToUpload[i];
        const fileProgressBase = (i / totalFiles) * 60;
        const fileProgressRange = 60 / totalFiles;

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
            if (e.lengthComputable) {
              setProgress(Math.round(fileProgressBase + (e.loaded / e.total) * fileProgressRange));
            }
          };
          xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.send(file);
        });

        // 3. Complete upload (triggers parsing)
        await completeMutation.mutateAsync({ upload_id: presign.upload_id });
        uploadIds.push(String(presign.upload_id));
      }

      setProgress(65);

      // 4. Poll parse status for the last upload (good enough indicator)
      const lastUploadId = uploadIds[uploadIds.length - 1];
      const parseStart = Date.now();
      let parsed = false;
      for (let i = 0; i < 300; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        try {
          const status = await apiFetch<{ status: string; conversations_found: number; conversations_parsed: number }>(
            `/uploads/parse-status/${lastUploadId}`
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
        setProgress(95);
      }

      setStep("creating");
      setProgress(96);

      // 5. Create assessment with ALL upload_ids
      const assessment = await apiPost<{ id: string; status: string }>("/assessments", {
        upload_ids: uploadIds,
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
  }, [files, pastedText, inputMode, className, assignmentName, aiTools, description, hasInput, presignMutation, completeMutation, navigate]);

  const isSubmitting = step === "uploading" || step === "creating";
  const canSubmit = hasInput && assignmentName.trim() && !isSubmitting;

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
          Upload the AI conversations you used for your assignment, or paste the text directly.
          We'll analyze how much was your direction versus AI output.
        </p>
      </div>

      {/* Input mode tabs */}
      <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setInputMode("file")}
              disabled={isSubmitting}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                inputMode === "file"
                  ? "bg-[#030213] text-white"
                  : "bg-[#F5F5F7] text-[#717182] hover:bg-[#EAEAED]"
              }`}
            >
              <UploadIcon className="h-3.5 w-3.5" />
              Upload files
            </button>
            <button
              onClick={() => setInputMode("paste")}
              disabled={isSubmitting}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                inputMode === "paste"
                  ? "bg-[#030213] text-white"
                  : "bg-[#F5F5F7] text-[#717182] hover:bg-[#EAEAED]"
              }`}
            >
              <Type className="h-3.5 w-3.5" />
              Paste text
            </button>
          </div>

          {inputMode === "file" ? (
            <>
              <label className="mb-2 block text-[13px] font-medium text-[#030213]">
                AI conversation exports <span className="text-red-500">*</span>
              </label>

              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                  isDragging
                    ? "border-blue-400 bg-blue-50"
                    : "border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.2)]"
                }`}
              >
                <UploadIcon className="mx-auto mb-2 h-6 w-6 text-[#717182]" />
                <p className="mb-1 text-[13px] text-[#030213]">Drop files here or click to browse</p>
                <p className="mb-3 text-[11px] text-[#717182]">
                  JSON, JSONL, ZIP, or TXT — multiple files OK
                </p>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 rounded-md bg-[#030213] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#1a1a2e]">
                    <UploadIcon className="h-3.5 w-3.5" />
                    Choose files
                  </span>
                  <input
                    type="file"
                    accept=".txt,.json,.zip,.jsonl"
                    multiple
                    onChange={(e) => {
                      const selected = Array.from(e.target.files ?? []);
                      if (selected.length > 0) addFiles(selected);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] px-4 py-3">
                      <FileText className="h-5 w-5 flex-shrink-0 text-blue-600" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-[#030213]">{f.name}</p>
                        <p className="text-[11px] text-[#717182]">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      {!isSubmitting && (
                        <button onClick={() => removeFile(i)} className="text-[#717182] hover:text-red-500">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <p className="text-[11px] text-[#717182]">{files.length} file{files.length !== 1 ? "s" : ""} selected</p>
                </div>
              )}

              <p className="mt-3 text-[11px] text-[#717182]">
                How to export: <strong>ChatGPT</strong> → Settings → Data controls → Export data.{" "}
                <strong>Claude</strong> → Settings → Export conversations.
              </p>
            </>
          ) : (
            <>
              <label className="mb-2 block text-[13px] font-medium text-[#030213]">
                Paste your AI conversation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={"Paste the full conversation here. Include both your messages and the AI's responses.\n\nExample:\nYou: Can you help me outline my research paper on climate policy?\nAI: Sure! Let's start by identifying your thesis..."}
                disabled={isSubmitting}
                rows={12}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="mt-2 text-[11px] text-[#717182]">
                {pastedText.length > 0 ? `${pastedText.length.toLocaleString()} characters` : "Minimum 20 characters"}
                {" — "}Copy/paste from ChatGPT, Claude, or any AI chat window.
              </p>
            </>
          )}
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
                {step === "uploading" && progress < 60 && "Uploading your conversations..."}
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
