import { ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { APP_URL, PRIMARY_CTA } from "../lib/constants";

const navGroups = [
  {
    label: "Explore",
    items: [
      { href: "/community", label: "Community", note: "Public evidence archive" },
      { href: "/examples", label: "Examples", note: "Specimen surfaces" },
      { href: "/demo/proofs", label: "Proof Gallery", note: "Full proof specimens" },
      { href: "/demo/dossiers", label: "Dossiers", note: "Capability archives" },
      { href: "/archetypes", label: "Archetypes", note: "Operator patterns" },
    ],
  },
  {
    label: "Learn",
    items: [
      { href: "/scores", label: "Scores", note: "Signal definitions" },
      { href: "/glossary", label: "Glossary", note: "Shared vocabulary" },
      { href: "/glossary/ai-work-sample", label: "AI Work Samples", note: "Inspectable work" },
      { href: "/your-ai-resume", label: "Your AI-Resume", note: "Submit proof" },
      { href: "/glossary/ai-leverage", label: "AI Leverage", note: "Capability lift" },
      { href: "/ai-leverage/product-managers", label: "AI for Product Managers", note: "Role leverage" },
      { href: "/ai-leverage/recruiters", label: "AI for Recruiters", note: "Talent workflows" },
      { href: "/blog", label: "Blog", note: "Field notes" },
    ],
  },
  {
    label: "Solutions",
    items: [
      { href: "/employers", label: "Employers", note: "Review real work" },
      { href: "/enterprise/workforce-amplification", label: "Workforce Amplification", note: "Team capability" },
      { href: "/enterprise/hiring-ai-capable-talent", label: "Hiring AI-Capable Talent", note: "Evidence-based hiring" },
      { href: "/compare/resume-screening-vs-proof-of-work", label: "Resumes vs Proof", note: "Category comparison" },
      { href: "/resume-is-dead", label: "Resume Is Dead", note: "Proof campaign" },
      { href: "/job-seekers", label: "Job Seekers", note: "Publish proof" },
    ],
  },
  {
    label: "Assess",
    items: [
      { href: "/quizzes", label: "Quizzes", note: "Directional checks" },
      { href: "/quizzes/ai-work-style", label: "AI Workstyle", note: "Work pattern quiz" },
      { href: "/quizzes/ai-native-score", label: "AI Readiness", note: "Maturity signal" },
      { href: "/quizzes/ai-native-score", label: "Capability Diagnostic", note: "Start assessment" },
    ],
  },
];

export default function SiteLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link to="/" className="brand" aria-label="ProofOfAIWork home" onClick={() => setOpen(false)}>
          <img src="/proof-of-ai-work-wordmark.svg" alt="" aria-hidden="true" />
          <span className="sr-only">ProofOfAIWork</span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <button className="nav-group-trigger" type="button" aria-haspopup="true">
                {group.label}
                <ChevronDown size={14} aria-hidden="true" />
              </button>
              <div className="nav-panel">
                <span>{group.label}</span>
                {group.items.map((item) => (
                  <NavLink key={`${group.label}-${item.label}`} to={item.href}>
                    <strong>{item.label}</strong>
                    <small>{item.note}</small>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <a className="nav-cta" href={APP_URL}>
          {PRIMARY_CTA}
        </a>
        <button
          className="icon-button mobile-menu-button"
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {open ? (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navGroups.map((group) => (
            <section className="mobile-nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map((item) => (
                <NavLink key={`${group.label}-${item.label}`} to={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </NavLink>
              ))}
            </section>
          ))}
          <a className="mobile-nav-cta" href={APP_URL} onClick={() => setOpen(false)}>
            {PRIMARY_CTA}
          </a>
        </nav>
      ) : null}

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div>
          <Link to="/" className="brand footer-brand">
            <span className="brand-mark">P</span>
            <span>ProofOfAIWork</span>
          </Link>
          <p>Structured proof for people who do serious work with AI.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link to="/about">About</Link>
          <Link to="/archetypes">Archetypes</Link>
          <Link to="/glossary">Glossary</Link>
          <Link to="/enterprise/hiring-ai-capable-talent">Hiring evaluation</Link>
          <Link to="/enterprise/workforce-amplification">Workforce amplification</Link>
          <Link to="/ai-leverage/product-managers">AI leverage for PMs</Link>
          <Link to="/ai-leverage/recruiters">AI leverage for recruiters</Link>
          <Link to="/ai-leverage/marketers">AI leverage for marketers</Link>
          <Link to="/compare/ai-skills-assessments-vs-work-samples">Assessments vs work samples</Link>
          <Link to="/compare/resume-screening-vs-proof-of-work">Resumes vs proof</Link>
          <Link to="/your-ai-resume">Your AI-Resume</Link>
          <Link to="/community">Community</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <a href={APP_URL}>App</a>
        </nav>
      </footer>
    </div>
  );
}
