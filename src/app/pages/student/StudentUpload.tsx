import { Upload, FileText, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useDirectUpload } from "../../../hooks/useApi";
import { useAuthStore } from "../../../stores/authStore";

export default function StudentUpload() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const authed = isAuthenticated();
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useDirectUpload();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setUploadError(null);
    }
  };

  const handleUpload = () => {
    if (!file) {
      // Open file picker if no file selected yet
      fileInputRef.current?.click();
      return;
    }

    setUploadError(null);
    uploadMutation.mutate(
      { files: [file] },
      {
        onSuccess: (result: any) => {
          const id: string =
            result?.assessment_id ??
            result?.assessmentId ??
            result?.id ??
            null;
          if (id) {
            navigate(`/student/analyze?id=${id}`);
          } else {
            // No id from server — navigate anyway so polling can discover it
            navigate("/student/analyze");
          }
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

  const uploading = uploadMutation.isPending;

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <h1 className="mb-4 text-4xl tracking-tight">Sign in to upload</h1>
          <p className="mb-8 text-xl text-[#717182]">
            Upload your conversations. We analyze them securely on our servers.
          </p>
          <Link to="/sign-in?next=/student/upload">
            <Button size="lg" className="min-w-[220px] text-lg">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-4xl tracking-tight">
            How do you work with AI?
          </h1>
          <p className="text-xl text-[#717182]">
            Upload your conversations. We analyze them securely on our servers.
          </p>
        </div>

        {/* Upload Card */}
        <Card className="border-2 border-dashed border-[rgba(0,0,0,0.12)] bg-white p-12 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F5F5F7]">
              <Upload className="h-10 w-10 text-[#717182]" />
            </div>
          </div>

          <h2 className="mb-3 text-xl">Upload AI Conversations</h2>
          <p className="mb-6 text-[15px] text-[#717182]">
            ChatGPT exports, Claude conversations, or any AI chat logs
          </p>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt,.md,.markdown"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* File selected indicator */}
          {file && (
            <div className="mb-4 flex items-center justify-center gap-2 text-[14px] text-[#030213]">
              <FileText className="h-4 w-4 text-[#717182]" />
              <span>{file.name}</span>
              <button
                className="ml-1 text-[#717182] hover:text-[#030213]"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Error message */}
          {uploadError && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <div className="mb-6">
            <Button
              size="lg"
              className="w-full max-w-xs"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                  Uploading...
                </>
              ) : file ? (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Analyze My Work Style
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Choose Files
                </>
              )}
            </Button>
          </div>

          <div className="text-[13px] text-[#717182]">
            Supports: JSON, TXT, Markdown • Max 50 conversations
          </div>
        </Card>

        {/* What You'll Get */}
        <div className="mt-8 rounded-md border border-[rgba(0,0,0,0.08)] bg-white p-6">
          <div className="mb-3 text-[13px] uppercase tracking-wider text-[#717182]">
            What You'll Get
          </div>
          <ul className="space-y-2 text-[15px]">
            <li className="flex items-center gap-2">
              <span className="text-[#717182]">→</span>
              <span>Your AI work style profile</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#717182]">→</span>
              <span>Strengths and gaps analysis</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#717182]">→</span>
              <span>Shareable score card</span>
            </li>
          </ul>
        </div>

        {/* Privacy */}
        <div className="mt-6 text-center text-[13px] text-[#717182]">
          Your conversations are processed securely and never shared.
        </div>
      </div>
    </div>
  );
}
