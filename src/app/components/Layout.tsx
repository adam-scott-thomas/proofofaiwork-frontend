import { Link, useLocation, useNavigate, Outlet } from "react-router";
import {
  LayoutDashboard,
  Upload,
  FolderKanban,
  MessageSquare,
  User,
  FileBarChart,
  Globe,
  Search,
  Command,
  Settings,
  Network,
  LogOut,
} from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
import { useAuthStore } from "../../stores/authStore";

const navigation = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard, key: "d" },
  { name: "Upload", href: "/app/upload", icon: Upload, key: "u" },
  { name: "Projects", href: "/app/projects", icon: FolderKanban, key: "p" },
  { name: "Conversations", href: "/app/conversations", icon: MessageSquare, key: "c" },
  { name: "Knowledge Map", href: "/app/knowledge-map", icon: Network, key: "k" },
  { name: "Assessments", href: "/app/assessments", icon: FileBarChart, key: "a" },
  { name: "Work Profile", href: "/app/work-profile", icon: User, key: "w" },
  { name: "Proof Pages", href: "/app/proof-pages", icon: Globe, key: "g" },
  { name: "Search", href: "/app/search", icon: Search, key: "/" },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearToken } = useAuthStore();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K for shortcuts dialog
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      // Navigation shortcuts (Cmd/Ctrl + Shift + key)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        const nav = navigation.find(n => n.key === e.key.toLowerCase());
        if (nav) {
          e.preventDefault();
          navigate(nav.href);
        }
      }

      // Quick search (just "/" key)
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          navigate("/app/search");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[rgba(0,0,0,0.08)] bg-white flex flex-col">
        {/* Logo/Brand */}
        <div className="border-b border-[rgba(0,0,0,0.08)] px-6 py-5">
          <h1 className="text-[15px] tracking-tight">Proof of AI Work</h1>
          <p className="mt-0.5 font-mono text-[11px] text-[#717182]">Forensic Evidence</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors ${
                  isActive
                    ? "bg-[#F5F5F7] text-[#030213]"
                    : "text-[#717182] hover:bg-[#FAFAFA] hover:text-[#030213]"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-[rgba(0,0,0,0.08)] p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-[13px] text-[#717182]"
            onClick={() => setShortcutsOpen(true)}
          >
            <Command className="mr-3 h-4 w-4" />
            Keyboard Shortcuts
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-[13px] text-[#717182]"
            onClick={() => navigate("/app/account")}
          >
            <Settings className="mr-3 h-4 w-4" />
            Account & Settings
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-[13px] text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => {
              clearToken();
              navigate("/sign-in");
            }}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
