import { createBrowserRouter, Navigate } from "react-router";
import SiteLayout from "../marketing/components/SiteLayout";
import AboutPage from "../marketing/pages/AboutPage";
import ArchetypePage from "../marketing/pages/ArchetypePage";
import ArchetypesPage from "../marketing/pages/ArchetypesPage";
import BlogIndexPage from "../marketing/pages/BlogIndexPage";
import BlogPostPage from "../marketing/pages/BlogPostPage";
import ComparisonPage from "../marketing/pages/ComparisonPage";
import CommunityPage from "../marketing/pages/CommunityPage";
import DemoCardsPage from "../marketing/pages/DemoCardsPage";
import DemoDossiersPage from "../marketing/pages/DemoDossiersPage";
import DemoIndexPage from "../marketing/pages/DemoIndexPage";
import DemoProofsPage from "../marketing/pages/DemoProofsPage";
import DossierPage from "../marketing/pages/DossierPage";
import EmployersPage from "../marketing/pages/EmployersPage";
import EnterpriseHiringPage from "../marketing/pages/EnterpriseHiringPage";
import EnterpriseWorkforcePage from "../marketing/pages/EnterpriseWorkforcePage";
import ExamplesPage from "../marketing/pages/ExamplesPage";
import GlossaryPage from "../marketing/pages/GlossaryPage";
import GlossaryTermPage from "../marketing/pages/GlossaryTermPage";
import HomePage from "../marketing/pages/HomePage";
import JobSeekersPage from "../marketing/pages/JobSeekersPage";
import LegalPage from "../marketing/pages/LegalPage";
import NotFoundPage from "../marketing/pages/NotFoundPage";
import ProofPage from "../marketing/pages/ProofPage";
import QuizPage from "../marketing/pages/QuizPage";
import QuizzesPage from "../marketing/pages/QuizzesPage";
import RoleLeveragePage from "../marketing/pages/RoleLeveragePage";
import ScoresPage from "../marketing/pages/ScoresPage";
import SeoOpportunityPage from "../marketing/pages/SeoOpportunityPage";
import YourAiResumePage from "../marketing/pages/YourAiResumePage";
import { allSeoPages, yourAiResumePages } from "../marketing/seo-opportunities";

const seoRoutes = allSeoPages
  .filter((page) => page.slug !== "examples")
  .map((page) => ({ path: page.slug, element: <SeoOpportunityPage slug={page.slug} /> }));

const resumeSeoRoutes = yourAiResumePages
  .filter((page) => page.slug !== "your-ai-resume")
  .map((page) => ({ path: page.slug, element: <YourAiResumePage pageSlug={page.slug} /> }));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <SiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "quizzes", element: <QuizzesPage /> },
      { path: "quizzes/ai-native-score", element: <QuizPage quizSlug="ai-native-score" /> },
      { path: "quizzes/ai-work-style", element: <QuizPage quizSlug="ai-work-style" /> },
      { path: "blog", element: <BlogIndexPage /> },
      { path: "blog/:slug", element: <BlogPostPage /> },
      { path: "archetypes", element: <ArchetypesPage /> },
      { path: "archetypes/:slug", element: <ArchetypePage /> },
      { path: "glossary", element: <GlossaryPage /> },
      { path: "glossary/:slug", element: <GlossaryTermPage /> },
      { path: "ai-leverage/:slug", element: <RoleLeveragePage /> },
      { path: "compare/:slug", element: <ComparisonPage /> },
      { path: "enterprise/hiring-ai-capable-talent", element: <EnterpriseHiringPage /> },
      { path: "enterprise/workforce-amplification", element: <EnterpriseWorkforcePage /> },
      { path: "community", element: <CommunityPage /> },
      { path: "demo", element: <DemoIndexPage /> },
      { path: "demo/cards", element: <DemoCardsPage /> },
      { path: "demo/proofs", element: <DemoProofsPage /> },
      { path: "demo/dossiers", element: <DemoDossiersPage /> },
      { path: "dossier/:handle", element: <DossierPage /> },
      { path: "proof/:slug", element: <ProofPage /> },
      { path: "scores", element: <ScoresPage /> },
      { path: "examples", element: <ExamplesPage /> },
      ...seoRoutes,
      ...resumeSeoRoutes,
      { path: "resume-is-dead", element: <YourAiResumePage /> },
      { path: "your-ai-resume", element: <YourAiResumePage /> },
      { path: "your-ai-resume/:slug", element: <YourAiResumePage /> },
      { path: "employers", element: <EmployersPage /> },
      { path: "job-seekers", element: <JobSeekersPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "privacy", element: <LegalPage kind="privacy" /> },
      { path: "terms", element: <LegalPage kind="terms" /> },
      { path: "quiz", element: <Navigate to="/quizzes/ai-native-score" replace /> },
      { path: "ai-archetype-quiz", element: <Navigate to="/quizzes/ai-native-score" replace /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
