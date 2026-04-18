import { Link, Navigate } from "react-router";
import { ArrowRight, Upload } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export default function UploadFlow() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated()) {
    return <Navigate to="/app/upload/new" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <div className="mx-auto max-w-3xl px-8 py-20">
        <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Upload entry</div>
        <h1 className="mt-4 text-6xl leading-[0.96] tracking-tight">Sign in, then upload.</h1>
        <p className="mt-6 max-w-2xl text-[20px] leading-9 text-[#5C5C5C]">
          The upload path is part of the authenticated workspace. Once signed in, you land on the real upload form,
          not a separate pricing or teaser flow.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-4">
          <Card className="border border-[#D8D2C4] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-[#315D8A]" />
              <div className="text-[18px] tracking-tight">What happens after sign-in</div>
            </div>
            <div className="mt-4 space-y-2 text-[14px] leading-7 text-[#5C5C5C]">
              <div>1. Upload one or more conversation files.</div>
              <div>2. The backend creates an assessment and starts processing.</div>
              <div>3. Parsed conversations appear in the pool and can be moved into projects.</div>
            </div>
          </Card>

          <Card className="border border-[#D8D2C4] bg-[#FBF8F1] p-6 shadow-sm">
            <div className="text-[14px] leading-8 text-[#5C5C5C]">
              The working route after authentication is <span className="font-mono text-[#161616]">/app/upload/new</span>.
            </div>
          </Card>
        </div>

        <div className="mt-10 flex gap-4">
          <Link to="/sign-in?next=/app/upload/new">
            <Button size="lg">
              Sign in to upload
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/directory">
            <Button size="lg" variant="outline">Browse directory</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
