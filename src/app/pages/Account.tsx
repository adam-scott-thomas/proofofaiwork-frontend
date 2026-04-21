import { User, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useCurrentUser, useUpdateProfile } from "../../hooks/useApi";

export default function Account() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();

  const [formData, setFormData] = useState({
    name: "",
    handle: "",
  });

  // Populate form once user data arrives
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name ?? "",
        handle: user.handle ?? "",
      });
    }
  }, [user]);

  const handleLocked = Boolean(user?.handle_locked);
  const handleChangesRemaining = Number(user?.handle_changes_remaining ?? 1);
  const normalizedHandle = formData.handle.trim().toLowerCase().replace(/^@/, "");

  const handleSave = () => {
    updateProfile.mutate({
      name: formData.name,
      handle: normalizedHandle,
    }, {
      onSuccess: () => {
        toast.success("Profile saved successfully");
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to save profile");
      },
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="px-8 py-6">
          <h1 className="text-xl tracking-tight">Account Settings</h1>
          <p className="mt-1 text-[13px] text-[#717182]">
            Manage the parts of your account that are actually live
          </p>
        </div>
      </header>

      <div className="p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card className="border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
              <div>
                <h2 className="text-[15px] text-amber-900">Account surface is intentionally trimmed</h2>
                <p className="mt-1 text-[13px] text-amber-800">
                  Screen names are assigned automatically. You get one rename, then the handle locks and becomes your public identity across proof pages.
                </p>
              </div>
            </div>
          </Card>

          {/* Profile */}
          <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <User className="h-5 w-5 text-[#717182]" />
              <h2 className="text-[15px]">Profile</h2>
            </div>
            <div className="space-y-4">
              {userLoading ? (
                <div className="text-[13px] text-[#717182]">Loading profile...</div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="handle">Screen name</Label>
                        <span className="text-[11px] uppercase tracking-[0.08em] text-[#717182]">
                          {handleLocked ? "Locked" : `${handleChangesRemaining} change left`}
                        </span>
                      </div>
                      <Input
                        id="handle"
                        value={formData.handle}
                        onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                        disabled={handleLocked}
                        className="mt-1.5"
                      />
                      <p className="mt-1.5 text-[12px] leading-relaxed text-[#717182]">
                        We assign a random screen name like <span className="text-[#161616]">signal-builder</span>. You can change it once. After that it is permanent.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#F7F4ED] p-4">
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[#717182]">Account email</div>
                    <div className="mt-1 text-[14px] text-[#161616]">{user?.email ?? "—"}</div>
                    <div className="mt-1 text-[12px] text-[#717182]">Email is controlled by magic-link sign-in and is not edited here.</div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={updateProfile.isPending || !normalizedHandle}>
                      {updateProfile.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
