import { createBrowserRouter, Navigate } from "react-router";
import SiteLayout from "../marketing/components/SiteLayout";
import AboutPage from "../marketing/pages/AboutPage";
import BlogIndexPage from "../marketing/pages/BlogIndexPage";
import BlogPostPage from "../marketing/pages/BlogPostPage";
import CommunityPage from "../marketing/pages/CommunityPage";
import DossierPage from "../marketing/pages/DossierPage";
import EmployersPage from "../marketing/pages/EmployersPage";
import ExamplesPage from "../marketing/pages/ExamplesPage";
import HomePage from "../marketing/pages/HomePage";
import JobSeekersPage from "../marketing/pages/JobSeekersPage";
import LegalPage from "../marketing/pages/LegalPage";
import NotFoundPage from "../marketing/pages/NotFoundPage";
import ProofPage from "../marketing/pages/ProofPage";
import QuizPage from "../marketing/pages/QuizPage";
import QuizzesPage from "../marketing/pages/QuizzesPage";
import ScoresPage from "../marketing/pages/ScoresPage";

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
      { path: "community", element: <CommunityPage /> },
      { path: "dossier/:handle", element: <DossierPage /> },
      { path: "proof/:slug", element: <ProofPage /> },
      { path: "scores", element: <ScoresPage /> },
      { path: "examples", element: <ExamplesPage /> },
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
