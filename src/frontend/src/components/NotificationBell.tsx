import { Bell, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Member, Rank } from "../backend.d";
import { usePreferences } from "../context/PreferencesContext";
import { useBackend } from "../hooks/useBackend";

const STORAGE_KEY = "deathsmp_notifications_read";

function formatTimeLeft(renewalMs: bigint): string {
  const now = Date.now();
  const diff = Number(renewalMs) - now;
  if (diff <= 0) return "EXPIRED";
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function getNotifKey(m: Member) {
  return `${m.id.toString()}_${m.renewalDate.toString()}`;
}

function getReadKeys(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveReadKeys(keys: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

interface NotificationBellInnerProps {
  members: Member[];
  ranks: Rank[];
}

function NotificationBellInner({ members, ranks }: NotificationBellInnerProps) {
  const [open, setOpen] = useState(false);
  const [readKeys, setReadKeys] = useState<string[]>(getReadKeys);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { formatDate } = usePreferences();

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const notifications = members.filter((m) => {
    const renewal = Number(m.renewalDate);
    return renewal < now || renewal - now <= sevenDaysMs;
  });

  const unreadCount = notifications.filter(
    (m) => !readKeys.includes(getNotifKey(m)),
  ).length;

  const getRankName = (id: bigint) =>
    ranks.find((r) => r.id === id)?.name ?? "—";

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const markAllRead = () => {
    const keys = notifications.map(getNotifKey);
    saveReadKeys(keys);
    setReadKeys(keys);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-ocid="nav.button"
        aria-label="Notifications"
        className="relative flex items-center gap-2 w-full text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
      >
        <Bell className="w-3 h-3" />
        ALERTS
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 left-2 min-w-[14px] h-[14px] bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          data-ocid="nav.popover"
          className="absolute bottom-8 left-0 w-80 bg-card border border-border border-t-2 border-t-primary shadow-2xl z-50"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
              ALERTS — {notifications.length} member
              {notifications.length !== 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              data-ocid="nav.close_button"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div
              data-ocid="nav.empty_state"
              className="p-6 text-center text-muted-foreground text-[10px] uppercase tracking-widest"
            >
              No expiry alerts ✓
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-border">
              {notifications.map((m) => {
                const isRead = readKeys.includes(getNotifKey(m));
                const timeLeft = formatTimeLeft(m.renewalDate);
                const isExpired = timeLeft === "EXPIRED";
                return (
                  <div
                    key={m.id.toString()}
                    className={`p-3 text-[10px] space-y-0.5 ${
                      isRead ? "opacity-50" : ""
                    } ${
                      isExpired
                        ? "border-l-2 border-l-red-500"
                        : "border-l-2 border-l-yellow-400"
                    }`}
                  >
                    <p>
                      <span className="text-muted-foreground uppercase tracking-wider">
                        Discord id:{" "}
                      </span>
                      <span className="text-primary font-bold">
                        @{m.discordUsername}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground uppercase tracking-wider">
                        Minecraft:{" "}
                      </span>
                      <span className="text-foreground font-semibold">
                        {m.playerName}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground uppercase tracking-wider">
                        Rank:{" "}
                      </span>
                      <span className="text-foreground">
                        {getRankName(m.rankId)}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground uppercase tracking-wider">
                        Expiry:{" "}
                      </span>
                      <span className="text-foreground">
                        {formatDate(m.renewalDate)}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground uppercase tracking-wider">
                        Time left:{" "}
                      </span>
                      <span
                        className={`font-bold ${
                          isExpired ? "text-red-400" : "text-yellow-400"
                        }`}
                      >
                        {timeLeft}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {notifications.length > 0 && (
            <div className="px-3 py-2 border-t border-border">
              <button
                type="button"
                onClick={markAllRead}
                data-ocid="nav.button"
                className="text-[10px] text-muted-foreground hover:text-primary uppercase tracking-wider transition-colors w-full text-left"
              >
                ✓ MARK ALL AS READ
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NotificationBell() {
  const { actor } = useBackend();
  const [members, setMembers] = useState<Member[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);

  useEffect(() => {
    if (!actor) return;
    Promise.all([actor.getMembers(), actor.getRanks()]).then(([m, r]) => {
      setMembers(m);
      setRanks(r);
    });
    const interval = setInterval(async () => {
      if (!actor) return;
      const [m, r] = await Promise.all([actor.getMembers(), actor.getRanks()]);
      setMembers(m);
      setRanks(r);
    }, 60000);
    return () => clearInterval(interval);
  }, [actor]);

  return <NotificationBellInner members={members} ranks={ranks} />;
}
