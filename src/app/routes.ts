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
import Portfolios from "./pages/Portfolios";
import PortfolioDetail from "./pages/PortfolioDetail";
import WorkProfile from "./pages/WorkProfile";
import PublicProofPage from "./pages/PublicProofPage";
import PublicPortfolio from "./pages/PublicPortfolio";
import Explore, { DirectoryRedirect } from "./pages/Explore";
import Students from "./pages/Students";
import Employers from "./pages/Employers";
import HowItWorks from "./pages/HowItWorks";
import ProofOfAIWorkPage from "./pages/ProofOfAIWorkPage";
import AIPortfolioPage from "./pages/AIPortfolioPage";
import BlogIndex from "./pages/BlogIndex";
import BlogArticle from "./pages/BlogArticle";
import Quiz from "./pages/Quiz";
import Search from "./pages/Search";
import Webhooks from "./pages/Webhooks";
import Settings from "./pages/Settings";
import Account from "./pages/Account";
import Billing from "./pages/Billing";
import NotFound from "./pages/NotFound";

function protect(Component: React.ComponentType) {
  return () => createElement(ProtectedRoute, null, createElement(Component));
}

export const router = createBrowserRouter([
  { path: "/", Component: Landing, ErrorBoundary },
  { path: "/sign-in", Component: SignIn, ErrorBoundary },
  { path: "/auth/callback", Component: AuthCallback, ErrorBoundary },
  { path: "/upload", Component: UploadFlow, ErrorBoundary },
  { path: "/students", Component: Students, ErrorBoundary },
  { path: "/employers", Component: Employers, ErrorBoundary },
  { path: "/how-it-works", Component: HowItWorks, ErrorBoundary },
  { path: "/proof-of-ai-work", Component: ProofOfAIWorkPage, ErrorBoundary },
  { path: "/ai-portfolio", Component: AIPortfolioPage, ErrorBoundary },
  { path: "/blog", Component: BlogIndex, ErrorBoundary },
  { path: "/blog/:slug", Component: BlogArticle, ErrorBoundary },
  { path: "/quiz", Component: Quiz, ErrorBoundary },
  { path: "/quiz/:result", Component: Quiz, ErrorBoundary },
  { path: "/ai-archetype-quiz", Component: Quiz, ErrorBoundary },
  { path: "/ai-archetype-quiz/:result", Component: Quiz, ErrorBoundary },
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
      { path: "portfolios", Component: Portfolios },
      { path: "portfolios/:id", Component: PortfolioDetail },
      { path: "work-profile", Component: WorkProfile },
      { path: "search", Component: Search },
      { path: "settings", Component: Settings },
      { path: "settings/account", Component: Account },
      { path: "settings/billing", Component: Billing },
      { path: "settings/webhooks", Component: Webhooks },
    ],
  },
  { path: "/p/:slug", Component: PublicProofPage, ErrorBoundary },
  { path: "/u/:slug", Component: PublicPortfolio, ErrorBoundary },
  { path: "/explore", Component: Explore, ErrorBoundary },
  { path: "/directory", Component: DirectoryRedirect, ErrorBoundary },
  { path: "*", Component: NotFound },
]);
