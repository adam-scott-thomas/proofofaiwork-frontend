import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import StudentLayout from "./components/StudentLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import UploadPool from "./pages/UploadPool";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Conversations from "./pages/Conversations";
import ConversationDetail from "./pages/ConversationDetail";
import WorkProfile from "./pages/WorkProfile";
import Assessments from "./pages/Assessments";
import ProofPages from "./pages/ProofPages";
import Search from "./pages/Search";
import Account from "./pages/Account";
import PublicProofPage from "./pages/PublicProofPage";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/SignIn";
import AuthCallback from "./pages/AuthCallback";
import Upload from "./pages/Upload";
import Processing from "./pages/Processing";
import Results from "./pages/Results";
import StudentSubmit from "./pages/StudentSubmit";
import StudentProcessing from "./pages/StudentProcessing";
import StudentResults from "./pages/StudentResults";
import { createElement } from "react";

// Helper to wrap a component with ProtectedRoute
function protect(Component: React.ComponentType) {
  return () => createElement(ProtectedRoute, null, createElement(Component));
}

export const router = createBrowserRouter([
  // Public landing page
  {
    path: "/",
    Component: Landing,
  },
  // ──────────────────────────────────────────
  // Student flow (simplified, no sidebar)
  // ──────────────────────────────────────────
  {
    path: "/student",
    Component: protect(StudentLayout),
    children: [
      { index: true, Component: StudentSubmit },
      { path: "submit", Component: StudentSubmit },
      { path: "processing/:id", Component: StudentProcessing },
      { path: "results/:id", Component: StudentResults },
    ],
  },
  // ──────────────────────────────────────────
  // Professional dashboard (sidebar layout)
  // ──────────────────────────────────────────
  {
    path: "/dashboard",
    Component: protect(Layout),
    children: [
      { index: true, Component: Dashboard },
      { path: "upload", Component: UploadPool },
      { path: "upload/new", Component: Upload },
      { path: "projects", Component: Projects },
      { path: "projects/:id", Component: ProjectDetail },
      { path: "conversations", Component: Conversations },
      { path: "conversations/:id", Component: ConversationDetail },
      { path: "work-profile", Component: WorkProfile },
      { path: "assessments", Component: Assessments },
      { path: "assessment/:id/processing", Component: Processing },
      { path: "assessment/:id/results", Component: Results },
      { path: "proof-pages", Component: ProofPages },
      { path: "search", Component: Search },
      { path: "account", Component: Account },
    ],
  },
  // Public proof pages (no sidebar)
  {
    path: "/p/:slug",
    Component: PublicProofPage,
  },
  // Auth pages (no sidebar)
  {
    path: "/sign-in",
    Component: SignIn,
  },
  {
    path: "/auth/callback",
    Component: AuthCallback,
  },
  // 404 Not Found
  {
    path: "*",
    Component: NotFound,
  },
]);
