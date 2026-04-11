import { useRef, useState, forwardRef } from "react";
import { Share2, Download, Link as LinkIcon } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    name: string;
    handle: string;
    hlsScore: number;
    aelScore: number;
    caiScore: number;
    proofUrl: string;
    projectName?: string;
    conversationCount?: number;
    date?: string;
  };
}

export function ShareDialog({ open, onOpenChange, data }: ShareDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<"triple" | "single" | "cert">("triple");
  const [downloading, setDownloading] = useState(false);
  const tripleRef = useRef<HTMLDivElement>(null);
  const singleRef = useRef<HTMLDivElement>(null);
  const certRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    const cardRef = 
      selectedTemplate === "triple" ? tripleRef :
      selectedTemplate === "single" ? singleRef :
      certRef;
    
    if (!cardRef.current) return;
    
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#FAFAFA",
        logging: false,
      });
      
      const link = document.createElement("a");
      link.download = `poaw-${data.handle.replace('@', '')}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success("Artifact downloaded!");
    } catch (error) {
      toast.error("Failed to download artifact");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(data.proofUrl);
    toast.success("Link copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Proof of AI Work
          </DialogTitle>
          <DialogDescription>
            Choose a template to share your proof of AI work.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="triple">Triple Score</TabsTrigger>
            <TabsTrigger value="single">Score Focus</TabsTrigger>
            <TabsTrigger value="cert">Certificate</TabsTrigger>
          </TabsList>

          <TabsContent value="triple" className="space-y-4">
            <div className="flex justify-center overflow-x-auto rounded-lg border border-[rgba(0,0,0,0.08)] bg-white p-4">
              <TripleScoreCard ref={tripleRef} data={data} />
            </div>
          </TabsContent>

          <TabsContent value="single" className="space-y-4">
            <div className="flex justify-center overflow-x-auto rounded-lg border border-[rgba(0,0,0,0.08)] bg-white p-4">
              <SingleScoreCard ref={singleRef} data={data} />
            </div>
          </TabsContent>

          <TabsContent value="cert" className="space-y-4">
            <div className="flex justify-center overflow-x-auto rounded-lg border border-[rgba(0,0,0,0.08)] bg-white p-4">
              <CertificateCard ref={certRef} data={data} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between gap-2 border-t border-[rgba(0,0,0,0.08)] pt-4">
          <Button variant="outline" onClick={handleCopyLink}>
            <LinkIcon className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleDownload} disabled={downloading}>
              <Download className="mr-2 h-4 w-4" />
              {downloading ? "Downloading..." : "Download Image"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Triple Score Card - Shows all three signature scores
const TripleScoreCard = forwardRef<HTMLDivElement, { data: ShareDialogProps["data"] }>(({ data }, ref) => {
  return (
    <div
      ref={ref}
      className="relative w-full max-w-[720px] overflow-hidden rounded-lg border border-[rgba(0,0,0,0.08)] bg-gradient-to-br from-white to-[#FAFAFA] p-8"
      style={{ aspectRatio: "16/9" }}
    >
      {/* Watermark Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ 
        backgroundImage: "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)",
        backgroundSize: "10px 10px"
      }} />

      {/* Header */}
      <div className="relative mb-6">
        <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#717182]">
          PROOF OF AI WORK
        </div>
        <h2 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
          {data.name}
        </h2>
        <div className="mt-1 font-mono text-[12px] text-[#717182]">{data.handle}</div>
      </div>

      {/* Three Scores */}
      <div className="relative grid grid-cols-3 gap-4">
        {/* Human Leadership */}
        <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-white p-4">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-[#717182]">
            Human Leadership
          </div>
          <div className="mb-1 text-4xl tracking-tight" style={{ 
            fontFamily: "var(--font-serif)",
            color: "#6B46C1"
          }}>
            {data.hlsScore}%
          </div>
          <div className="text-[11px] text-[#717182]">leadership score</div>
        </div>

        {/* AI Execution Load */}
        <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-white p-4">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-[#717182]">
            AI Execution Load
          </div>
          <div className="mb-1 text-4xl tracking-tight" style={{ 
            fontFamily: "var(--font-serif)",
            color: "#0D9488"
          }}>
            {data.aelScore}%
          </div>
          <div className="text-[11px] text-[#717182]">delegation rate</div>
        </div>

        {/* Cognitive Amplification */}
        <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-white p-4">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-[#717182]">
            Cognitive Amplification
          </div>
          <div className="mb-1 text-4xl tracking-tight" style={{ 
            fontFamily: "var(--font-serif)",
            color: "#D97706"
          }}>
            {data.caiScore}x
          </div>
          <div className="text-[11px] text-[#717182]">capacity multiplier</div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative mt-6 flex items-center justify-between border-t border-[rgba(0,0,0,0.08)] pt-3">
        <div className="font-mono text-[10px] text-[#717182]">
          Verified {data.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • proofofaiwork.com
        </div>
        <div className="text-[10px] text-[#717182]">
          {data.conversationCount || "—"} conversations analyzed
        </div>
      </div>
    </div>
  );
});

TripleScoreCard.displayName = "TripleScoreCard";

// Single Score Focus Card - Hero one score
const SingleScoreCard = forwardRef<HTMLDivElement, { data: ShareDialogProps["data"] }>(({ data }, ref) => {
  return (
    <div
      ref={ref}
      className="relative w-full max-w-[480px] overflow-hidden rounded-lg border-2 border-[#6B46C1] bg-gradient-to-br from-[#F3F0FF] to-white p-10"
      style={{ aspectRatio: "1/1" }}
    >
      {/* Decorative Elements */}
      <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#6B46C1] opacity-5 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#6B46C1] opacity-5 blur-3xl" />

      <div className="relative flex h-full flex-col">
        {/* Header */}
        <div className="mb-auto">
          <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-[#6B46C1]">
            PROOF OF AI WORK
          </div>
          <h2 className="mb-1 text-3xl tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
            {data.name}
          </h2>
          <div className="font-mono text-[13px] text-[#717182]">{data.handle}</div>
        </div>

        {/* Giant Score */}
        <div className="text-center">
          <div className="mb-3 text-[12px] uppercase tracking-wider text-[#717182]">
            Human Leadership
          </div>
          <div className="mb-4 text-[100px] leading-none tracking-tight" style={{ 
            fontFamily: "var(--font-serif)",
            color: "#6B46C1"
          }}>
            {data.hlsScore}%
          </div>
          <div className="text-[14px] text-[#3A3A3A]">
            leadership score
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto border-t border-[rgba(107,70,193,0.2)] pt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wider text-[#717182]">
                Verified Evidence
              </div>
              <div className="font-mono text-[11px] text-[#3A3A3A]">
                {data.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <div className="font-mono text-[12px] text-[#6B46C1]">
              proofofaiwork.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SingleScoreCard.displayName = "SingleScoreCard";

// Certificate Card - Formal certification look
const CertificateCard = forwardRef<HTMLDivElement, { data: ShareDialogProps["data"] }>(({ data }, ref) => {
  return (
    <div
      ref={ref}
      className="relative w-full max-w-[620px] overflow-hidden rounded-lg border-4 border-double border-[#3A3A3A] bg-white p-12"
      style={{ aspectRatio: "4/3" }}
    >
      {/* Decorative Corner Elements */}
      <div className="absolute left-6 top-6 h-10 w-10 border-l-2 border-t-2 border-[#717182]" />
      <div className="absolute right-6 top-6 h-10 w-10 border-r-2 border-t-2 border-[#717182]" />
      <div className="absolute bottom-6 left-6 h-10 w-10 border-b-2 border-l-2 border-[#717182]" />
      <div className="absolute bottom-6 right-6 h-10 w-10 border-b-2 border-r-2 border-[#717182]" />

      <div className="flex h-full flex-col items-center justify-center text-center">
        {/* Header */}
        <div className="mb-6 text-[12px] uppercase tracking-[0.3em] text-[#717182]">
          Certificate of
        </div>
        <h1 className="mb-2 text-4xl tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
          Verified AI Work
        </h1>
        <div className="mb-8 h-px w-40 bg-[rgba(0,0,0,0.15)]" />

        {/* Body */}
        <div className="mb-6 max-w-md text-[14px] leading-relaxed text-[#3A3A3A]">
          This certifies that <strong className="tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>{data.name}</strong> has
          demonstrated exceptional cognitive capacity through verified human-AI collaboration,
          achieving measurable work output across <strong>{data.conversationCount || "—"}</strong> analyzed conversations.
        </div>

        {/* Scores */}
        <div className="mb-6 flex items-center gap-6">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-[#717182]">Human Leadership</div>
            <div className="text-3xl" style={{ fontFamily: "var(--font-serif)", color: "#6B46C1" }}>
              {data.hlsScore}%
            </div>
          </div>
          <div className="h-10 w-px bg-[rgba(0,0,0,0.15)]" />
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-[#717182]">AI Execution Load</div>
            <div className="text-3xl" style={{ fontFamily: "var(--font-serif)", color: "#0D9488" }}>
              {data.aelScore}%
            </div>
          </div>
          <div className="h-10 w-px bg-[rgba(0,0,0,0.15)]" />
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-[#717182]">Cognitive Amplification</div>
            <div className="text-3xl" style={{ fontFamily: "var(--font-serif)", color: "#D97706" }}>
              {data.caiScore}x
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="mb-2 h-px w-28 bg-[rgba(0,0,0,0.15)] mx-auto" />
          <div className="font-mono text-[9px] text-[#717182]">
            VERIFIED {(data.date || "MAR 27, 2026").toUpperCase()}
          </div>
          <div className="mt-1 font-mono text-[10px] text-[#3A3A3A]">
            proofofaiwork.com
          </div>
        </div>
      </div>
    </div>
  );
});

CertificateCard.displayName = "CertificateCard";