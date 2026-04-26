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
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#181A1F] p-6 shadow-2xl shadow-black/30">
        <Link to="/" className="text-[13px] text-[#A8A29A] hover:text-white">
          &lt;-- back to home
        </Link>

        <form className="mt-8 flex gap-2" onSubmit={submit}>
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (sent) setSent(false);
            }}
            placeholder="you@example.com"
            className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#0F1115] px-3 py-3 text-sm text-white outline-none placeholder:text-[#736F68] focus:border-[#7AA2C7]"
            disabled={requestMagicLink.isPending}
            required
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-[#F5F1E8] px-4 py-3 text-[12px] font-medium uppercase tracking-[0.12em] text-[#101113] disabled:opacity-50"
            disabled={!email || requestMagicLink.isPending}
          >
            {requestMagicLink.isPending ? "SENDING" : sent ? "SENT" : "SEND LINK"}
          </button>
        </form>
        {sent ? (
          <div className="mt-4 rounded-md border border-[#2E6F4E]/40 bg-[#123021] px-3 py-2 text-[13px] text-[#BDF0D2]">
            check your email.
          </div>
        ) : null}
        {requestMagicLink.isError ? (
          <div className="mt-3 text-[12px] text-[#FCA5A5]">Failed to send.</div>
        ) : null}
      </div>
    </div>
  );
}
