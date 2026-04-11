import { useRouteError, isRouteErrorResponse, Link } from "react-router";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

export default function ErrorBoundary() {
  const error = useRouteError();
  const isRouteError = isRouteErrorResponse(error);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>

        <h1 className="mb-3 text-2xl tracking-tight">
          {isRouteError ? `${error.status} — ${error.statusText}` : "Something went wrong"}
        </h1>

        <p className="mb-8 text-[15px] text-[#717182]">
          {isRouteError
            ? "The page you're looking for doesn't exist or has moved."
            : "An unexpected error occurred. Try refreshing the page."}
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
