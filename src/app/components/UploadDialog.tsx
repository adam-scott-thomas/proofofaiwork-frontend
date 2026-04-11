import { useCallback, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
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
import { useDirectUpload } from "../../hooks/useApi";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const qc = useQueryClient();
  const uploadMutation = useDirectUpload();

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
        file => file.name.endsWith('.json') || file.name.endsWith('.txt') || file.name.endsWith('.md')
      );
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (files.length === 0) {
      toast.error("No files selected");
      return;
    }

    uploadMutation.mutate(
      { files },
      {
        onSuccess: () => {
          toast.success(
            `Successfully uploaded ${files.length} file${files.length > 1 ? "s" : ""}`,
          );
          qc.invalidateQueries({ queryKey: ["pool"] });
          qc.invalidateQueries({ queryKey: ["conversations"] });
          setFiles([]);
          onOpenChange(false);
        },
        onError: (err: any) => {
          const message =
            err?.message ?? "Upload failed. Please try again.";
          toast.error(message);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
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
            <p className="mb-4 text-[13px] text-[#717182]">
              or
            </p>
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
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </div>
              {files.map((file, index) => (
                <Card key={index} className="flex items-center justify-between border border-[rgba(0,0,0,0.08)] bg-white p-3">
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
                    disabled={uploadMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploadMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploadMutation.isPending || files.length === 0}>
            {uploadMutation.isPending ? "Uploading..." : `Upload ${files.length > 0 ? `(${files.length})` : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
