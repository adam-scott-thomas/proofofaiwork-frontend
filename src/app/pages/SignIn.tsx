import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";

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

  // Where to redirect after auth
  const nextUrl = searchParams.get("next")
    || (location.state as any)?.from?.pathname
    || "/dashboard";

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(nextUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, nextUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Store redirect target so AuthCallback can pick it up after the email roundtrip
      if (nextUrl !== "/dashboard") {
        localStorage.setItem("poaw-auth-redirect", nextUrl);
      }
      await requestMagicLink.mutateAsync({ email });
      setSent(true);
    } catch (error) {
      console.error("Failed to send magic link:", error);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
        <header className="p-6">
          <Link
            to="/sign-in"
            onClick={() => setSent(false)}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <Card className="shadow-xl border border-gray-200 p-8 text-center">
              <CardContent className="p-0">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-6">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-3">Check your email</h1>
                <p className="text-muted-foreground mb-4">We've sent a magic link to</p>
                <div className="bg-muted rounded-lg p-4 mb-6">
                  <p className="font-semibold text-foreground">{email}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  The link expires in 15 minutes and can only be used once.
                </p>
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Didn't receive it?</p>
                  <button
                    onClick={() => setSent(false)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Try again with a different email
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      <header className="p-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <h1 className="text-3xl font-bold text-foreground mb-2">ProofOfAIWork</h1>
            </Link>
            <p className="text-muted-foreground">
              {nextUrl.startsWith("/student")
                ? "Sign in to submit your work for analysis"
                : "Sign in to build verifiable proof of your AI work"
              }
            </p>
          </div>

          <Card className="shadow-xl border border-gray-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mx-auto mb-6">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>

              <h2 className="text-2xl font-bold text-foreground text-center mb-2">
                Sign in with email
              </h2>
              <p className="text-muted-foreground text-center mb-8">
                We'll send you a magic link to sign in instantly—no password needed.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={requestMagicLink.isPending}
                  />
                </div>

                {requestMagicLink.isError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm text-destructive">
                      Failed to send magic link. Please try again.
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={requestMagicLink.isPending || !email}
                  className="w-full"
                  size="lg"
                >
                  {requestMagicLink.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending magic link...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Send magic link
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
