import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  FolderKanban,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Upload,
  X,
  FileBarChart,
  MoonStar,
  SunMedium,
} from "lucide-react";
import { Button } from "./ui/button";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import { useFrontendState } from "../../hooks/useApi";
import { apiPost } from "../../lib/api";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKind?: "info" | "warn" | "alert";
  getBadge?: (ctx: SidebarContext) => number;
};

type SidebarContext = {
  runningAssessments: number;
  draftProofs: number;
  unassignedUploads: number;
};

const items: NavItem[] = [
  {
    name: "Dashboard",
    href: "/app",
    icon: LayoutDashboard,
  },
  {
    name: "Upload",
    href: "/app/upload",
    icon: Upload,
    badgeKind: "warn",
    getBadge: (ctx) => ctx.unassignedUploads,
  },
  { name: "Conversations", href: "/app/conversations", icon: MessageSquare },
  { name: "Projects", href: "/app/projects", icon: FolderKanban },
  {
    name: "Assessments",
    href: "/app/assessments",
    icon: FileBarChart,
    badgeKind: "info",
    getBadge: (ctx) => ctx.runningAssessments,
  },
  {
    name: "Proof Pages",
    href: "/app/proof-pages",
    icon: Globe,
    badgeKind: "warn",
    getBadge: (ctx) => ctx.draftProofs,
  },
];

function useSidebarContext(): SidebarContext {
  const { data: state } = useFrontendState();
  const counts = state?.counts ?? state?.dashboard?.counts ?? {};

  return {
    runningAssessments: Number(counts.running_assessments ?? counts.assessments_running ?? 0),
    draftProofs: Number(counts.draft_proof_pages ?? counts.draft_proofs ?? 0),
    unassignedUploads: Number(counts.unassigned_uploads ?? counts.unassigned ?? 0),
  };
}

function Badge({ count, kind }: { count: number; kind: "info" | "warn" | "alert" }) {
  if (count <= 0) return null;
  const style =
    kind === "alert" ? "bg-[#8B2F2F] text-white" :
    kind === "warn" ? "bg-[#C18A2E] text-white" :
    "bg-[#315D8A] text-white";
  return (
    <span className={`ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0 text-[10px] font-medium leading-tight ${style}`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearToken } = useAuthStore();
  const { aiMode, enterAiMode, exitAiMode } = useThemeStore();
  const context = useSidebarContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Cmd/Ctrl+K focuses the search input
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const input = document.getElementById("layout-search-input") as HTMLInputElement | null;
        input?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query.length >= 2) navigate(`/app/conversations?q=${encodeURIComponent(query)}`);
  };

  const active = (href: string) =>
    href === "/app" ? location.pathname === "/app" : location.pathname === href || location.pathname.startsWith(`${href}/`);

  const sidebarNav = (
    <>
      <div className="border-b border-[#D8D2C4] px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-[#6B6B66] sm:text-[12px]">Workspace</div>
            <div className="mt-2 text-[17px] tracking-tight sm:text-[18px]">Proof of AI Work</div>
          </div>
          <button
            type="button"
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[#D8D2C4] bg-white px-2.5 text-[11px] text-[#5C5C5C] transition-colors hover:border-[#315D8A] hover:text-[#161616]"
            onClick={() => (aiMode ? exitAiMode() : enterAiMode())}
          >
            {aiMode ? <SunMedium className="h-3.5 w-3.5" /> : <MoonStar className="h-3.5 w-3.5" />}
            {aiMode ? "Light" : "Dark"}
          </button>
        </div>
        <form onSubmit={submitSearch} className="relative mt-4">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B6B66]" />
          <input
            id="layout-search-input"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search..."
            className="h-10 w-full rounded-md border border-[#D8D2C4] bg-white pl-8 pr-12 text-[13px] text-[#161616] placeholder:text-[#6B6B66] focus:border-[#315D8A] focus:outline-none sm:h-8 sm:text-[12px]"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded bg-[#F3EEE2] px-1 py-0.5 font-mono text-[9px] text-[#6B6B66] sm:inline-flex">
            ⌘K
          </span>
        </form>
      </div>

      <nav className="px-3 py-4">
        <div className="space-y-1">
          {items.map((item) => {
            const count = item.getBadge ? item.getBadge(context) : 0;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] transition-colors sm:py-2 sm:text-[13px] ${
                  active(item.href)
                    ? "bg-[#161616] text-white"
                    : "text-[#5C5C5C] hover:bg-[#F3EEE2] hover:text-[#161616]"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.name}</span>
                {item.badgeKind ? <Badge count={count} kind={item.badgeKind} /> : null}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto space-y-1 px-3 pb-4">
        <Link
          to="/app/settings"
          className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] transition-colors sm:py-2 sm:text-[13px] ${
            location.pathname.startsWith("/app/settings")
              ? "bg-[#161616] text-white"
              : "text-[#5C5C5C] hover:bg-[#F3EEE2] hover:text-[#161616]"
          }`}
        >
          <SettingsIcon className="h-4 w-4" />
          Settings
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-[14px] text-[#8E3B34] hover:bg-[#FBEDEC] hover:text-[#8E3B34] sm:text-[13px]"
          onClick={async () => {
            await apiPost("/auth/logout", {}).catch(() => undefined);
            clearToken();
            navigate("/sign-in");
          }}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616] lg:flex">
      <div className="sticky top-0 z-40 border-b border-[#D8D2C4] bg-[#FBF8F1]/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#D8D2C4] bg-white text-[#161616]"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] tracking-tight">Proof of AI Work</div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-[#6B6B66]">Workspace</div>
          </div>
          <Link to="/app/conversations" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#D8D2C4] bg-white text-[#161616]" aria-label="Open conversations">
            <SearchIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-[#161616]/45"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative flex h-full w-[min(88vw,22rem)] flex-col overflow-y-auto border-r border-[#D8D2C4] bg-[#FBF8F1] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#D8D2C4] px-4 py-3">
              <div>
                <div className="text-[15px] tracking-tight">Proof of AI Work</div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-[#6B6B66]">Navigate</div>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#D8D2C4] bg-white text-[#161616]"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebarNav}
          </div>
        </div>
      ) : null}

      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#D8D2C4] bg-[#FBF8F1] lg:flex">
        {sidebarNav}
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
