import { Settings as SettingsIcon, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user } = useAuth();

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

      <div className="bg-card border border-border border-t-2 border-t-primary p-6 max-w-lg">
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
