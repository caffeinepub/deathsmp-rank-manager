import { useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserPublic } from "../backend.d";
import { useAuth } from "../context/AuthContext";
import { useBackend } from "../hooks/useBackend";

export default function AdminManager() {
  const { actor } = useBackend();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (user?.role !== "superAdmin") {
      navigate({ to: "/" });
    }
  }, [user, navigate]);

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      setUsers(await actor.listUsers());
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const setRole = async (targetEmail: string, newRole: string) => {
    if (!actor || !user) return;
    setUpdating(targetEmail);
    try {
      const res = await actor.setUserRole(
        user.email,
        user.password,
        targetEmail,
        newRole,
      );
      if (res.ok) {
        toast.success(`${targetEmail} is now ${newRole}.`);
        load();
      } else toast.error(res.message);
    } catch {
      toast.error("Update failed.");
    } finally {
      setUpdating(null);
    }
  };

  const grantAdmin = async () => {
    if (!actor || !user || !addEmail.trim()) return;
    setAdding(true);
    try {
      const res = await actor.setUserRole(
        user.email,
        user.password,
        addEmail.trim(),
        "admin",
      );
      if (res.ok) {
        toast.success(`${addEmail.trim()} has been granted admin access.`);
        setAddEmail("");
        load();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to grant admin access.");
    } finally {
      setAdding(false);
    }
  };

  const roleColor = (role: string) => {
    if (role === "superAdmin")
      return "text-primary border-primary/50 bg-primary/10";
    if (role === "admin")
      return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
    return "text-muted-foreground border-border bg-secondary";
  };

  if (user?.role !== "superAdmin") return null;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold tracking-widest uppercase text-foreground">
            Admin Manager
          </h1>
          <p className="text-muted-foreground text-xs tracking-wider">
            Manage user roles and access
          </p>
        </div>
      </div>

      {/* Grant Admin Access */}
      <div className="bg-card border border-border border-t-2 border-t-primary mb-6 p-4">
        <div className="flex items-center gap-2 mb-2">
          <UserPlus className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">
            Grant Admin Access
          </h2>
        </div>
        <p className="text-muted-foreground text-xs tracking-wider mb-4">
          Enter the email address of a registered user to grant them admin
          access.
        </p>
        <div className="flex gap-2">
          <input
            data-ocid="admins.input"
            type="email"
            placeholder="user@example.com"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && grantAdmin()}
            disabled={adding}
            className="flex-1 bg-secondary border border-border text-foreground text-xs px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-40"
          />
          <button
            type="button"
            data-ocid="admins.primary_button"
            onClick={grantAdmin}
            disabled={adding || !addEmail.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground border border-primary px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            {adding && <Loader2 className="w-3 h-3 animate-spin" />}
            GRANT ADMIN
          </button>
        </div>
      </div>

      {loading ? (
        <div
          data-ocid="admins.loading_state"
          className="flex items-center justify-center h-40 text-muted-foreground text-xs tracking-wider"
        >
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          LOADING...
        </div>
      ) : (
        <div className="bg-card border border-border border-t-2 border-t-primary">
          <table data-ocid="admins.table" className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-muted-foreground uppercase tracking-widest font-normal text-[10px]">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground uppercase tracking-widest font-normal text-[10px]">
                  Current Role
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground uppercase tracking-widest font-normal text-[10px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    data-ocid="admins.empty_state"
                    className="px-4 py-8 text-center text-muted-foreground text-xs tracking-wider uppercase"
                  >
                    No users registered yet.
                  </td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <tr
                    key={u.email}
                    data-ocid={`admins.row.${i + 1}`}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${roleColor(u.role)}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === "superAdmin" ? (
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Super Admin
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          {u.role !== "admin" && (
                            <button
                              type="button"
                              onClick={() => setRole(u.email, "admin")}
                              disabled={updating === u.email}
                              data-ocid={`admins.button.${i + 1}`}
                              className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors disabled:opacity-40 flex items-center gap-1"
                            >
                              {updating === u.email && (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              )}
                              MAKE ADMIN
                            </button>
                          )}
                          {u.role === "admin" && (
                            <button
                              type="button"
                              onClick={() => setRole(u.email, "user")}
                              disabled={updating === u.email}
                              data-ocid={`admins.button.${i + 1}`}
                              className="bg-secondary hover:bg-muted text-muted-foreground border border-border px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors disabled:opacity-40 flex items-center gap-1"
                            >
                              {updating === u.email && (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              )}
                              DEMOTE
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
