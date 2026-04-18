import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { FolderKanban, Globe, LayoutDashboard, LogOut, MessageSquare, Upload, FileBarChart } from "lucide-react";
import { Button } from "./ui/button";
import { useAuthStore } from "../../stores/authStore";

const items = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  { name: "Upload", href: "/app/upload", icon: Upload },
  { name: "Conversations", href: "/app/conversations", icon: MessageSquare },
  { name: "Projects", href: "/app/projects", icon: FolderKanban },
  { name: "Assessments", href: "/app/assessments", icon: FileBarChart },
  { name: "Proof Pages", href: "/app/proof-pages", icon: Globe },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearToken } = useAuthStore();

  const active = (href: string) => (href === "/app" ? location.pathname === "/app" : location.pathname === href || location.pathname.startsWith(`${href}/`));

  return (
    <div className="flex min-h-screen bg-[#F7F4ED] text-[#161616]">
      <aside className="w-64 border-r border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="border-b border-[#D8D2C4] px-6 py-6">
          <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Workspace</div>
          <div className="mt-2 text-[18px] tracking-tight">Proof of AI Work</div>
        </div>

        <nav className="px-3 py-4">
          <div className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors ${
                  active(item.href) ? "bg-[#161616] text-white" : "text-[#5C5C5C] hover:bg-[#F3EEE2] hover:text-[#161616]"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        <div className="mt-auto px-3 pb-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-[13px] text-[#8E3B34] hover:bg-[#FBEDEC] hover:text-[#8E3B34]"
            onClick={() => {
              clearToken();
              navigate("/sign-in");
            }}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
