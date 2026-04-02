import { KeyRound, Mail, Settings as SettingsIcon, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createActorWithConfig } from "../config";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user, login } = useAuth();

  // Update password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Update email state
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setPasswordLoading(true);
    try {
      const actor = await createActorWithConfig();
      const res = await (actor as any).updatePassword(
        user!.email,
        currentPassword,
        newPassword,
      );
      if (res.ok) {
        login(user!.email, newPassword, user!.role);
        toast.success("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update password. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !emailPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    setEmailLoading(true);
    try {
      const actor = await createActorWithConfig();
      const res = await (actor as any).updateEmail(
        user!.email,
        emailPassword,
        newEmail,
      );
      if (res.ok) {
        login(newEmail, user!.password, user!.role);
        toast.success("Email updated successfully.");
        setNewEmail("");
        setEmailPassword("");
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update email. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
        <SettingsIcon className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold tracking-widest uppercase text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground text-xs tracking-wider">
            Application configuration
          </p>
        </div>
      </div>

      <div className="space-y-6 max-w-lg">
        {/* Account Info */}
        <div className="bg-card border border-border border-t-2 border-t-primary p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Account
            </h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Email
              </p>
              <p className="text-sm text-foreground font-semibold">
                {user?.email ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Role
              </p>
              <p className="text-sm font-bold uppercase tracking-wider text-primary">
                {user?.role ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Update Email */}
        <div className="bg-card border border-border border-t-2 border-t-primary p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Update Email
            </h2>
          </div>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div>
              <label
                htmlFor="settings-new-email"
                className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
              >
                New Email
              </label>
              <input
                id="settings-new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full bg-input text-foreground px-3 py-2 text-sm border border-border focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                placeholder="new@email.com"
              />
            </div>
            <div>
              <label
                htmlFor="settings-email-password"
                className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
              >
                Current Password
              </label>
              <input
                id="settings-email-password"
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                required
                className="w-full bg-input text-foreground px-3 py-2 text-sm border border-border focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={emailLoading}
              className="w-full bg-primary hover:bg-accent text-primary-foreground py-2 text-xs font-bold tracking-widest uppercase transition-colors disabled:opacity-50"
            >
              {emailLoading ? "UPDATING..." : "UPDATE EMAIL"}
            </button>
          </form>
        </div>

        {/* Update Password */}
        <div className="bg-card border border-border border-t-2 border-t-primary p-6">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Update Password
            </h2>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label
                htmlFor="settings-current-password"
                className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
              >
                Current Password
              </label>
              <input
                id="settings-current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-input text-foreground px-3 py-2 text-sm border border-border focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="settings-new-password"
                className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
              >
                New Password
              </label>
              <input
                id="settings-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full bg-input text-foreground px-3 py-2 text-sm border border-border focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="settings-confirm-password"
                className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
              >
                Confirm New Password
              </label>
              <input
                id="settings-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-input text-foreground px-3 py-2 text-sm border border-border focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full bg-primary hover:bg-accent text-primary-foreground py-2 text-xs font-bold tracking-widest uppercase transition-colors disabled:opacity-50"
            >
              {passwordLoading ? "UPDATING..." : "UPDATE PASSWORD"}
            </button>
          </form>
        </div>
      </div>

      <footer className="mt-12 text-xs text-muted-foreground/50">
        Built by{" "}
        <a
          href="https://discord.com/users/1450518023789088810"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-accent transition-colors cursor-pointer"
        >
          @Itz_Vion
        </a>
      </footer>
    </div>
  );
}
