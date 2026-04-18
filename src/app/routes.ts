import { createBrowserRouter } from "react-router";
import { createElement } from "react";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import UploadFlow from "./pages/UploadFlow";
import UploadPool from "./pages/UploadPool";
import Upload from "./pages/Upload";
import ConversationDetail from "./pages/ConversationDetail";
import Conversations from "./pages/Conversations";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Assessments from "./pages/Assessments";
import Processing from "./pages/Processing";
import Results from "./pages/Results";
import ProofPages from "./pages/ProofPages";
import PublicProofPage from "./pages/PublicProofPage";
import Explore from "./pages/Explore";
import NotFound from "./pages/NotFound";

function protect(Component: React.ComponentType) {
  return () => createElement(ProtectedRoute, null, createElement(Component));
}

export const router = createBrowserRouter([
  { path: "/", Component: Landing, ErrorBoundary },
  { path: "/sign-in", Component: SignIn, ErrorBoundary },
  { path: "/auth/callback", Component: AuthCallback, ErrorBoundary },
  { path: "/upload", Component: UploadFlow, ErrorBoundary },
  {
    path: "/app",
    Component: protect(Layout),
    ErrorBoundary,
    children: [
      { index: true, Component: Dashboard },
      { path: "upload", Component: UploadPool },
      { path: "upload/new", Component: Upload },
      { path: "conversations", Component: Conversations },
      { path: "conversations/:id", Component: ConversationDetail },
      { path: "projects", Component: Projects },
      { path: "projects/:id", Component: ProjectDetail },
      { path: "assessments", Component: Assessments },
      { path: "assessment/:id/processing", Component: Processing },
      { path: "assessment/:id/results", Component: Results },
      { path: "proof-pages", Component: ProofPages },
    ],
  },
  { path: "/p/:slug", Component: PublicProofPage, ErrorBoundary },
  { path: "/directory", Component: Explore, ErrorBoundary },
  { path: "*", Component: NotFound },
]);
