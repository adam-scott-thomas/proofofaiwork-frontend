import { Link, Outlet, useNavigate } from "react-router";
import { GraduationCap, LogOut } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "./ui/button";

export default function StudentLayout() {
  const navigate = useNavigate();
  const { clearToken, isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Minimal top bar */}
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/student" className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <span className="text-[15px] tracking-tight">
              Proof<span className="text-blue-600">Of</span>AI<span className="text-blue-600">Work</span>
              <span className="ml-1.5 text-[11px] text-[#717182]">for students</span>
            </span>
          </Link>
          {isAuthenticated() && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[13px] text-[#717182]"
              onClick={() => {
                clearToken();
                navigate("/");
              }}
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Sign out
            </Button>
          )}
        </div>
      </header>

      {/* Centered content */}
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
