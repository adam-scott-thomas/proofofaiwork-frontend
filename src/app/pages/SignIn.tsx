import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

function useRequestMagicLink() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) =>
      apiFetch("/auth/magic-link", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
  });
}

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const requestMagicLink = useRequestMagicLink();

  const nextUrl =
    searchParams.get("next") ||
    (location.state as any)?.from?.pathname ||
    "/app";

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(nextUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, nextUrl]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (nextUrl !== "/app") localStorage.setItem("poaw-auth-redirect", nextUrl);
      await requestMagicLink.mutateAsync({ email });
      setSent(true);
    } catch {
      // handled by mutation state
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <div className="mx-auto max-w-5xl px-8 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-[13px] text-[#5C5C5C] hover:text-[#161616]">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mt-12 grid grid-cols-[1.1fr_0.9fr] gap-8">
          <div>
            <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Sign in</div>
            <h1 className="mt-4 text-6xl leading-[0.96] tracking-tight">Email only. No password.</h1>
            <p className="mt-6 max-w-xl text-[20px] leading-9 text-[#5C5C5C]">
              Request a magic link, click it, and land directly in the workspace. This page should do one thing and do it cleanly.
            </p>
          </div>

          <Card className="border border-[#D8D2C4] bg-white p-8 shadow-sm">
            {sent ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E7F2E9]">
                  <Mail className="h-6 w-6 text-[#2F6B3B]" />
                </div>
                <div className="mt-5 text-2xl tracking-tight">Check your email.</div>
                <div className="mt-3 text-[15px] leading-8 text-[#5C5C5C]">
                  We sent a magic link to <span className="font-medium text-[#161616]">{email}</span>.
                </div>
                <div className="mt-6 text-[13px] text-[#6B6B66]">The link expires and can only be used once.</div>
                <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
                  Use a different email
                </Button>
              </>
            ) : (
              <>
                <div className="text-[13px] uppercase tracking-[0.14em] text-[#6B6B66]">Magic link</div>
                <form className="mt-5" onSubmit={submit}>
                  <label className="text-[13px] text-[#5C5C5C]">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="mt-2 w-full rounded-md border border-[#D8D2C4] bg-[#FBF8F1] px-3 py-3 text-sm outline-none"
                    disabled={requestMagicLink.isPending}
                    required
                  />

                  {requestMagicLink.isError ? (
                    <div className="mt-4 rounded-md border border-[#E4B7B2] bg-[#FBEDEC] px-3 py-3 text-[13px] text-[#8E3B34]">
                      Failed to send magic link. Try again.
                    </div>
                  ) : null}

                  <Button type="submit" size="lg" className="mt-5 w-full" disabled={!email || requestMagicLink.isPending}>
                    {requestMagicLink.isPending ? "Sending..." : "Send magic link"}
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
