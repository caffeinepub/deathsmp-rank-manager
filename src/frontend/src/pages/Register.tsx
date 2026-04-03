import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Skull } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createActorWithConfig } from "../config";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const actor = await createActorWithConfig();
      const res = await (actor as any).registerUser(email, password);
      if (res.ok) {
        login(email, password, res.role);
        toast.success("Account created!");
        navigate({ to: "/" });
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at center, #1a0000 0%, #0d0d0d 70%)",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Skull className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground tracking-[0.2em] uppercase">
              DeathSMP
            </h1>
          </div>
          <p className="text-muted-foreground text-xs tracking-[0.3em] uppercase">
            Rank Management System
          </p>
        </div>

        <div className="bg-card border border-border border-t-2 border-t-primary p-6 w-full">
          <h2 className="text-foreground text-sm font-bold tracking-widest uppercase mb-6">
            Create Account
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="reg-email"
                className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
              >
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-ocid="register.input"
                className="w-full bg-input text-foreground px-3 py-2 text-sm border border-border focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label
                htmlFor="reg-password"
                className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
              >
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-ocid="register.input"
                className="w-full bg-input text-foreground px-3 py-2 text-sm border border-border focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="reg-confirm"
                className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
              >
                Confirm Password
              </label>
              <input
                id="reg-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                data-ocid="register.input"
                className="w-full bg-input text-foreground px-3 py-2 text-sm border border-border focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              data-ocid="register.submit_button"
              className="w-full bg-primary hover:bg-accent text-primary-foreground py-2.5 text-sm font-bold tracking-widest uppercase transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "CREATING..." : "SIGN UP"}
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link
              to="/login"
              data-ocid="register.link"
              className="text-[11px] text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
            >
              Already have an account? Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
