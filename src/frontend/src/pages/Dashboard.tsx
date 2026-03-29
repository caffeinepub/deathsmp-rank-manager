import { Link } from "@tanstack/react-router";
import { AlertTriangle, Clock, Crown, Skull, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { Member, Rank } from "../backend.d";
import { useAuth } from "../context/AuthContext";
import { useBackend } from "../hooks/useBackend";

function formatDate(ms: bigint) {
  const d = new Date(Number(ms));
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function daysLeft(renewalMs: bigint) {
  const now = Date.now();
  const diff = Number(renewalMs) - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getISTMidnight(renewalMs: bigint): Date {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(Number(renewalMs) + istOffset);
  istDate.setUTCHours(0, 0, 0, 0);
  return new Date(istDate.getTime() - istOffset);
}

function formatTimeLeft(renewalMs: bigint): string {
  const midnight = getISTMidnight(renewalMs);
  const diff = midnight.getTime() - Date.now();
  if (diff <= 0) return "EXPIRED";
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export default function Dashboard() {
  const { actor } = useBackend();
  const { user } = useAuth();
  const [expiring, setExpiring] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor || !user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [exp, members, ranklist] = await Promise.all([
          actor.getExpiringMembers(BigInt(2)),
          actor.getMembers(),
          actor.getRanks(),
        ]);
        setExpiring(exp);
        setAllMembers(members);
        setRanks(ranklist);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [actor, user]);

  const getRankName = (id: bigint) =>
    ranks.find((r) => r.id === id)?.name ?? "—";

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
        <Skull className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold tracking-widest uppercase text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-xs tracking-wider">
            DeathSMP Rank Overview
          </p>
        </div>
      </div>

      {expiring.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">
              ⚠ Important Notifications — {expiring.length} member(s) expiring
              within 2 days
            </h2>
          </div>
          <div className="space-y-3">
            {expiring.map((m, i) => (
              <div
                key={m.id.toString()}
                data-ocid={`dashboard.item.${i + 1}`}
                className="bg-primary/10 border border-primary/40 border-l-4 border-l-primary p-4"
              >
                <div className="space-y-1 text-xs">
                  <p className="text-foreground">
                    <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
                      Discord id:
                    </span>{" "}
                    <span className="text-primary font-bold">
                      @{m.discordUsername}
                    </span>
                  </p>
                  <p className="text-foreground">
                    <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
                      Minecraft Username:
                    </span>{" "}
                    <span className="font-semibold">{m.playerName}</span>
                  </p>
                  <p className="text-foreground">
                    <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
                      Expiry Date:
                    </span>{" "}
                    <span className="font-semibold">
                      {formatDate(m.renewalDate)}
                    </span>
                  </p>
                  <p className="text-foreground">
                    <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
                      Time left:
                    </span>{" "}
                    <span
                      className={`font-bold ${formatTimeLeft(m.renewalDate) === "EXPIRED" ? "text-destructive" : "text-primary"}`}
                    >
                      {formatTimeLeft(m.renewalDate)}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div
          data-ocid="dashboard.card"
          className="bg-card border border-border border-t-2 border-t-primary p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Total Members
            </span>
          </div>
          {loading ? (
            <div
              data-ocid="dashboard.loading_state"
              className="text-2xl font-bold text-foreground"
            >
              —
            </div>
          ) : (
            <div className="text-2xl font-bold text-foreground">
              {allMembers.length}
            </div>
          )}
        </div>
        <div
          data-ocid="dashboard.card"
          className="bg-card border border-border border-t-2 border-t-primary p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Expiring Soon (2 days)
            </span>
          </div>
          {loading ? (
            <div className="text-2xl font-bold text-foreground">—</div>
          ) : (
            <div className="text-2xl font-bold text-primary">
              {expiring.length}
            </div>
          )}
        </div>
        <div
          data-ocid="dashboard.card"
          className="bg-card border border-border border-t-2 border-t-primary p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Active Ranks
            </span>
          </div>
          {loading ? (
            <div className="text-2xl font-bold text-foreground">—</div>
          ) : (
            <div className="text-2xl font-bold text-foreground">
              {ranks.length}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border border-t-2 border-t-primary">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">
            Expiring Within 2 Days
          </h2>
          <Link
            to="/members"
            data-ocid="dashboard.link"
            className="text-[10px] text-primary hover:text-accent uppercase tracking-wider transition-colors"
          >
            VIEW ALL →
          </Link>
        </div>
        {loading ? (
          <div
            data-ocid="dashboard.loading_state"
            className="p-8 text-center text-muted-foreground text-xs tracking-wider"
          >
            LOADING...
          </div>
        ) : expiring.length === 0 ? (
          <div
            data-ocid="dashboard.empty_state"
            className="p-8 text-center text-muted-foreground text-xs tracking-wider"
          >
            NO MEMBERS EXPIRING SOON ✓
          </div>
        ) : (
          <div className="divide-y divide-border">
            {expiring.map((m, i) => {
              const days = daysLeft(m.renewalDate);
              return (
                <div
                  key={m.id.toString()}
                  data-ocid={`dashboard.row.${i + 1}`}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-foreground font-bold">
                      {m.playerName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {m.discordUsername} · {getRankName(m.rankId)}
                    </p>
                  </div>
                  <div
                    className={`text-xs font-bold px-2 py-1 border ${
                      days <= 1
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-primary/10 border-primary/50 text-primary"
                    }`}
                  >
                    {days <= 0 ? "EXPIRED" : `${days}D LEFT`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
