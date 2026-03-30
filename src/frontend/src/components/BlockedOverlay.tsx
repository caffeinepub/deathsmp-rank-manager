import { Skull } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function BlockedOverlay() {
  const { user, logout } = useAuth();

  if (!user || user.role === "admin" || user.role === "superAdmin") return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background:
          "radial-gradient(ellipse at center, #1a0000 0%, #0d0d0d 70%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Skull className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-bold text-foreground tracking-[0.2em] uppercase">
            DeathSMP
          </h1>
        </div>

        <div className="bg-card border border-border border-t-2 border-t-primary p-8 mb-6">
          <div className="w-16 h-16 bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
            <Skull className="w-8 h-8 text-primary" />
          </div>

          <h2 className="text-foreground text-lg font-bold tracking-widest uppercase mb-4">
            Please ask Owner <span className="text-primary">Itz_Vion</span> for
            Access
          </h2>

          <div className="bg-secondary/50 border border-border p-4 mb-6">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
              Your Email
            </p>
            <p className="text-foreground font-mono text-sm break-all">
              {user.email}
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-2 italic">
              Please give this email to Owner if he asks you for it
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full bg-secondary hover:bg-secondary/70 text-muted-foreground hover:text-foreground py-2.5 text-xs font-bold tracking-widest uppercase transition-colors border border-border"
          >
            LOGOUT
          </button>
        </div>
      </div>
    </div>
  );
}
