import { useState } from "react";
import { ArrowLeft, FileText, Loader2, Upload as UploadIcon, X } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { apiPost, apiFetch } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";

type Stage = "idle" | "uploading" | "submitting" | "done";

export default function Upload() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);

  const addFiles = (nextFiles: File[]) => {
    setFiles((current) => [...current, ...nextFiles]);
    setError(null);
  };

  const uploadOne = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "txt";
    const presign = await apiPost<any>("/uploads/presign", {
      file_name: file.name,
      file_type: ext,
      file_size_bytes: file.size,
    });

    const token = useAuthStore.getState().token;
    const apiHost = import.meta.env.VITE_API_URL || "";
    const apiBase = apiHost ? `${apiHost.replace(/\/$/, "")}/api/v1` : "/api/v1";

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", `${apiBase}/uploads/${presign.upload_id}/file`);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed (${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      const body = new FormData();
      body.append("file", file);
      xhr.send(body);
    });

    return apiPost<{ assessment_id: string }>("/uploads/complete", { upload_id: presign.upload_id });
  };

  const submit = async () => {
    if (files.length === 0) return;
    setError(null);
    setStage("uploading");
    try {
      let fileToUpload = files[0];
      if (files.length > 1) {
        const merged = await Promise.all(files.map(async (file) => `\n\n--- ${file.name} ---\n\n${await file.text()}`));
        fileToUpload = new File([merged.join("")], `merged-${files.length}-conversations.txt`, { type: "text/plain" });
      }
      const result = await uploadOne(fileToUpload);
      setStage("done");
      toast.success("Upload submitted");
      navigate(`/app/assessment/${result.assessment_id}/processing`);
    } catch (err: any) {
      setStage("idle");
      setError(err?.message ?? "Upload failed");
    }
  };

  const busy = stage === "uploading" || stage === "submitting";

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-8">
          <Link to="/app/upload" className="inline-flex items-center gap-2 text-[13px] text-[#5C5C5C] hover:text-[#161616]">
            <ArrowLeft className="h-4 w-4" />
            Back to pool
          </Link>
          <div className="mt-5">
            <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Upload</div>
            <h1 className="mt-2 text-3xl tracking-tight">Add conversation exports.</h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#5C5C5C]">
              Pick files, watch the progress bar move, submit, and go straight to processing with the new assessment.
            </p>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#D8D2C4] bg-[#FBF8F1] px-6 py-12 text-center transition-colors hover:bg-[#F3EEE2]">
              <UploadIcon className="mb-3 h-8 w-8 text-[#315D8A]" />
              <div className="text-[16px]">Drop files here or choose them manually</div>
              <div className="mt-1 text-[13px] text-[#5C5C5C]">TXT, JSON, Markdown, ZIP, JSONL</div>
              <input
                type="file"
                multiple
                accept=".txt,.json,.md,.zip,.jsonl,.pdf"
                className="hidden"
                onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
              />
            </label>

            {files.length > 0 ? (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-md border border-[#D8D2C4] bg-[#FBF8F1] px-4 py-3">
                    <FileText className="h-4 w-4 text-[#315D8A]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px]">{file.name}</div>
                      <div className="text-[12px] text-[#6B6B66]">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    {!busy ? (
                      <button onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}>
                        <X className="h-4 w-4 text-[#6B6B66]" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {busy ? (
              <div className="mt-5">
                <div className="mb-2 text-[13px] text-[#5C5C5C]">
                  {stage === "uploading" ? "Uploading file..." : "Submitting assessment..."}
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-md border border-[#E4B7B2] bg-[#FBEDEC] px-4 py-3 text-[13px] text-[#8E3B34]">
                {error}
              </div>
            ) : null}

            <div className="mt-5 flex justify-end">
              <Button size="lg" onClick={submit} disabled={files.length === 0 || busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Analyze conversations
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
