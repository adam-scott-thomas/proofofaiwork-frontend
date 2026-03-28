import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

function useAuthCallback() {
  const { setToken } = useAuthStore();
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await apiFetch<{ access_token: string }>(`/auth/callback?token=${token}`);
      return res;
    },
    onSuccess: (data) => {
      if (data?.access_token) {
        setToken(data.access_token);
      }
    },
  });
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const authCallback = useAuthCallback();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const error = params.get("error");

  useEffect(() => {
    if (error) {
      setErrorMsg(
        error === "expired"
          ? "This magic link has expired. Please request a new one."
          : "This magic link is invalid or has already been used."
      );
      return;
    }

    if (!token) {
      navigate("/sign-in", { replace: true });
      return;
    }

    authCallback.mutate(token, {
      onSuccess: () => {
        navigate("/dashboard", { replace: true });
      },
      onError: (err) => {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "We couldn't sign you in. The link may be expired or invalid."
        );
      },
    });
  }, []); // Run once on mount

  if (errorMsg || authCallback.isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border border-border">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-3">Authentication failed</h1>
              <p className="text-muted-foreground mb-6">
                {errorMsg || "We couldn't sign you in. The link may be expired or invalid."}
              </p>
              <Button className="w-full" onClick={() => navigate("/sign-in")}>
                Back to sign in
              </Button>
              <p className="text-sm text-muted-foreground mt-6">
                Magic links expire after 10 minutes and can only be used once.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border border-border">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Signing you in...</h1>
            <p className="text-muted-foreground">
              Please wait while we verify your magic link.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
