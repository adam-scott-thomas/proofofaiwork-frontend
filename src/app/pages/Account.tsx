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
    email: "",
    bio: "",
  });

  // Populate form once user data arrives
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name ?? user.full_name ?? "",
        handle: user.handle ?? user.username ?? "",
        email: user.email ?? "",
        bio: user.bio ?? "",
      });
    }
  }, [user]);

  const handleSave = () => {
    updateProfile.mutate(formData, {
      onSuccess: () => {
        toast.success("Profile saved successfully");
      },
      onError: () => {
        toast.error("Failed to save profile");
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
                  Integrations, API keys, privacy controls, and destructive account actions are hidden until the backend is ready.
                  This page only exposes editable profile fields right now.
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
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="handle">Handle</Label>
                      <Input
                        id="handle"
                        value={formData.handle}
                        onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={updateProfile.isPending}>
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
