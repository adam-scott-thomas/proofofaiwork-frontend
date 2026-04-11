import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import UploadFlow from "./pages/UploadFlow";
import UploadPool from "./pages/UploadPool";
import Upload from "./pages/Upload";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Conversations from "./pages/Conversations";
import ConversationDetail from "./pages/ConversationDetail";
import KnowledgeMapPage from "./pages/KnowledgeMapPage";
import WorkProfile from "./pages/WorkProfile";
import Assessments from "./pages/Assessments";
import Processing from "./pages/Processing";
import Results from "./pages/Results";
import ProofPages from "./pages/ProofPages";
import Billing from "./pages/Billing";
import Search from "./pages/Search";
import Account from "./pages/Account";
import PublicProofPage from "./pages/PublicProofPage";
import PublicProfile from "./pages/PublicProfile";
import Leaderboard from "./pages/Leaderboard";
import Methodology from "./pages/Methodology";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/SignIn";
import AuthCallback from "./pages/AuthCallback";
import StudentUpload from "./pages/student/StudentUpload";
import StudentAnalyze from "./pages/student/StudentAnalyze";
import StudentShareGate from "./pages/student/StudentShareGate";
import StudentResults from "./pages/student/StudentResults";
import { createElement } from "react";

function protect(Component: React.ComponentType) {
  return () => createElement(ProtectedRoute, null, createElement(Component));
}

export const router = createBrowserRouter([
  // Public landing
  { path: "/", Component: Landing, ErrorBoundary },

  // First-time upload flow (no sidebar)
  { path: "/upload", Component: UploadFlow, ErrorBoundary },

  // Authenticated workspace
  {
    path: "/app",
    Component: protect(Layout),
    ErrorBoundary,
    children: [
      { index: true, Component: Dashboard },
      { path: "upload", Component: UploadPool },
      { path: "upload/new", Component: Upload },
      { path: "projects", Component: Projects },
      { path: "projects/:id", Component: ProjectDetail },
      { path: "conversations", Component: Conversations },
      { path: "conversations/:id", Component: ConversationDetail },
      { path: "knowledge-map", Component: KnowledgeMapPage },
      { path: "work-profile", Component: WorkProfile },
      { path: "assessments", Component: Assessments },
      { path: "assessment/:id/processing", Component: Processing },
      { path: "assessment/:id/results", Component: Results },
      { path: "proof-pages", Component: ProofPages },
      { path: "billing", Component: Billing },
      { path: "search", Component: Search },
      { path: "account", Component: Account },
    ],
  },

  // Public pages
  { path: "/@:username", Component: PublicProfile },
  { path: "/p/:slug", Component: PublicProofPage },
  { path: "/leaderboard", Component: Leaderboard },
  { path: "/methodology", Component: Methodology },

  // Student flow (no sidebar)
  { path: "/student/upload", Component: StudentUpload },
  { path: "/student/analyze", Component: StudentAnalyze },
  { path: "/student/share", Component: StudentShareGate },
  { path: "/student/results", Component: StudentResults },

  // Auth
  { path: "/sign-in", Component: SignIn },
  { path: "/auth/callback", Component: AuthCallback },

  { path: "*", Component: NotFound },
]);
