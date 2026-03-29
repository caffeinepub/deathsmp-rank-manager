import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Skull } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useBackend } from "../hooks/useBackend";

export default function Login() {
  const { login } = useAuth();
  const { actor } = useBackend();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) {
      toast.error("Backend not ready. Try again.");
      return;
    }
    setLoading(true);
    try {
      const res = await actor.loginUser(email, password);
      if (res.ok) {
        login(email, password, res.role);
        navigate({ to: "/" });
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Login failed. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-4"
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

        <div className="bg-card border border-border border-t-2 border-t-primary p-6">
          <h2 className="text-foreground text-sm font-bold tracking-widest uppercase mb-6">
            Admin Login
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-ocid="login.input"
                className="w-full bg-input text-foreground px-3 py-2 text-sm border border-border focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                placeholder="admin@deathsmp.net"
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-ocid="login.input"
                className="w-full bg-input text-foreground px-3 py-2 text-sm border border-border focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              data-ocid="login.submit_button"
              className="w-full bg-primary hover:bg-accent text-primary-foreground py-2.5 text-sm font-bold tracking-widest uppercase transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link
              to="/register"
              data-ocid="login.link"
              className="text-[11px] text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
            >
              No account? Register
            </Link>
          </div>
        </div>

        <footer className="text-center mt-8 text-[10px] text-muted-foreground/50">
          &copy; {new Date().getFullYear()}. Built with &#10084; using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="hover:text-primary transition-colors"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
