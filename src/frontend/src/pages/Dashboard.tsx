import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Clock,
  Crown,
  Plus,
  Skull,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Member, Rank } from "../backend.d";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import { useBackend } from "../hooks/useBackend";

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

function calcTimeLeft(renewalMs: bigint): string {
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

function isToday(ms: bigint): boolean {
  const d = new Date(Number(ms));
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

// Animated countdown that ticks every minute
function LiveCountdown({ renewalMs }: { renewalMs: bigint }) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(renewalMs));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft(renewalMs));
    }, 60000);
    return () => clearInterval(interval);
  }, [renewalMs]);

  return (
    <span
      className={`font-bold ${
        timeLeft === "EXPIRED" ? "text-destructive" : "text-primary"
      }`}
    >
      {timeLeft}
    </span>
  );
}

export default function Dashboard() {
  const { actor } = useBackend();
  const { user } = useAuth();
  const { formatDate } = usePreferences();
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

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const expiredCount = allMembers.filter(
    (m) => Number(m.renewalDate) < now,
  ).length;
  const expiringWeekCount = allMembers.filter((m) => {
    const r = Number(m.renewalDate);
    return r >= now && r - now <= sevenDaysMs;
  }).length;

  // Members expiring today
  const expiringToday = allMembers.filter((m) => isToday(m.renewalDate));

  // Top ranks by member count
  const rankUsage = ranks
    .map((r) => ({
      rank: r,
      count: allMembers.filter((m) => m.rankId === r.id).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxCount = rankUsage.length > 0 ? Math.max(1, rankUsage[0].count) : 1;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
        <div className="flex items-center gap-3">
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
        <Link
          to="/members"
          data-ocid="dashboard.primary_button"
          className="flex items-center gap-1.5 bg-primary hover:bg-accent text-primary-foreground px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          ADD MEMBER
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
          <div className="text-2xl font-bold text-foreground">
            {loading ? "—" : allMembers.length}
          </div>
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
          <div className="text-2xl font-bold text-foreground">
            {loading ? "—" : ranks.length}
          </div>
        </div>
        <div
          data-ocid="dashboard.card"
          className="bg-card border border-border border-t-2 border-t-primary p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Expiring This Week
            </span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {loading ? "—" : expiringWeekCount}
          </div>
        </div>
        <div
          data-ocid="dashboard.card"
          className="bg-card border border-border border-t-2 border-t-primary p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Expired
            </span>
          </div>
          <div className="text-2xl font-bold text-red-500">
            {loading ? "—" : expiredCount}
          </div>
        </div>
      </div>

      {/* Two-column layout: Top Ranks + Expires Today */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Top Ranks Widget */}
          <div className="bg-card border border-border border-t-2 border-t-primary">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Crown className="w-3.5 h-3.5 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">
                Top Ranks
              </h2>
            </div>
            {rankUsage.length === 0 ? (
              <div
                data-ocid="dashboard.empty_state"
                className="p-6 text-center text-muted-foreground text-[10px] uppercase tracking-widest"
              >
                No ranks yet
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {rankUsage.map(({ rank, count }, i) => (
                  <div
                    key={rank.id.toString()}
                    data-ocid={`dashboard.item.${i + 1}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-wider text-foreground font-bold">
                        {rank.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {count} member{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expires Today */}
          {expiringToday.length > 0 ? (
            <div className="bg-red-950/20 border border-red-600/40 border-t-2 border-t-red-600">
              <div className="px-4 py-3 border-b border-red-600/30 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-red-400" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-red-400">
                  ⚠ Expires Today — {expiringToday.length}
                </h2>
              </div>
              <div className="divide-y divide-red-600/20">
                {expiringToday.map((m, i) => (
                  <div
                    key={m.id.toString()}
                    data-ocid={`dashboard.item.${i + 1}`}
                    className="px-4 py-3"
                  >
                    <p className="text-sm font-bold text-foreground">
                      {m.playerName}
                    </p>
                    <p className="text-[10px] text-red-400 uppercase tracking-wider">
                      @{m.discordUsername} · {getRankName(m.rankId)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border border-t-2 border-t-primary flex items-center justify-center">
              <div
                data-ocid="dashboard.empty_state"
                className="p-6 text-center text-muted-foreground text-[10px] uppercase tracking-widest"
              >
                ✔ No members expire today
              </div>
            </div>
          )}
        </div>
      )}

      {/* Important Notifications */}
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
                    <LiveCountdown renewalMs={m.renewalDate} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiring table */}
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
