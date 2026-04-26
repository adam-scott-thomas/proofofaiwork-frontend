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
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <div className="mx-auto max-w-md px-6 py-10">
        <Link to="/" className="text-[13px] text-[#5C5C5C] hover:text-[#161616]">
          &lt;-- back to home
        </Link>

        <form className="mt-10 flex gap-2" onSubmit={submit}>
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (sent) setSent(false);
            }}
            placeholder="you@example.com"
            className="min-w-0 flex-1 rounded-md border border-[#D8D2C4] bg-white px-3 py-3 text-sm outline-none focus:border-[#315D8A]"
            disabled={requestMagicLink.isPending}
            required
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-[#161616] px-4 py-3 text-[12px] font-medium uppercase tracking-[0.12em] text-white disabled:opacity-50"
            disabled={!email || requestMagicLink.isPending}
          >
            {requestMagicLink.isPending ? "SENDING" : sent ? "SENT" : "SEND LINK"}
          </button>
        </form>
        {requestMagicLink.isError ? (
          <div className="mt-3 text-[12px] text-[#8E3B34]">Failed to send.</div>
        ) : null}
      </div>
    </div>
  );
}
