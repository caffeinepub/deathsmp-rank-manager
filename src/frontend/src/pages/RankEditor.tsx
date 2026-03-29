import { Crown, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Rank } from "../backend.d";
import { useAuth } from "../context/AuthContext";
import { useBackend } from "../hooks/useBackend";

export default function RankEditor() {
  const { actor } = useBackend();
  const { user } = useAuth();
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRank, setEditRank] = useState<Rank | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      setRanks(await actor.getRanks());
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditRank(null);
    setName("");
    setPrice("");
    setModalOpen(true);
  };
  const openEdit = (r: Rank) => {
    setEditRank(r);
    setName(r.name);
    setPrice(Number(r.priceINR).toString());
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !user) return;
    setSaving(true);
    try {
      const priceINR = BigInt(Number(price));
      if (editRank) {
        const res = await actor.updateRank(
          user.email,
          user.password,
          editRank.id,
          name,
          priceINR,
        );
        if (res.ok) {
          toast.success("Rank updated.");
          setModalOpen(false);
          load();
        } else toast.error(res.message);
      } else {
        const res = await actor.addRank(
          user.email,
          user.password,
          name,
          priceINR,
        );
        if (res.ok) {
          toast.success("Rank added.");
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
      const res = await actor.deleteRank(user.email, user.password, id);
      if (res.ok) {
        toast.success("Rank deleted.");
        load();
      } else toast.error(res.message);
    } catch {
      toast.error("Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Crown className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold tracking-widest uppercase text-foreground">
              Rank Editor
            </h1>
            <p className="text-muted-foreground text-xs tracking-wider">
              Manage rank tiers and pricing
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openAdd}
          data-ocid="ranks.primary_button"
          className="flex items-center gap-2 bg-primary hover:bg-accent text-primary-foreground px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          <Plus className="w-4 h-4" /> ADD RANK
        </button>
      </div>

      {loading ? (
        <div
          data-ocid="ranks.loading_state"
          className="flex items-center justify-center h-40 text-muted-foreground text-xs tracking-wider"
        >
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          LOADING...
        </div>
      ) : ranks.length === 0 ? (
        <div
          data-ocid="ranks.empty_state"
          className="bg-card border border-border p-12 text-center"
        >
          <Crown className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-xs tracking-widest uppercase">
            No ranks yet. Create your first rank.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {ranks.map((r, i) => (
            <div
              key={r.id.toString()}
              data-ocid={`ranks.item.${i + 1}`}
              className="bg-card border border-border border-l-2 border-l-primary flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-4">
                <Crown className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-bold text-foreground uppercase tracking-wider">
                    {r.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ₹{Number(r.priceINR)} / month
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => openEdit(r)}
                  data-ocid={`ranks.edit_button.${i + 1}`}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-xs uppercase tracking-wider"
                >
                  <Pencil className="w-3.5 h-3.5" /> EDIT
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(r.id)}
                  data-ocid={`ranks.delete_button.${i + 1}`}
                  disabled={deletingId === r.id}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-xs uppercase tracking-wider disabled:opacity-40"
                >
                  {deletingId === r.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  DELETE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          data-ocid="ranks.modal"
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-card border border-border border-t-2 border-t-primary w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest">
                {editRank ? "EDIT RANK" : "ADD RANK"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                data-ocid="ranks.close_button"
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label
                  htmlFor="rank-name"
                  className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
                >
                  Rank Name
                </label>
                <input
                  id="rank-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  data-ocid="ranks.input"
                  className="w-full bg-input text-foreground px-3 py-2 text-xs border border-border focus:border-primary focus:outline-none"
                  placeholder="e.g. VIP, ELITE, GOD"
                />
              </div>
              <div>
                <label
                  htmlFor="rank-price"
                  className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
                >
                  Price (₹ / month)
                </label>
                <input
                  id="rank-price"
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  data-ocid="ranks.input"
                  className="w-full bg-input text-foreground px-3 py-2 text-xs border border-border focus:border-primary focus:outline-none"
                  placeholder="e.g. 199"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  data-ocid="ranks.submit_button"
                  className="flex-1 bg-primary hover:bg-accent text-primary-foreground py-2 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {saving ? "SAVING..." : "SAVE"}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  data-ocid="ranks.cancel_button"
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
