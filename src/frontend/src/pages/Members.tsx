import { Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Member, Rank } from "../backend.d";
import { useAuth } from "../context/AuthContext";
import { useBackend } from "../hooks/useBackend";

function formatDate(ms: bigint) {
  const d = new Date(Number(ms));
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function daysLeft(renewalMs: bigint) {
  return Math.ceil((Number(renewalMs) - Date.now()) / (1000 * 60 * 60 * 24));
}

interface MemberForm {
  playerName: string;
  discordUsername: string;
  rankId: string;
  purchaseDate: string;
  monthsPaid: string;
  notes: string;
}

const emptyForm: MemberForm = {
  playerName: "",
  discordUsername: "",
  rankId: "",
  purchaseDate: "",
  monthsPaid: "1",
  notes: "",
};

export default function Members() {
  const { actor } = useBackend();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<bigint | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [m, r] = await Promise.all([actor.getMembers(), actor.getRanks()]);
      setMembers(m);
      setRanks(r);
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };
  const openEdit = (m: Member) => {
    setEditId(m.id);
    const d = new Date(Number(m.purchaseDate));
    setForm({
      playerName: m.playerName,
      discordUsername: m.discordUsername,
      rankId: m.rankId.toString(),
      purchaseDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      monthsPaid: m.monthsPaidInAdvance.toString(),
      notes: m.notes,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !user) return;
    setSaving(true);
    try {
      const purchaseTs = BigInt(new Date(form.purchaseDate).getTime());
      const months = BigInt(Number(form.monthsPaid) || 1);
      const rankId = BigInt(form.rankId);
      if (editId !== null) {
        const res = await actor.updateMember(
          user.email,
          user.password,
          editId,
          form.playerName,
          form.discordUsername,
          rankId,
          purchaseTs,
          months,
          form.notes,
        );
        if (res.ok) {
          toast.success("Member updated.");
          setModalOpen(false);
          load();
        } else toast.error(res.message);
      } else {
        const res = await actor.addMember(
          user.email,
          user.password,
          form.playerName,
          form.discordUsername,
          rankId,
          purchaseTs,
          months,
          form.notes,
        );
        if (res.ok) {
          toast.success("Member added.");
          setModalOpen(false);
          load();
        } else toast.error(res.message);
      }
    } catch {
      toast.error("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!actor || !user) return;
    setDeletingId(id);
    try {
      const res = await actor.deleteMember(user.email, user.password, id);
      if (res.ok) {
        toast.success("Member removed.");
        load();
      } else toast.error(res.message);
    } catch {
      toast.error("Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const getRankName = (id: bigint) =>
    ranks.find((r) => r.id === id)?.name ?? "—";
  const getRankPrice = (id: bigint) =>
    ranks.find((r) => r.id === id)?.priceINR ?? BigInt(0);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold tracking-widest uppercase text-foreground">
              Members
            </h1>
            <p className="text-muted-foreground text-xs tracking-wider">
              Rank Subscriptions
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openAdd}
          data-ocid="members.primary_button"
          className="flex items-center gap-2 bg-primary hover:bg-accent text-primary-foreground px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          <Plus className="w-4 h-4" /> ADD MEMBER
        </button>
      </div>

      {loading ? (
        <div
          data-ocid="members.loading_state"
          className="flex items-center justify-center h-40 text-muted-foreground text-xs tracking-wider"
        >
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          LOADING...
        </div>
      ) : members.length === 0 ? (
        <div
          data-ocid="members.empty_state"
          className="bg-card border border-border p-12 text-center"
        >
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-xs tracking-widest uppercase">
            No members yet. Add your first member.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border border-t-2 border-t-primary overflow-x-auto">
          <table data-ocid="members.table" className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {[
                  "Player",
                  "Discord",
                  "Rank",
                  "Price/mo",
                  "Purchase Date",
                  "Renewal Date",
                  "Months Paid",
                  "Notes",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-muted-foreground uppercase tracking-widest font-normal text-[10px]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m, i) => {
                const days = daysLeft(m.renewalDate);
                const warn = days <= 7;
                return (
                  <tr
                    key={m.id.toString()}
                    data-ocid={`members.row.${i + 1}`}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-foreground font-bold">
                      {m.playerName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.discordUsername}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                        {getRankName(m.rankId)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      ₹{Number(getRankPrice(m.rankId))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(m.purchaseDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          warn
                            ? "text-primary font-bold"
                            : "text-muted-foreground"
                        }
                      >
                        {formatDate(m.renewalDate)}
                      </span>
                      {warn && (
                        <span className="ml-2 bg-primary/20 text-primary border border-primary/40 px-1.5 py-0.5 text-[9px] uppercase">
                          {days <= 0 ? "EXPIRED" : `${days}D`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {Number(m.monthsPaidInAdvance)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[120px] truncate">
                      {m.notes || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(m)}
                          data-ocid={`members.edit_button.${i + 1}`}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(m.id)}
                          data-ocid={`members.delete_button.${i + 1}`}
                          disabled={deletingId === m.id}
                          className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                        >
                          {deletingId === m.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div
          data-ocid="members.modal"
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-card border border-border border-t-2 border-t-primary w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest">
                {editId ? "EDIT MEMBER" : "ADD MEMBER"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                data-ocid="members.close_button"
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="m-player"
                    className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
                  >
                    Player Name
                  </label>
                  <input
                    id="m-player"
                    value={form.playerName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, playerName: e.target.value }))
                    }
                    required
                    data-ocid="members.input"
                    className="w-full bg-input text-foreground px-3 py-2 text-xs border border-border focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="m-discord"
                    className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
                  >
                    Discord Username
                  </label>
                  <input
                    id="m-discord"
                    value={form.discordUsername}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        discordUsername: e.target.value,
                      }))
                    }
                    required
                    data-ocid="members.input"
                    className="w-full bg-input text-foreground px-3 py-2 text-xs border border-border focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="m-rank"
                    className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
                  >
                    Rank
                  </label>
                  <select
                    id="m-rank"
                    value={form.rankId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, rankId: e.target.value }))
                    }
                    required
                    data-ocid="members.select"
                    className="w-full bg-input text-foreground px-3 py-2 text-xs border border-border focus:border-primary focus:outline-none"
                  >
                    <option value="">Select rank...</option>
                    {ranks.map((r) => (
                      <option key={r.id.toString()} value={r.id.toString()}>
                        {r.name} — ₹{Number(r.priceINR)}/mo
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="m-months"
                    className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
                  >
                    Months Paid in Advance
                  </label>
                  <input
                    id="m-months"
                    type="number"
                    min="1"
                    value={form.monthsPaid}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, monthsPaid: e.target.value }))
                    }
                    required
                    data-ocid="members.input"
                    className="w-full bg-input text-foreground px-3 py-2 text-xs border border-border focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="m-date"
                  className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
                >
                  Purchase Date
                </label>
                <input
                  id="m-date"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, purchaseDate: e.target.value }))
                  }
                  required
                  data-ocid="members.input"
                  className="w-full bg-input text-foreground px-3 py-2 text-xs border border-border focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="m-notes"
                  className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
                >
                  Notes
                </label>
                <textarea
                  id="m-notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                  data-ocid="members.textarea"
                  className="w-full bg-input text-foreground px-3 py-2 text-xs border border-border focus:border-primary focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  data-ocid="members.submit_button"
                  className="flex-1 bg-primary hover:bg-accent text-primary-foreground py-2 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {saving ? "SAVING..." : "SAVE"}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  data-ocid="members.cancel_button"
                  className="flex-1 bg-secondary hover:bg-muted text-foreground py-2 text-xs uppercase tracking-widest transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
