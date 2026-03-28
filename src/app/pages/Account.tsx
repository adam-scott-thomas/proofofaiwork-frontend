import { useNavigate } from "react-router";
import { User, Bell, Shield, Key, Database, Trash2, LogOut } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Switch } from "../components/ui/switch";
import { useCurrentUser } from "../../hooks/useApi";
import { useAuthStore } from "../../stores/authStore";

export default function Account() {
  const navigate = useNavigate();
  const { clearToken } = useAuthStore();
  const { data: user, isLoading } = useCurrentUser();

  const name = user?.name ?? "";
  const handle = user?.handle ?? "";
  const email = user?.email ?? "";
  const bio = user?.bio ?? "";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="px-8 py-6">
          <h1 className="text-xl tracking-tight">Account Settings</h1>
          <p className="mt-1 text-[13px] text-[#717182]">
            Manage your profile, integrations, and preferences
          </p>
        </div>
      </header>

      <div className="p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Profile */}
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <User className="h-5 w-5 text-[#717182]" />
              <h2 className="text-[15px]">Profile</h2>
            </div>
            {isLoading ? (
              <div className="text-[13px] text-[#717182]">Loading profile...</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={name} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="handle">Handle</Label>
                    <Input id="handle" defaultValue={handle} className="mt-1.5" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={email} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Input id="bio" defaultValue={bio} className="mt-1.5" />
                </div>
                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </div>
            )}
          </Card>

          {/* Integrations */}
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Database className="h-5 w-5 text-[#717182]" />
              <h2 className="text-[15px]">AI Platform Connections</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-1 text-[14px]">Claude (Anthropic)</div>
                  <div className="text-[13px] text-[#717182]">Import conversations from Claude.ai</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    Connected
                  </Badge>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-1 text-[14px]">ChatGPT (OpenAI)</div>
                  <div className="text-[13px] text-[#717182]">Import conversations from ChatGPT</div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-1 text-[14px]">GitHub</div>
                  <div className="text-[13px] text-[#717182]">Attach repositories for commit correlation</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    Connected
                  </Badge>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>
            </div>
          </Card>

          {/* API Keys */}
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-[#717182]" />
                <h2 className="text-[15px]">API Keys</h2>
              </div>
              <Button variant="outline" size="sm">Generate New Key</Button>
            </div>
            <div className="space-y-3">
              {user?.api_keys?.length > 0 ? (
                user.api_keys.map((key: any) => (
                  <div key={key.id} className="flex items-center justify-between rounded-md border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] p-4">
                    <div>
                      <div className="mb-1 font-mono text-[13px]">{key.masked ?? `poaw_live_••••••••••••${key.suffix}`}</div>
                      <div className="text-[12px] text-[#717182]">
                        Created {new Date(key.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {key.last_used && ` • Last used ${key.last_used}`}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between rounded-md border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] p-4">
                  <div className="text-[13px] text-[#717182]">No API keys generated yet.</div>
                </div>
              )}
            </div>
          </Card>

          {/* Notifications */}
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Bell className="h-5 w-5 text-[#717182]" />
              <h2 className="text-[15px]">Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-1 text-[14px]">Assessment Complete</div>
                  <div className="text-[13px] text-[#717182]">Notify when project assessments finish</div>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-1 text-[14px]">Weekly Summary</div>
                  <div className="text-[13px] text-[#717182]">Receive weekly work profile reports</div>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-1 text-[14px]">Proof Page Views</div>
                  <div className="text-[13px] text-[#717182]">Notify when someone views your proof pages</div>
                </div>
                <Switch />
              </div>
            </div>
          </Card>

          {/* Privacy */}
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-[#717182]" />
              <h2 className="text-[15px]">Privacy & Data</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-1 text-[14px]">Default Proof Page Visibility</div>
                  <div className="text-[13px] text-[#717182]">Set default visibility for new proof pages</div>
                </div>
                <Button variant="outline" size="sm">Private</Button>
              </div>
              <Separator />
              <div>
                <Button variant="outline" size="sm">Export All Data</Button>
                <p className="mt-2 text-[12px] text-[#717182]">
                  Download all your conversations, assessments, and proof pages
                </p>
              </div>
            </div>
          </Card>

          {/* Sign Out */}
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5 text-[#717182]" />
                <div>
                  <h2 className="text-[15px]">Sign Out</h2>
                  <p className="text-[13px] text-[#717182]">End your current session</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  clearToken();
                  navigate("/");
                }}
              >
                Sign Out
              </Button>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-red-700" />
              <h2 className="text-[15px] text-red-900">Danger Zone</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-1 text-[14px] text-red-900">Delete Account</div>
                  <div className="text-[13px] text-red-800">
                    Permanently delete your account and all associated data
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                  Delete Account
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
