import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { Upload, FileText, X, Loader2, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Card } from "./ui/card";
import { toast } from "sonner";
import { apiPost } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(
        (file) =>
          file.name.endsWith(".json") ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".md"),
      );
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("No files selected");
      return;
    }

    setUploading(true);
    setError(null);
    setProgress({ done: 0, total: files.length });

    const apiHost = import.meta.env.VITE_API_URL || "";
    const apiBase = apiHost ? `${apiHost.replace(/\/$/, "")}/api/v1` : "/api/v1";
    const token = useAuthStore.getState().token;
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    let lastAssessmentId: string | null = null;
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Step 1: Presign
        const ext = (file.name.includes(".") ? file.name.split(".").pop()! : "txt").toLowerCase();
        const presign = await apiPost<any>("/uploads/presign", {
          file_name: file.name,
          file_type: ext,
          file_size_bytes: file.size,
        });
        const uploadId = presign.upload_id;

        // Step 2: PUT file
        const formData = new FormData();
        formData.append("file", file);
        const putResp = await fetch(`${apiBase}/uploads/${uploadId}/file`, {
          method: "PUT",
          headers: { ...authHeader },
          body: formData,
        });
        if (!putResp.ok) {
          const err = await putResp.json().catch(() => ({ detail: putResp.statusText }));
          throw new Error(err.detail || `Upload failed for ${file.name}`);
        }

        // Step 3: Complete
        const result = await apiPost<any>("/uploads/complete", { upload_id: uploadId });
        lastAssessmentId = result?.assessment_id ?? null;
        successCount++;
        setProgress({ done: i + 1, total: files.length });
      } catch (err: any) {
        console.error(`Failed to upload ${file.name}:`, err);
        // Continue with remaining files
      }
    }

    setUploading(false);
    qc.invalidateQueries({ queryKey: ["pool"] });
    qc.invalidateQueries({ queryKey: ["conversations"] });
    qc.invalidateQueries({ queryKey: ["uploads"] });

    if (successCount === 0) {
      setError("All uploads failed. Check file formats and try again.");
      return;
    }

    setFiles([]);
    onOpenChange(false);

    if (files.length === 1 && lastAssessmentId) {
      navigate(`/app/assessment/${lastAssessmentId}/processing`);
    } else {
      toast.success(`Uploaded ${successCount}/${files.length} files`);
      // Stay on upload pool so they can see all the uploads being processed
    }
  };

  return (
    <Dialog open={open} onOpenChange={uploading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Conversations
          </DialogTitle>
          <DialogDescription>
            Upload conversation exports from Claude, ChatGPT, or other AI platforms
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Error message */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Progress during upload */}
          {uploading && (
            <div className="mb-4 flex items-center gap-3 rounded-md bg-blue-50 border border-blue-200 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
              <div className="text-[13px] text-blue-700">
                Uploading {progress.done}/{progress.total} files...
              </div>
            </div>
          )}

          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragActive
                ? "border-[#6B46C1] bg-[#F3F0FF]"
                : "border-[rgba(0,0,0,0.15)] bg-[#FAFAFA]"
            }`}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              accept=".json,.txt,.md"
              onChange={handleFileInput}
              className="hidden"
            />
            <Upload className="mx-auto mb-3 h-10 w-10 text-[#717182]" />
            <p className="mb-1 text-[14px]">
              Drag and drop your conversation files here
            </p>
            <p className="mb-4 text-[13px] text-[#717182]">or</p>
            <label htmlFor="file-upload">
              <Button variant="outline" size="sm" asChild>
                <span>Browse Files</span>
              </Button>
            </label>
            <p className="mt-4 text-[12px] text-[#717182]">
              Supports JSON, TXT, and MD formats
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-[13px] text-[#717182]">
                {files.length} file{files.length > 1 ? "s" : ""} selected
              </div>
              <div className="max-h-[30vh] overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <Card
                    key={index}
                    className="flex items-center justify-between border border-[rgba(0,0,0,0.08)] bg-white p-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-[#717182]" />
                      <div>
                        <div className="text-[13px]">{file.name}</div>
                        <div className="text-[12px] text-[#717182]">
                          {(file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading || files.length === 0}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                {progress.done}/{progress.total}
              </>
            ) : (
              `Upload${files.length > 0 ? ` (${files.length})` : ""}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
