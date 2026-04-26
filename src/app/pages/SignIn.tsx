import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";

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
    <div className="flex min-h-screen items-center justify-center bg-[#101113] px-4 py-10 text-[#F5F1E8]">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#181A1F] p-7 shadow-2xl shadow-black/30">
        <Link to="/" className="text-[13px] text-[#A8A29A] hover:text-white">
          ← Back to home
        </Link>

        <div className="mt-8">
          <div className="text-[22px] font-semibold tracking-tight text-white">ProofOfAIWork</div>
          <h1 className="mt-6 text-[18px] font-medium text-white">Sign in</h1>
          <p className="mt-2 text-[14px] leading-6 text-[#B7B0A6]">
            Enter your email and we’ll send you a secure login link.
          </p>
        </div>

        <form className="mt-6 space-y-3" onSubmit={submit}>
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (sent) setSent(false);
            }}
            placeholder="Email address"
            className="h-12 w-full rounded-md border border-white/10 bg-[#0F1115] px-3 text-sm text-white outline-none placeholder:text-[#736F68] focus:border-[#7AA2C7]"
            disabled={requestMagicLink.isPending}
            required
          />
          <button
            type="submit"
            className="h-12 w-full rounded-md bg-[#F5F1E8] px-4 text-[14px] font-medium text-[#101113] disabled:opacity-50"
            disabled={!email || requestMagicLink.isPending}
          >
            {requestMagicLink.isPending ? "Sending..." : sent ? "Link sent" : "Send secure link"}
          </button>
        </form>
        {sent ? (
          <div className="mt-4 rounded-md border border-[#2E6F4E]/40 bg-[#123021] px-3 py-2 text-[13px] text-[#BDF0D2]">
            Check your email.
          </div>
        ) : null}
        {requestMagicLink.isError ? (
          <div className="mt-3 text-[12px] text-[#FCA5A5]">Failed to send.</div>
        ) : null}
        <div className="mt-5 text-center text-[13px] text-[#8F887F]">No password. No nonsense.</div>
      </div>
    </div>
  );
}
