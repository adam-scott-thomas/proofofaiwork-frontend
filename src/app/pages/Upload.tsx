import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router";
import {
  ArrowLeft,
  Upload as UploadIcon,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { usePresignUpload, useCompleteUpload } from "../../hooks/useApi";
import { apiFetch } from "../../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Progress } from "../components/ui/progress";

const ALLOWED_EXTENSIONS = ["txt", "json", "pdf", "md", "zip", "jsonl"] as const;
type AllowedExt = (typeof ALLOWED_EXTENSIONS)[number];

const MAX_FILE_SIZE_DEFAULT = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_SIZE_DATA_SHARE = 200 * 1024 * 1024; // 200 MB

interface ParseDetail {
  found: number;
  parsed: number;
  elapsed: number;
  apiStatus: string;
}

interface UploadFileState {
  file: File;
  status: "pending" | "uploading" | "completing" | "ready" | "error";
  progress: number;
  uploadId?: string;
  presignedUrl?: string;
  parseDetail?: ParseDetail;
  error?: string;
}

export default function Upload() {
  const navigate = useNavigate();
  const [uploadState, setUploadState] = useState<UploadFileState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [allowDataUse, setAllowDataUse] = useState(false);
  const [retentionConsent, setRetentionConsent] = useState(false);

  const maxFileSize = allowDataUse ? MAX_FILE_SIZE_DATA_SHARE : MAX_FILE_SIZE_DEFAULT;
  const maxFileSizeLabel = allowDataUse ? "200 MB" : "10 MB";

  const presignMutation = usePresignUpload();
  const completeMutation = useCompleteUpload();

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${maxFileSizeLabel} limit (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      };
    }
    if (file.size === 0) {
      return { valid: false, error: "File is empty" };
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext as AllowedExt)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
      };
    }
    return { valid: true };
  };

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!retentionConsent) {
        setUploadState({
          file,
          status: "error",
          progress: 0,
          error: "Please acknowledge the data retention policy before uploading.",
        });
        return;
      }

      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadState({ file, status: "error", progress: 0, error: validation.error });
        return;
      }

      setUploadState({ file, status: "pending", progress: 0 });

      try {
        // Step 1: Get presigned URL
        const ext = file.name.split(".").pop()?.toLowerCase() as AllowedExt;
        const presignResponse = await presignMutation.mutateAsync({
          file_name: file.name,
          file_type: ext,
          file_size_bytes: file.size,
          allow_data_use: allowDataUse,
        });

        setUploadState((prev) => ({
          ...prev!,
          uploadId: presignResponse.upload_id,
          presignedUrl: presignResponse.presigned_url,
          status: "uploading",
        }));

        // Step 2: Upload to S3 via presigned URL
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presignResponse.presigned_url);
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setUploadState((prev) => ({ ...prev!, progress: pct }));
            }
          };
          xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.send(file);
        });

        setUploadState((prev) => ({ ...prev!, status: "completing", progress: 100 }));

        // Step 3: Complete upload (triggers parsing)
        await completeMutation.mutateAsync({ upload_id: presignResponse.upload_id });

        const uploadIdStr = String(presignResponse.upload_id);
        const parseStart = Date.now();
        const maxPollMs = 10 * 60 * 1000;
        let parseComplete = false;

        // Step 4: Poll parse status
        for (let i = 0; i < 600; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          try {
            const status = await apiFetch<{
              status: string;
              conversations_found: number;
              conversations_parsed: number;
            }>(`/uploads/parse-status/${uploadIdStr}`);

            const elapsed = Math.round((Date.now() - parseStart) / 1000);
            const found = status.conversations_found || 0;
            const parsed = status.conversations_parsed || 0;
            const pct = found > 0 ? Math.round((parsed / found) * 100) : 0;

            setUploadState((prev) => ({
              ...prev!,
              status: "completing",
              progress: pct,
              parseDetail: { found, parsed, elapsed, apiStatus: status.status },
            }));

            if (status.status === "complete") {
              parseComplete = true;
              setUploadState((prev) => ({ ...prev!, status: "ready", progress: 100 }));
              break;
            }
            if (status.status === "failed") {
              throw new Error("Parsing failed. Please try again.");
            }
          } catch (e) {
            if (e instanceof Error && e.message.includes("Parsing failed")) throw e;
          }

          if (Date.now() - parseStart > maxPollMs) break;
        }

        if (!parseComplete) {
          setUploadState((prev) => ({ ...prev!, status: "ready" }));
        }

        setTimeout(() => navigate("/upload"), 1500);
      } catch (error) {
        setUploadState((prev) => ({
          ...prev!,
          status: "error",
          error:
            error instanceof Error ? error.message : "Upload failed. Please try again.",
        }));
      }
    },
    [presignMutation, completeMutation, navigate, retentionConsent, allowDataUse, maxFileSize]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const isUploading =
    uploadState?.status === "pending" ||
    uploadState?.status === "uploading" ||
    uploadState?.status === "completing";

  const progressLabel = (() => {
    if (!uploadState) return "";
    if (uploadState.status === "pending") return "Preparing upload...";
    if (uploadState.status === "uploading") return `Uploading... ${uploadState.progress}%`;
    if (uploadState.status === "completing") {
      const d = uploadState.parseDetail;
      if (!d || (d.found === 0 && d.elapsed < 3)) return "Detecting format...";
      if (d.found === 0) return "Extracting conversations...";
      return `Parsing conversations... ${d.parsed} / ${d.found}`;
    }
    return "";
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3">Upload Your AI Work</h1>
            <p className="text-xl text-muted-foreground">
              Upload a file to get started with AI assessment
            </p>
          </div>

          {/* Upload Area */}
          {!uploadState && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`bg-white rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                  <UploadIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Drop your file here</h2>
                <p className="text-muted-foreground mb-6">or click to browse from your computer</p>

                <label className={retentionConsent ? "cursor-pointer" : "cursor-not-allowed opacity-50"}>
                  <span className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors">
                    <UploadIcon className="w-5 h-5" />
                    Choose File
                  </span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".txt,.json,.pdf,.md,.zip,.jsonl"
                    disabled={!retentionConsent}
                    className="hidden"
                  />
                </label>

                <div className="mt-8 pt-8 border-t border-gray-200 w-full space-y-3">
                  <p className="text-sm text-gray-500">
                    <strong>Supported formats:</strong> JSON, JSONL, ZIP, TXT, PDF, MD
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>Maximum file size:</strong> {maxFileSizeLabel}
                  </p>

                  {/* Data sharing opt-in */}
                  <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors text-left">
                    <input
                      type="checkbox"
                      checked={allowDataUse}
                      onChange={(e) => setAllowDataUse(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Allow anonymized data use{" "}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          200 MB uploads
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your data will be anonymized and used to improve evaluation accuracy.
                        In exchange, your upload limit increases from 10 MB to 200 MB.
                      </p>
                    </div>
                  </label>

                  {/* Retention consent — required */}
                  <label
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors text-left ${
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
                      <p className="text-sm font-medium text-foreground">
                        Data retention acknowledgment{" "}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          Required
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        I understand my uploaded files will be automatically deleted 72 hours after
                        evaluation completes. Only structured extracts and excerpts will be retained.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploadState && (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <FileText className="w-12 h-12 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-1 truncate">
                      {uploadState.file.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {(uploadState.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>

                    {uploadState.status === "error" && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-destructive mb-2">
                          <AlertCircle className="w-5 h-5" />
                          <span className="font-semibold">Upload failed</span>
                        </div>
                        <p className="text-sm text-destructive">{uploadState.error}</p>
                      </div>
                    )}

                    {uploadState.status === "ready" && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-semibold">Conversations parsed!</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Taking you to your upload pool...
                        </p>
                      </div>
                    )}

                    {isUploading && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="font-semibold">{progressLabel}</span>
                        </div>
                        {uploadState.status === "completing" && uploadState.parseDetail && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {(() => {
                              const s = uploadState.parseDetail.elapsed;
                              const min = Math.floor(s / 60);
                              const sec = s % 60;
                              return min > 0 ? `${min}m ${sec}s elapsed` : `${sec}s elapsed`;
                            })()}
                          </p>
                        )}
                        {(uploadState.status === "uploading" ||
                          (uploadState.status === "completing" &&
                            uploadState.parseDetail &&
                            uploadState.parseDetail.found > 0)) && (
                          <Progress value={uploadState.progress} className="h-2" />
                        )}
                      </div>
                    )}

                    {uploadState.status === "error" && (
                      <Button
                        onClick={() => setUploadState(null)}
                        variant="default"
                        size="sm"
                      >
                        Try Again
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-2">What happens next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Your file will be securely uploaded and analyzed for AI authenticity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  You'll receive detailed assessment results with confidence scores
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  You can then create a public proof page to share your verified work
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
