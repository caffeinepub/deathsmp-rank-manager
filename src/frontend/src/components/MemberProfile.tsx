import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Member, Rank } from "../backend.d";
import { usePreferences } from "../context/PreferencesContext";

function getStatus(renewalMs: bigint): "active" | "expiring" | "expired" {
  const now = Date.now();
  const renewal = Number(renewalMs);
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  if (renewal < now) return "expired";
  if (renewal - now <= twoDaysMs) return "expiring";
  return "active";
}

function formatPrice(priceINR: bigint): string {
  const val = Number(priceINR) / 100;
  return val.toFixed(2).replace(/\.?0+$/, "");
}

interface MemberProfileProps {
  member: Member | null;
  ranks: Rank[];
  open: boolean;
  onClose: () => void;
}

export default function MemberProfile({
  member,
  ranks,
  open,
  onClose,
}: MemberProfileProps) {
  const { formatDate } = usePreferences();

  const getRankName = (id: bigint) =>
    ranks.find((r) => r.id === id)?.name ?? "—";
  const getRankPrice = (id: bigint) =>
    ranks.find((r) => r.id === id)?.priceINR ?? BigInt(0);

  const status = member ? getStatus(member.renewalDate) : "active";
  const statusLabel =
    status === "expired"
      ? "EXPIRED"
      : status === "expiring"
        ? "EXPIRING SOON"
        : "ACTIVE";
  const statusClass =
    status === "expired"
      ? "bg-red-500/20 text-red-400 border border-red-500/40"
      : status === "expiring"
        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
        : "bg-green-500/20 text-green-500 border border-green-500/40";

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="bg-card border-border border-l-2 border-l-primary w-96 max-w-full p-0"
        data-ocid="members.sheet"
      >
        <SheetHeader className="px-6 py-5 border-b border-border border-t-2 border-t-primary">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-bold uppercase tracking-widest text-foreground">
              Member Profile
            </SheetTitle>
          </div>
        </SheetHeader>

        {member && (
          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Status badge */}
            <div className="flex items-center gap-3">
              <span
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${statusClass}`}
              >
                {statusLabel}
              </span>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  Player Name
                </p>
                <p className="text-sm font-bold text-foreground">
                  {member.playerName}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  Discord Username
                </p>
                <p className="text-sm text-primary font-semibold">
                  @{member.discordUsername}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  Rank
                </p>
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                    {getRankName(member.rankId)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ₹{formatPrice(getRankPrice(member.rankId))}/mo
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                    Purchase Date
                  </p>
                  <p className="text-xs text-foreground">
                    {formatDate(member.purchaseDate)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                    Renewal Date
                  </p>
                  <p
                    className={`text-xs font-bold ${
                      status === "expired"
                        ? "text-red-400"
                        : status === "expiring"
                          ? "text-yellow-400"
                          : "text-foreground"
                    }`}
                  >
                    {formatDate(member.renewalDate)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  Months Paid in Advance
                </p>
                <p className="text-xs text-foreground">
                  {Number(member.monthsPaidInAdvance)}
                </p>
              </div>

              {member.notes && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                    Notes
                  </p>
                  <p className="text-xs text-foreground bg-secondary/50 border border-border p-3 leading-relaxed">
                    {member.notes}
                  </p>
                </div>
              )}

              {!member.notes && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                    Notes
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    No notes.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
