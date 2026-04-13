import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router";
import {
  Upload as UploadIcon,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ArrowRight,
  X,
  Type,
} from "lucide-react";
import { usePresignUpload } from "../../hooks/useApi";
import { apiPost } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Progress } from "../components/ui/progress";

const ALLOWED_EXTENSIONS = ["txt", "json", "pdf", "md", "zip", "jsonl"] as const;
type AllowedExt = (typeof ALLOWED_EXTENSIONS)[number];

const MAX_FILE_SIZE_DEFAULT = 10 * 1024 * 1024;
const MAX_FILE_SIZE_DATA_SHARE = 200 * 1024 * 1024;

type SubmitStep = "form" | "uploading" | "creating" | "done" | "error";
type InputMode = "file" | "paste";

export default function Upload() {
  const navigate = useNavigate();

  const [files, setFiles] = useState<File[]>([]);
  const [pastedText, setPastedText] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("file");

  const [step, setStep] = useState<SubmitStep>("form");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [allowDataUse, setAllowDataUse] = useState(false);
  const [retentionConsent, setRetentionConsent] = useState(false);

  const maxFileSize = allowDataUse ? MAX_FILE_SIZE_DATA_SHARE : MAX_FILE_SIZE_DEFAULT;
  const maxFileSizeLabel = allowDataUse ? "200 MB" : "10 MB";

  const presignMutation = usePresignUpload();

  const validateFile = (f: File): string | null => {
    if (f.size > maxFileSize)
      return `${f.name} is too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${maxFileSizeLabel}.`;
    if (f.size === 0) return `${f.name} is empty.`;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext as AllowedExt))
      return `${f.name}: unsupported file type.`;
    return null;
  };

  const addFiles = (newFiles: File[]) => {
    for (const f of newFiles) {
      const err = validateFile(f);
      if (err) { setErrorMsg(err); setStep("error"); return; }
    }
    setFiles((prev) => [...prev, ...newFiles]);
    setErrorMsg(""); setStep("form");
  };

  const hasContent = inputMode === "file" ? files.length > 0 : pastedText.trim().length > 20;

  const uploadFileToServer = async (presignedUrl: string, file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", presignedUrl);
      const token = useAuthStore.getState().token;
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
      xhr.onerror = () => reject(new Error("Network error during upload"));
      const formData = new FormData();
      formData.append("file", file);
      xhr.send(formData);
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!hasContent || !retentionConsent) return;

    setStep("uploading");
    setProgress(0);

    try {
      // Build file — merge multiple files into one if needed
      let uploadFile: File;
      if (inputMode === "paste") {
        const blob = new Blob([pastedText], { type: "text/plain" });
        uploadFile = new File([blob], "pasted-conversation.txt", { type: "text/plain" });
      } else if (files.length === 1) {
        uploadFile = files[0];
      } else {
        const parts: string[] = [];
        for (const f of files) {
          const text = await f.text();
          parts.push(`\n\n--- ${f.name} ---\n\n${text}`);
        }
        const merged = parts.join("\n");
        const blob = new Blob([merged], { type: "text/plain" });
        uploadFile = new File([blob], `merged_${files.length}_conversations.txt`, { type: "text/plain" });
      }

      setProgress(20);

      // Presign
      const ext = uploadFile.name.split(".").pop()?.toLowerCase() as AllowedExt;
      const presign = await presignMutation.mutateAsync({
        file_name: uploadFile.name,
        file_type: ext,
        file_size_bytes: uploadFile.size,
        allow_data_use: allowDataUse,
      });

      setProgress(40);

      // Upload to server
      await uploadFileToServer(presign.presigned_url, uploadFile);

      setProgress(70);

      // Complete — creates assessment, dispatches parse+evaluate
      const complete = await apiPost<{ upload_id: string; assessment_id: string; status: string }>(
        "/uploads/complete",
        { upload_id: presign.upload_id }
      );

      setProgress(100);
      setStep("done");

      // Navigate to processing page
      setTimeout(() => navigate(`/app/assessment/${complete.assessment_id}/processing`), 800);

    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      setStep("error");
    }
  }, [files, pastedText, inputMode, hasContent, retentionConsent, allowDataUse, presignMutation, navigate, maxFileSize]);

  const isSubmitting = step === "uploading" || step === "creating";
  const canSubmit = hasContent && retentionConsent && !isSubmitting;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="px-8 py-6">
          <Link
            to="/app/upload"
            className="mb-3 inline-flex items-center gap-2 text-[13px] text-[#717182] hover:text-[#030213] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Upload Pool
          </Link>
          <h1 className="text-xl tracking-tight">Upload Conversations</h1>
          <p className="mt-1 text-[13px] text-[#717182]">
            Upload your AI conversation exports for analysis
          </p>
        </div>
      </header>

      <div className="p-8">
        <div className="mx-auto max-w-2xl">
          {/* Input mode toggle */}
          {step === "form" && (
            <>
              <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4 flex gap-2">
                    <button onClick={() => setInputMode("file")} disabled={isSubmitting}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${inputMode === "file" ? "bg-[#030213] text-white" : "bg-[#F5F5F7] text-[#717182] hover:bg-[#EAEAED]"}`}>
                      <UploadIcon className="h-3.5 w-3.5" /> Upload files
                    </button>
                    <button onClick={() => setInputMode("paste")} disabled={isSubmitting}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${inputMode === "paste" ? "bg-[#030213] text-white" : "bg-[#F5F5F7] text-[#717182] hover:bg-[#EAEAED]"}`}>
                      <Type className="h-3.5 w-3.5" /> Paste text
                    </button>
                  </div>

                  {inputMode === "file" ? (
                    <>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const d = Array.from(e.dataTransfer.files); if (d.length) addFiles(d); }}
                        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${isDragging ? "border-blue-400 bg-blue-50" : "border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.2)]"}`}
                      >
                        <UploadIcon className="mx-auto mb-2 h-8 w-8 text-[#717182]" />
                        <p className="mb-1 text-[14px] text-[#030213]">Drop conversation exports here</p>
                        <p className="mb-4 text-[12px] text-[#717182]">JSON, TXT, Markdown, ZIP, JSONL — any chat export format</p>
                        <label className="cursor-pointer">
                          <span className="inline-flex items-center gap-2 rounded-md bg-[#030213] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#1a1a2e]">
                            <UploadIcon className="h-3.5 w-3.5" /> Choose files
                          </span>
                          <input type="file" accept=".txt,.json,.pdf,.md,.zip,.jsonl" multiple
                            onChange={(e) => { const s = Array.from(e.target.files ?? []); if (s.length) addFiles(s); e.target.value = ""; }} className="hidden" />
                        </label>
                      </div>
                      {files.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {files.map((f, i) => (
                            <div key={`f-${f.name}-${i}`} className="flex items-center gap-3 rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] px-4 py-3">
                              <FileText className="h-5 w-5 flex-shrink-0 text-blue-600" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-medium text-[#030213]">{f.name}</p>
                                <p className="text-[11px] text-[#717182]">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                              {!isSubmitting && (
                                <button onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="text-[#717182] hover:text-red-500">
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <textarea value={pastedText} onChange={(e) => setPastedText(e.target.value)}
                        placeholder={"Paste the full conversation here. Include both your messages and the AI's responses.\n\nExample:\nYou: Can you help me with my project?\nAssistant: Sure! Let's start by..."}
                        disabled={isSubmitting} rows={10}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                      <p className="mt-2 text-[11px] text-[#717182]">
                        {pastedText.length > 0 ? `${pastedText.length.toLocaleString()} characters` : "Minimum 20 characters"}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Consent checkboxes */}
              <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
                <CardContent className="p-6 space-y-3">
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors text-left">
                    <input
                      type="checkbox"
                      checked={allowDataUse}
                      onChange={(e) => setAllowDataUse(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300"
                    />
                    <div>
                      <p className="text-[13px] font-medium text-[#030213]">
                        Allow anonymized data use{" "}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700">
                          200 MB uploads
                        </span>
                      </p>
                      <p className="text-[11px] text-[#717182] mt-0.5">
                        Your data will be anonymized and used to improve evaluation accuracy.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-left ${
                      retentionConsent
                        ? "border-blue-300 bg-blue-50"
                        : "border-amber-300 bg-amber-50 hover:bg-amber-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={retentionConsent}
                      onChange={(e) => setRetentionConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300"
                    />
                    <div>
                      <p className="text-[13px] font-medium text-[#030213]">
                        Data retention acknowledgment{" "}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700">
                          Required
                        </span>
                      </p>
                      <p className="text-[11px] text-[#717182] mt-0.5">
                        I understand my uploaded files will be automatically deleted 72 hours after
                        evaluation completes. Only structured extracts and excerpts will be retained.
                      </p>
                    </div>
                  </label>
                </CardContent>
              </Card>
            </>
          )}

          {/* Error */}
          {step === "error" && errorMsg && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <div>
                <p className="text-[14px] font-medium text-red-900">Upload failed</p>
                <p className="mt-0.5 text-[13px] text-red-700">{errorMsg}</p>
                <Button onClick={() => { setStep("form"); setErrorMsg(""); }} variant="outline" size="sm" className="mt-3">
                  Try again
                </Button>
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
                    {progress < 40 && "Preparing upload..."}
                    {progress >= 40 && progress < 70 && "Uploading your files..."}
                    {progress >= 70 && "Submitting for analysis..."}
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
                  <p className="text-[13px] text-green-700">Taking you to processing...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit button */}
          {step === "form" && (
            <>
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
                    Analyze my conversations
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <p className="mt-4 text-center text-[11px] text-[#717182]">
                Your uploaded files are automatically deleted 72 hours after evaluation completes.
                Only structured analysis results are retained.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
