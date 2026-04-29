import { Link } from "react-router";
import {
  ArrowRight,
  CreditCard,
  LogOut,
  Settings as SettingsIcon,
  User as UserIcon,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useCurrentUser } from "../../hooks/useApi";
import { useAuthStore } from "../../stores/authStore";
import { useNavigate } from "react-router";
import { apiPost } from "../../lib/api";

type Entry = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const ENTRIES: Entry[] = [
  {
    href: "/app/settings/account",
    title: "Account",
    description: "Name and screen name. We assign one automatically and allow one change total.",
    icon: UserIcon,
  },
  {
    href: "/app/settings/billing",
    title: "Billing",
    description: "Approved checkout and current entitlements.",
    icon: CreditCard,
  },
];

export default function Settings() {
  const { data: user } = useCurrentUser();
  const { clearToken } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-7">
          <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">
            <SettingsIcon className="h-3.5 w-3.5" />
            Settings
          </div>
          <h1 className="mt-2 text-3xl tracking-tight">
            {user?.handle ? `@${String(user.handle).replace(/^@/, "")}` : user?.email ?? "Your workspace"}
          </h1>
          {user?.email ? (
            <p className="mt-1 text-[13px] text-[#6B6B66]">{user.email}</p>
          ) : null}
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <section className="space-y-2">
            {ENTRIES.map((entry) => {
              const Icon = entry.icon;
              return (
                <Link key={entry.href} to={entry.href}>
                  <Card className="group border border-[#D8D2C4] bg-white p-4 transition-colors hover:border-[#A88F5F] hover:bg-[#FBF8F1]">
                    <div className="flex items-center gap-4">
                      <Icon className="h-4 w-4 shrink-0 text-[#315D8A]" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] text-[#161616]">{entry.title}</div>
                        <div className="mt-0.5 text-[12px] leading-relaxed text-[#6B6B66]">{entry.description}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#6B6B66] opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </section>

          <Card className="border border-[#D8D2C4] bg-white p-4">
            <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">Session</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="text-[13px] text-[#5C5C5C]">
                Signed in via magic link. Sign out revokes this browser's token.
              </div>
              <Button
                variant="ghost"
                className="text-[#8E3B34] hover:bg-[#FBEDEC] hover:text-[#8E3B34]"
                onClick={async () => {
                  await apiPost("/auth/logout", {}).catch(() => undefined);
                  clearToken();
                  navigate("/sign-in");
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
