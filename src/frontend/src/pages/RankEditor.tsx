import {
  AlertTriangle,
  Archive,
  Crown,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Member, Rank } from "../backend.d";
import { useAuth } from "../context/AuthContext";
import { useBackend } from "../hooks/useBackend";

const ARCHIVED_RANKS_KEY = "deathsmp_archived_ranks";

function getArchivedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(ARCHIVED_RANKS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveArchivedIds(ids: string[]) {
  localStorage.setItem(ARCHIVED_RANKS_KEY, JSON.stringify(ids));
}

function PriceWarning({ price }: { price: bigint }) {
  const n = Number(price);
  if (n === 0) {
    return (
      <span
        title="Free rank - is this intentional?"
        className="ml-2 text-yellow-400 cursor-help"
      >
        <AlertTriangle className="w-3.5 h-3.5 inline" />
      </span>
    );
  }
  if (n > 10000) {
    return (
      <span
        title="Unusually high price"
        className="ml-2 text-orange-400 cursor-help"
      >
        <AlertTriangle className="w-3.5 h-3.5 inline" />
      </span>
    );
  }
  return null;
}

export default function RankEditor() {
  const { actor, isFetching: actorLoading } = useBackend();
  const { user } = useAuth();
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRank, setEditRank] = useState<Rank | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  // Archive state
  const [archivedIds, setArchivedIds] = useState<string[]>(getArchivedIds);
  const [showArchived, setShowArchived] = useState(false);

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<bigint | null>(null);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [r, m] = await Promise.all([actor.getRanks(), actor.getMembers()]);
      setRanks(r);
      setMembers(m);
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
    if (!actor || !user) {
      toast.error(
        actorLoading
          ? "Still connecting to backend, please wait..."
          : "Not connected. Please refresh.",
      );
      return;
    }
    const parsedPrice = Number(price);
    if (price === "" || Number.isNaN(parsedPrice)) {
      toast.error("Please enter a valid price.");
      return;
    }
    setSaving(true);
    try {
      const priceINR = BigInt(Math.round(parsedPrice));
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
    } catch (e) {
      toast.error(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: bigint) => {
    setDeleteConfirmId(id);
  };

  const handleDelete = async () => {
    if (!actor || !user || deleteConfirmId === null) return;
    setDeletingId(deleteConfirmId);
    setDeleteConfirmId(null);
    try {
      const res = await actor.deleteRank(
        user.email,
        user.password,
        deleteConfirmId,
      );
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

  // Archive (soft delete): just hide from UI via localStorage
  const handleArchive = (rankId: bigint) => {
    const idStr = rankId.toString();
    const newIds = [...archivedIds, idStr];
    saveArchivedIds(newIds);
    setArchivedIds(newIds);
    toast.success("Rank archived.", {
      action: {
        label: "Undo",
        onClick: () => {
          const restored = newIds.filter((id) => id !== idStr);
          saveArchivedIds(restored);
          setArchivedIds(restored);
          toast.success("Rank restored.");
        },
      },
      duration: 5000,
    });
  };

  const handleRestore = (rankId: bigint) => {
    const idStr = rankId.toString();
    const restored = archivedIds.filter((id) => id !== idStr);
    saveArchivedIds(restored);
    setArchivedIds(restored);
    toast.success("Rank restored.");
  };

  const getMemberCount = (rankId: bigint) =>
    members.filter((m) => m.rankId === rankId).length;

  const deleteTarget = ranks.find((r) => r.id === deleteConfirmId);
  const deleteTargetMemberCount =
    deleteConfirmId !== null ? getMemberCount(deleteConfirmId) : 0;

  // Visible ranks
  const visibleRanks = ranks.filter(
    (r) => !archivedIds.includes(r.id.toString()),
  );
  const archivedRanks = ranks.filter((r) =>
    archivedIds.includes(r.id.toString()),
  );

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
        <div className="flex items-center gap-2">
          {archivedRanks.length > 0 && (
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              data-ocid="ranks.toggle"
              className={`flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider transition-colors border ${
                showArchived
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-secondary text-foreground border-border hover:bg-muted"
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              {showArchived
                ? "HIDE ARCHIVED"
                : `SHOW ARCHIVED (${archivedRanks.length})`}
            </button>
          )}
          <button
            type="button"
            onClick={openAdd}
            data-ocid="ranks.primary_button"
            className="flex items-center gap-2 bg-primary hover:bg-accent text-primary-foreground px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <Plus className="w-4 h-4" /> ADD RANK
          </button>
        </div>
      </div>

      {loading ? (
        <div
          data-ocid="ranks.loading_state"
          className="flex items-center justify-center h-40 text-muted-foreground text-xs tracking-wider"
        >
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          LOADING...
        </div>
      ) : visibleRanks.length === 0 && archivedRanks.length === 0 ? (
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
          {/* Active ranks */}
          {visibleRanks.map((r, i) => {
            const count = getMemberCount(r.id);
            return (
              <div
                key={r.id.toString()}
                data-ocid={`ranks.item.${i + 1}`}
                className="bg-card border border-border border-l-2 border-l-primary flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-4">
                  <Crown className="w-5 h-5 text-primary" />
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-foreground uppercase tracking-wider">
                        {r.name}
                      </p>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                        <Users className="w-3 h-3" />
                        {count} member{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <p className="text-xs text-muted-foreground">
                        ₹{Number(r.priceINR)} / month
                      </p>
                      <PriceWarning price={r.priceINR} />
                    </div>
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
                    onClick={() => handleArchive(r.id)}
                    data-ocid={`ranks.secondary_button.${i + 1}`}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-yellow-400 transition-colors text-xs uppercase tracking-wider"
                    title="Archive rank (hide from UI without deleting)"
                  >
                    <Archive className="w-3.5 h-3.5" /> ARCHIVE
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmDelete(r.id)}
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
            );
          })}

          {/* Archived ranks */}
          {showArchived && archivedRanks.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-2 mb-1">
                <Archive className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Archived Ranks
                </p>
              </div>
              {archivedRanks.map((r, i) => {
                const count = getMemberCount(r.id);
                return (
                  <div
                    key={r.id.toString()}
                    data-ocid={`ranks.item.${visibleRanks.length + i + 1}`}
                    className="bg-card border border-border border-l-2 border-l-muted-foreground flex items-center justify-between px-5 py-4 opacity-50"
                  >
                    <div className="flex items-center gap-4">
                      <Crown className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                            {r.name}
                          </p>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                            <Users className="w-3 h-3" />
                            {count} member{count !== 1 ? "s" : ""}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-muted-foreground/30 px-1.5 py-0.5">
                            ARCHIVED
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ₹{Number(r.priceINR)} / month
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestore(r.id)}
                      data-ocid={`ranks.secondary_button.${visibleRanks.length + i + 1}`}
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-xs uppercase tracking-wider"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> RESTORE
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div
          data-ocid="ranks.dialog"
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-card border border-border border-t-2 border-t-primary w-full max-w-sm">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary">
                ⚠ DELETE RANK
              </h3>
            </div>
            <div className="p-5">
              <p className="text-xs text-foreground mb-2">
                Delete rank{" "}
                <span className="font-bold text-primary">
                  &apos;{deleteTarget?.name ?? ""}&apos;
                </span>
                ?
              </p>
              {deleteTargetMemberCount > 0 && (
                <div className="bg-primary/10 border border-primary/30 p-3 mb-4">
                  <p className="text-[10px] text-primary uppercase tracking-wider font-bold">
                    ⚠ {deleteTargetMemberCount} member
                    {deleteTargetMemberCount !== 1 ? "s" : ""} are using this
                    rank. They will still exist but their rank will be
                    unassigned.
                  </p>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mb-3">
                Consider archiving instead of permanently deleting.
              </p>
              <p className="text-[10px] text-muted-foreground mb-5">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  data-ocid="ranks.confirm_button"
                  className="flex-1 bg-primary hover:bg-accent text-primary-foreground py-2 text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  DELETE
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  data-ocid="ranks.cancel_button"
                  className="flex-1 bg-secondary hover:bg-muted text-foreground py-2 text-xs uppercase tracking-widest transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Rank Modal */}
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
