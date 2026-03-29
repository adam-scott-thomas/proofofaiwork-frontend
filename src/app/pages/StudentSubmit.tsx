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
import { usePresignUpload } from "../../hooks/useApi";
import { apiPost } from "../../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";

const CONVO_EXTENSIONS = ["txt", "json", "zip", "jsonl", "md"] as const;
const DELIVERABLE_EXTENSIONS = ["txt", "pdf", "docx", "doc", "md", "py", "js", "ts", "jsx", "tsx", "html", "css", "java", "c", "cpp", "zip"] as const;
type ConvoExt = (typeof CONVO_EXTENSIONS)[number];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type SubmitStep = "form" | "uploading" | "creating" | "done" | "error";
type InputMode = "file" | "paste";

export default function StudentSubmit() {
  const navigate = useNavigate();

  // Conversation input
  const [convoFiles, setConvoFiles] = useState<File[]>([]);
  const [convoPastedText, setConvoPastedText] = useState("");
  const [convoMode, setConvoMode] = useState<InputMode>("file");

  // Deliverable input (what they turned in)
  const [deliverableFiles, setDeliverableFiles] = useState<File[]>([]);
  const [deliverablePastedText, setDeliverablePastedText] = useState("");
  const [deliverableMode, setDeliverableMode] = useState<InputMode>("file");

  // Assignment context
  const [className, setClassName] = useState("");
  const [assignmentName, setAssignmentName] = useState("");
  const [aiTools, setAiTools] = useState("");
  const [description, setDescription] = useState("");

  // Upload state
  const [step, setStep] = useState<SubmitStep>("form");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [convoIsDragging, setConvoIsDragging] = useState(false);
  const [delivIsDragging, setDelivIsDragging] = useState(false);

  const presignMutation = usePresignUpload();

  const validateFile = (f: File, allowedExts: readonly string[]): string | null => {
    if (f.size > MAX_FILE_SIZE) return `${f.name} is too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`;
    if (f.size === 0) return `${f.name} is empty.`;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExts.includes(ext))
      return `${f.name}: unsupported file type.`;
    return null;
  };

  const addConvoFiles = (newFiles: File[]) => {
    for (const f of newFiles) {
      const err = validateFile(f, CONVO_EXTENSIONS);
      if (err) { setErrorMsg(err); setStep("error"); return; }
    }
    setConvoFiles((prev) => [...prev, ...newFiles]);
    setErrorMsg(""); setStep("form");
  };

  const addDeliverableFiles = (newFiles: File[]) => {
    for (const f of newFiles) {
      const err = validateFile(f, DELIVERABLE_EXTENSIONS);
      if (err) { setErrorMsg(err); setStep("error"); return; }
    }
    setDeliverableFiles((prev) => [...prev, ...newFiles]);
    setErrorMsg(""); setStep("form");
  };

  const hasConvo = convoMode === "file" ? convoFiles.length > 0 : convoPastedText.trim().length > 20;

  const uploadFileToServer = async (presignedUrl: string, file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", presignedUrl);
      const token = localStorage.getItem("poaw-token");
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
      xhr.onerror = () => reject(new Error("Network error during upload"));
      const formData = new FormData();
      formData.append("file", file);
      xhr.send(formData);
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!hasConvo || !assignmentName.trim()) return;

    const hasDeliverable = deliverableMode === "file" ? deliverableFiles.length > 0 : deliverablePastedText.trim().length > 20;

    setStep("uploading");
    setProgress(0);

    try {
      // Build conversation file
      let convoFile: File;
      if (convoMode === "paste") {
        const blob = new Blob([convoPastedText], { type: "text/plain" });
        convoFile = new File([blob], "pasted-conversation.txt", { type: "text/plain" });
      } else {
        convoFile = convoFiles[0]; // Use first conversation file
      }

      // Upload deliverable files (just store, no complete)
      const delivIds: string[] = [];
      if (hasDeliverable) {
        let delivFiles: File[];
        if (deliverableMode === "paste") {
          const blob = new Blob([deliverablePastedText], { type: "text/plain" });
          delivFiles = [new File([blob], "final-deliverable.txt", { type: "text/plain" })];
        } else {
          delivFiles = deliverableFiles;
        }
        for (const df of delivFiles) {
          const ext = df.name.split(".").pop()?.toLowerCase() || "txt";
          const presign = await presignMutation.mutateAsync({
            file_name: df.name, file_type: ext, file_size_bytes: df.size, allow_data_use: false,
          });
          await uploadFileToServer(presign.presigned_url, df);
          delivIds.push(String(presign.upload_id));
          setProgress((p) => Math.min(p + 15, 40));
        }
      }

      setProgress(45);

      // Upload conversation file
      const ext = convoFile.name.split(".").pop()?.toLowerCase() || "txt";
      const presign = await presignMutation.mutateAsync({
        file_name: convoFile.name, file_type: ext, file_size_bytes: convoFile.size, allow_data_use: false,
      });
      await uploadFileToServer(presign.presigned_url, convoFile);
      setProgress(70);

      // Build task_context with all assignment info
      const taskContext = [
        className.trim() && `Class: ${className.trim()}`,
        `Assignment: ${assignmentName.trim()}`,
        aiTools.trim() && `AI tools used: ${aiTools.trim()}`,
        description.trim() && `Description: ${description.trim()}`,
        delivIds.length > 0 && `[DELIVERABLE_UPLOAD_IDS: ${delivIds.join(",")}]`,
      ].filter(Boolean).join("\n");

      // Complete — creates assessment, dispatches parse+evaluate in worker
      const complete = await apiPost<{ upload_id: string; assessment_id: string; status: string }>(
        "/uploads/complete",
        { upload_id: presign.upload_id, task_context: taskContext }
      );

      setProgress(100);
      setStep("done");

      setTimeout(() => navigate(`/student/processing/${complete.assessment_id}`), 800);

    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      setStep("error");
    }
  }, [convoFiles, convoPastedText, convoMode, deliverableFiles, deliverablePastedText, deliverableMode, className, assignmentName, aiTools, description, hasConvo, presignMutation, navigate]);

  const isSubmitting = step === "uploading" || step === "creating";
  const canSubmit = hasConvo && assignmentName.trim() && !isSubmitting;

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

      {/* Section 1: AI Conversation */}
      <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[12px] font-bold text-blue-600">1</div>
            <h2 className="text-[15px] font-medium text-[#030213]">Your AI conversation</h2>
            <span className="text-[12px] text-red-500">*</span>
          </div>
          <p className="mb-4 text-[12px] text-[#717182]">The chat log between you and the AI — this is what we analyze</p>

          <div className="mb-4 flex gap-2">
            <button onClick={() => setConvoMode("file")} disabled={isSubmitting}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${convoMode === "file" ? "bg-[#030213] text-white" : "bg-[#F5F5F7] text-[#717182] hover:bg-[#EAEAED]"}`}>
              <UploadIcon className="h-3.5 w-3.5" /> Upload files
            </button>
            <button onClick={() => setConvoMode("paste")} disabled={isSubmitting}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${convoMode === "paste" ? "bg-[#030213] text-white" : "bg-[#F5F5F7] text-[#717182] hover:bg-[#EAEAED]"}`}>
              <Type className="h-3.5 w-3.5" /> Paste text
            </button>
          </div>

          {convoMode === "file" ? (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setConvoIsDragging(true); }}
                onDragLeave={() => setConvoIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setConvoIsDragging(false); const d = Array.from(e.dataTransfer.files); if (d.length) addConvoFiles(d); }}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${convoIsDragging ? "border-blue-400 bg-blue-50" : "border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.2)]"}`}
              >
                <UploadIcon className="mx-auto mb-2 h-6 w-6 text-[#717182]" />
                <p className="mb-1 text-[13px] text-[#030213]">Drop conversation exports here</p>
                <p className="mb-3 text-[11px] text-[#717182]">JSON, JSONL, ZIP, or TXT — multiple files OK</p>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 rounded-md bg-[#030213] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#1a1a2e]">
                    <UploadIcon className="h-3.5 w-3.5" /> Choose files
                  </span>
                  <input type="file" accept=".txt,.json,.zip,.jsonl,.md" multiple
                    onChange={(e) => { const s = Array.from(e.target.files ?? []); if (s.length) addConvoFiles(s); e.target.value = ""; }} className="hidden" />
                </label>
              </div>
              {convoFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {convoFiles.map((f, i) => (
                    <div key={`c-${f.name}-${i}`} className="flex items-center gap-3 rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] px-4 py-3">
                      <FileText className="h-5 w-5 flex-shrink-0 text-blue-600" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-[#030213]">{f.name}</p>
                        <p className="text-[11px] text-[#717182]">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      {!isSubmitting && (
                        <button onClick={() => setConvoFiles((p) => p.filter((_, j) => j !== i))} className="text-[#717182] hover:text-red-500">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[11px] text-[#717182]">
                How to export: <strong>ChatGPT</strong> → Settings → Data controls → Export data.{" "}
                <strong>Claude</strong> → Settings → Export conversations.
              </p>
            </>
          ) : (
            <>
              <textarea value={convoPastedText} onChange={(e) => setConvoPastedText(e.target.value)}
                placeholder={"Paste the full conversation here. Include both your messages and the AI's responses.\n\nExample:\nYou: Can you help me outline my research paper?\nAI: Sure! Let's start by identifying your thesis..."}
                disabled={isSubmitting} rows={10}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              <p className="mt-2 text-[11px] text-[#717182]">
                {convoPastedText.length > 0 ? `${convoPastedText.length.toLocaleString()} characters` : "Minimum 20 characters"}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Final Deliverable */}
      <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-[12px] font-bold text-purple-600">2</div>
            <h2 className="text-[15px] font-medium text-[#030213]">What will be turned in</h2>
            <span className="text-[12px] text-[#717182]">optional</span>
          </div>
          <p className="mb-4 text-[12px] text-[#717182]">Your final paper, code, or deliverable — so we can compare it against the AI conversation and measure your contribution</p>

          <div className="mb-4 flex gap-2">
            <button onClick={() => setDeliverableMode("file")} disabled={isSubmitting}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${deliverableMode === "file" ? "bg-[#030213] text-white" : "bg-[#F5F5F7] text-[#717182] hover:bg-[#EAEAED]"}`}>
              <UploadIcon className="h-3.5 w-3.5" /> Upload files
            </button>
            <button onClick={() => setDeliverableMode("paste")} disabled={isSubmitting}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${deliverableMode === "paste" ? "bg-[#030213] text-white" : "bg-[#F5F5F7] text-[#717182] hover:bg-[#EAEAED]"}`}>
              <Type className="h-3.5 w-3.5" /> Paste text
            </button>
          </div>

          {deliverableMode === "file" ? (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDelivIsDragging(true); }}
                onDragLeave={() => setDelivIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDelivIsDragging(false); const d = Array.from(e.dataTransfer.files); if (d.length) addDeliverableFiles(d); }}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${delivIsDragging ? "border-purple-400 bg-purple-50" : "border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.2)]"}`}
              >
                <FileText className="mx-auto mb-2 h-6 w-6 text-[#717182]" />
                <p className="mb-1 text-[13px] text-[#030213]">Drop your final work here</p>
                <p className="mb-3 text-[11px] text-[#717182]">PDF, DOCX, TXT, code files, or ZIP</p>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 rounded-md bg-[#030213] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#1a1a2e]">
                    <UploadIcon className="h-3.5 w-3.5" /> Choose files
                  </span>
                  <input type="file" accept=".txt,.pdf,.docx,.doc,.md,.py,.js,.ts,.jsx,.tsx,.html,.css,.java,.c,.cpp,.zip" multiple
                    onChange={(e) => { const s = Array.from(e.target.files ?? []); if (s.length) addDeliverableFiles(s); e.target.value = ""; }} className="hidden" />
                </label>
              </div>
              {deliverableFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {deliverableFiles.map((f, i) => (
                    <div key={`d-${f.name}-${i}`} className="flex items-center gap-3 rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] px-4 py-3">
                      <FileText className="h-5 w-5 flex-shrink-0 text-purple-600" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-[#030213]">{f.name}</p>
                        <p className="text-[11px] text-[#717182]">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      {!isSubmitting && (
                        <button onClick={() => setDeliverableFiles((p) => p.filter((_, j) => j !== i))} className="text-[#717182] hover:text-red-500">
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
              <textarea value={deliverablePastedText} onChange={(e) => setDeliverablePastedText(e.target.value)}
                placeholder="Paste your final paper, essay, code, or whatever you submitted for the assignment."
                disabled={isSubmitting} rows={8}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              <p className="mt-2 text-[11px] text-[#717182]">
                {deliverablePastedText.length > 0 ? `${deliverablePastedText.length.toLocaleString()} characters` : "Paste the text of your final submission"}
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
                {step === "uploading" && progress < 70 && "Uploading your files..."}
                {step === "uploading" && progress >= 70 && "Submitting for analysis..."}
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
