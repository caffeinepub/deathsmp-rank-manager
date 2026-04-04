import { DollarSign, Loader2 } from "lucide-react";
import { useState } from "react";
import type { Member } from "../backend.d";

interface PaidModalProps {
  member: Member | null;
  onConfirm: (months: number) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

export default function PaidModal({
  member,
  onConfirm,
  onClose,
  isLoading,
}: PaidModalProps) {
  const [months, setMonths] = useState("1");

  if (!member) return null;

  const handleConfirm = async () => {
    const m = Number.parseInt(months);
    if (Number.isNaN(m) || m < 1) return;
    await onConfirm(m);
    setMonths("1");
  };

  const handleClose = () => {
    setMonths("1");
    onClose();
  };

  return (
    <div
      data-ocid="paid.dialog"
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-card border border-border border-t-2 border-t-green-500 w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-green-400">
              PAID —{" "}
              <span className="text-foreground">{member.playerName}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            data-ocid="paid.close_button"
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="bg-green-950/20 border border-green-600/30 px-3 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">
              Member
            </p>
            <p className="text-xs font-bold text-foreground">
              {member.playerName}
            </p>
            <p className="text-[10px] text-muted-foreground">
              @{member.discordUsername}
            </p>
          </div>

          <div>
            <label
              htmlFor="paid-months"
              className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
            >
              Extend by how many months?
            </label>
            <input
              id="paid-months"
              type="number"
              min="1"
              max="24"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              data-ocid="paid.input"
              className="w-full bg-input text-foreground px-3 py-2 text-xs border border-border focus:border-green-500 focus:outline-none"
              disabled={isLoading}
            />
            <p className="text-[10px] text-muted-foreground mt-1 tracking-wide">
              Renewal date will extend from the current expiry date.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading || !months || Number.parseInt(months) < 1}
              data-ocid="paid.confirm_button"
              className="flex-1 bg-green-700 hover:bg-green-600 text-white py-2 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isLoading ? "SAVING..." : "CONFIRM"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              data-ocid="paid.cancel_button"
              className="flex-1 bg-secondary hover:bg-muted text-foreground py-2 text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
