import {
  AlignJustify,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SquareStack,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Member, Rank } from "../backend.d";
import MemberProfile from "../components/MemberProfile";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import { useBackend } from "../hooks/useBackend";

function daysLeft(renewalMs: bigint) {
  return Math.ceil((Number(renewalMs) - Date.now()) / (1000 * 60 * 60 * 24));
}

function getStatus(renewalMs: bigint): "active" | "expiring" | "expired" {
  const now = Date.now();
  const renewal = Number(renewalMs);
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  if (renewal < now) return "expired";
  if (renewal - now <= twoDaysMs) return "expiring";
  return "active";
}

type SortKey = "playerName" | "rankName" | "renewalDate";
type SortDir = "asc" | "desc";

interface MemberForm {
  playerName: string;
  discordUsername: string;
  rankId: string;
  purchaseDateDay: string;
  purchaseDateMonth: string;
  purchaseDateYear: string;
  monthsPaid: string;
  notes: string;
}

const emptyForm: MemberForm = {
  playerName: "",
  discordUsername: "",
  rankId: "",
  purchaseDateDay: "",
  purchaseDateMonth: "",
  purchaseDateYear: "",
  monthsPaid: "1",
  notes: "",
};

export default function Members() {
  const { actor } = useBackend();
  const { user } = useAuth();
  const { formatDate, compactView, setCompactView } = usePreferences();
  const [members, setMembers] = useState<Member[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<bigint | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Profile drawer
  const [profileMember, setProfileMember] = useState<Member | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<bigint | null>(null);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  // CSV import
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  // Search / filter / sort
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("renewalDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Selection / bulk renew
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRenewOpen, setBulkRenewOpen] = useState(false);
  const [bulkMonths, setBulkMonths] = useState("1");
  const [bulkRenewing, setBulkRenewing] = useState(false);

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

  const getRankName = (id: bigint) =>
    ranks.find((r) => r.id === id)?.name ?? "—";
  const getRankPrice = (id: bigint) =>
    ranks.find((r) => r.id === id)?.priceINR ?? BigInt(0);

  // Filtering
  const filtered = members
    .filter((m) => {
      const q = search.toLowerCase();
      return (
        m.playerName.toLowerCase().includes(q) ||
        m.discordUsername.toLowerCase().includes(q)
      );
    })
    .filter((m) => {
      if (!rankFilter) return true;
      return m.rankId.toString() === rankFilter;
    })
    .filter((m) => {
      if (!statusFilter) return true;
      return getStatus(m.renewalDate) === statusFilter;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "playerName") {
        cmp = a.playerName.localeCompare(b.playerName);
      } else if (sortKey === "rankName") {
        cmp = getRankName(a.rankId).localeCompare(getRankName(b.rankId));
      } else if (sortKey === "renewalDate") {
        cmp = Number(a.renewalDate) - Number(b.renewalDate);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-primary" />
    ) : (
      <ChevronDown className="w-3 h-3 text-primary" />
    );
  };

  // Selection
  const allSelected =
    filtered.length > 0 && filtered.every((m) => selected.has(m.id.toString()));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((m) => m.id.toString())));
    }
  };

  const toggleOne = (id: bigint) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id.toString())) next.delete(id.toString());
      else next.add(id.toString());
      return next;
    });
  };

  // Export CSV
  const exportCSV = () => {
    const headers = [
      "Player Name",
      "Discord Username",
      "Rank",
      "Purchase Date",
      "Renewal Date",
      "Months Paid",
    ];
    const rows = filtered.map((m) => [
      m.playerName,
      m.discordUsername,
      getRankName(m.rankId),
      formatDate(m.purchaseDate),
      formatDate(m.renewalDate),
      Number(m.monthsPaidInAdvance).toString(),
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deathsmp-members.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV Import
  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !actor || !user) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.trim().split("\n");
      // Skip header row if it looks like a header (non-date first cell)
      const dataLines = lines.filter((l) => l.trim());
      // Check if first row is header
      const firstCells = dataLines[0]
        ?.split(",")
        .map((c) => c.replace(/^"|"$/g, "").trim().toLowerCase());
      const isHeader =
        firstCells &&
        (firstCells[0] === "playername" ||
          firstCells[0] === "player name" ||
          firstCells[0] === "player");
      const rows = isHeader ? dataLines.slice(1) : dataLines;

      let imported = 0;
      let skipped = 0;

      for (const row of rows) {
        const cells = row.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
        const [
          playerName,
          discordUsername,
          rankName,
          purchaseDateStr,
          monthsStr,
          notes,
        ] = cells;
        if (!playerName || !discordUsername || !rankName || !purchaseDateStr) {
          skipped++;
          continue;
        }
        // Parse rank
        const rank = ranks.find(
          (r) => r.name.toLowerCase() === rankName.toLowerCase(),
        );
        if (!rank) {
          toast.warning(
            `Skipped "${playerName}": rank "${rankName}" not found.`,
          );
          skipped++;
          continue;
        }
        // Parse date (DD/MM/YYYY)
        const dateParts = purchaseDateStr.split("/");
        let purchaseTs: number;
        if (dateParts.length === 3) {
          const [dd, mm, yyyy] = dateParts;
          purchaseTs = new Date(`${yyyy}-${mm}-${dd}`).getTime();
        } else {
          purchaseTs = new Date(purchaseDateStr).getTime();
        }
        if (Number.isNaN(purchaseTs)) {
          skipped++;
          continue;
        }
        const months = Math.max(1, Number(monthsStr) || 1);
        try {
          const res = await actor.addMember(
            user.email,
            user.password,
            playerName,
            discordUsername,
            rank.id,
            BigInt(purchaseTs),
            BigInt(months),
            notes ?? "",
          );
          if (res.ok) {
            imported++;
          } else {
            skipped++;
          }
        } catch {
          skipped++;
        }
      }

      toast.success(`Imported ${imported} members, skipped ${skipped} rows.`);
      load();
    } catch {
      toast.error("Failed to parse CSV file.");
    } finally {
      setImporting(false);
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  };

  // Bulk renew
  const handleBulkRenew = async () => {
    if (!actor || !user) return;
    setBulkRenewing(true);
    try {
      const months = Math.max(1, Number(bulkMonths) || 1);
      const targets = members.filter((m) => selected.has(m.id.toString()));
      await Promise.all(
        targets.map((m) =>
          actor.updateMember(
            user.email,
            user.password,
            m.id,
            m.playerName,
            m.discordUsername,
            m.rankId,
            m.purchaseDate,
            m.monthsPaidInAdvance + BigInt(months),
            m.notes,
          ),
        ),
      );
      toast.success(
        `Renewed ${targets.length} member(s) by ${months} month(s).`,
      );
      setBulkRenewOpen(false);
      setSelected(new Set());
      load();
    } catch {
      toast.error("Bulk renew failed.");
    } finally {
      setBulkRenewing(false);
    }
  };

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
      purchaseDateDay: String(d.getDate()),
      purchaseDateMonth: String(d.getMonth() + 1),
      purchaseDateYear: String(d.getFullYear()),
      monthsPaid: m.monthsPaidInAdvance.toString(),
      notes: m.notes,
    });
    setModalOpen(true);
  };

  // Duplicate detection
  const checkDuplicates = (
    playerName: string,
    discordUsername: string,
    excludeId: bigint | null,
  ): Member | null => {
    return (
      members.find((m) => {
        if (excludeId !== null && m.id === excludeId) return false;
        return (
          m.playerName.toLowerCase() === playerName.toLowerCase() ||
          m.discordUsername.toLowerCase() === discordUsername.toLowerCase()
        );
      }) ?? null
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !user) return;

    // Validate date fields
    if (
      !form.purchaseDateDay ||
      !form.purchaseDateMonth ||
      !form.purchaseDateYear
    ) {
      toast.error(
        "Please fill in the complete purchase date (day, month, and year).",
      );
      return;
    }
    const day = Number.parseInt(form.purchaseDateDay);
    const month = Number.parseInt(form.purchaseDateMonth);
    const year = Number.parseInt(form.purchaseDateYear);
    if (
      Number.isNaN(day) ||
      day < 1 ||
      day > 31 ||
      Number.isNaN(month) ||
      month < 1 ||
      month > 12 ||
      Number.isNaN(year) ||
      year < 2000 ||
      year > 2100
    ) {
      toast.error(
        "Invalid purchase date. Please check the day, month, and year.",
      );
      return;
    }

    // Duplicate warning (non-blocking)
    const duplicate = checkDuplicates(
      form.playerName,
      form.discordUsername,
      editId,
    );
    if (duplicate) {
      toast.warning(
        `Possible duplicate: member "${duplicate.playerName}" (@${duplicate.discordUsername}) has the same name or Discord. Saving anyway.`,
        { duration: 5000 },
      );
    }

    setSaving(true);
    try {
      const purchaseTs = BigInt(new Date(year, month - 1, day).getTime());
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

  const confirmDelete = (id: bigint) => {
    setDeleteConfirmId(id);
  };

  // Undo delete: store deleted member data to re-add on undo
  const handleDelete = async () => {
    if (!actor || !user || deleteConfirmId === null) return;
    const targetMember = members.find((m) => m.id === deleteConfirmId);
    setDeletingId(deleteConfirmId);
    setDeleteConfirmId(null);
    try {
      const res = await actor.deleteMember(
        user.email,
        user.password,
        deleteConfirmId,
      );
      if (res.ok) {
        load();
        // Show toast with undo
        if (targetMember) {
          toast.success("Member deleted.", {
            action: {
              label: "Undo",
              onClick: async () => {
                if (!actor || !user) return;
                try {
                  await actor.addMember(
                    user.email,
                    user.password,
                    targetMember.playerName,
                    targetMember.discordUsername,
                    targetMember.rankId,
                    targetMember.purchaseDate,
                    targetMember.monthsPaidInAdvance,
                    targetMember.notes,
                  );
                  toast.success("Member restored.");
                  load();
                } catch {
                  toast.error("Undo failed.");
                }
              },
            },
            duration: 5000,
          });
        } else {
          toast.success("Member removed.");
        }
      } else toast.error(res.message);
    } catch {
      toast.error("Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const deleteTarget = members.find((m) => m.id === deleteConfirmId);

  const rowPy = compactView ? "py-1" : "py-3";
  const fontSize = compactView ? "text-[10px]" : "text-xs";

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Profile Drawer */}
      <MemberProfile
        member={profileMember}
        ranks={ranks}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      {/* Header */}
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
        <div className="flex items-center gap-2">
          {/* Hidden file input for CSV */}
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCSVImport}
          />
          <button
            type="button"
            onClick={() => csvInputRef.current?.click()}
            disabled={importing}
            data-ocid="members.upload_button"
            className="flex items-center gap-1.5 bg-secondary hover:bg-muted text-foreground px-3 py-2 text-xs uppercase tracking-wider transition-colors border border-border disabled:opacity-50"
          >
            {importing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {importing ? "IMPORTING..." : "IMPORT CSV"}
          </button>
          <button
            type="button"
            onClick={openAdd}
            data-ocid="members.primary_button"
            className="flex items-center gap-2 bg-primary hover:bg-accent text-primary-foreground px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <Plus className="w-4 h-4" /> ADD MEMBER
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="search"
          placeholder="Search player or Discord..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-ocid="members.search_input"
          className="bg-input text-foreground px-3 py-2 text-xs border border-border focus:border-primary focus:outline-none flex-1 min-w-40"
        />
        <select
          value={rankFilter}
          onChange={(e) => setRankFilter(e.target.value)}
          data-ocid="members.select"
          className="bg-input text-foreground px-3 py-2 text-xs border border-border focus:border-primary focus:outline-none"
        >
          <option value="">All Ranks</option>
          {ranks.map((r) => (
            <option key={r.id.toString()} value={r.id.toString()}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          data-ocid="members.select"
          className="bg-input text-foreground px-3 py-2 text-xs border border-border focus:border-primary focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring Soon</option>
          <option value="expired">Expired</option>
        </select>
        {/* Compact / Comfortable toggle */}
        <button
          type="button"
          onClick={() => setCompactView(!compactView)}
          data-ocid="members.toggle"
          title={
            compactView
              ? "Switch to comfortable view"
              : "Switch to compact view"
          }
          className={`flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider transition-colors border ${
            compactView
              ? "bg-primary/20 text-primary border-primary/40"
              : "bg-secondary text-foreground border-border hover:bg-muted"
          }`}
        >
          {compactView ? (
            <>
              <AlignJustify className="w-3.5 h-3.5" /> COMPACT
            </>
          ) : (
            <>
              <SquareStack className="w-3.5 h-3.5" /> COMFORTABLE
            </>
          )}
        </button>
        <button
          type="button"
          onClick={exportCSV}
          data-ocid="members.secondary_button"
          className="flex items-center gap-1.5 bg-secondary hover:bg-muted text-foreground px-3 py-2 text-xs uppercase tracking-wider transition-colors border border-border"
        >
          <Download className="w-3.5 h-3.5" /> EXPORT CSV
        </button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/30 px-4 py-2 mb-4">
          <span className="text-xs text-primary font-bold uppercase tracking-wider">
            {selected.size} member{selected.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBulkRenewOpen(true)}
              data-ocid="members.primary_button"
              className="flex items-center gap-1.5 bg-primary hover:bg-accent text-primary-foreground px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> BULK RENEW
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              data-ocid="members.cancel_button"
              className="text-xs text-muted-foreground hover:text-foreground uppercase tracking-wider px-2 transition-colors"
            >
              CLEAR
            </button>
          </div>
        </div>
      )}

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
      ) : filtered.length === 0 ? (
        <div
          data-ocid="members.empty_state"
          className="bg-card border border-border p-12 text-center"
        >
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-xs tracking-widest uppercase">
            No members match your filters.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border border-t-2 border-t-primary overflow-x-auto">
          <table data-ocid="members.table" className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    data-ocid="members.checkbox"
                    className="accent-primary cursor-pointer"
                  />
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground uppercase tracking-widest font-normal text-[10px]">
                  <button
                    type="button"
                    onClick={() => toggleSort("playerName")}
                    onKeyDown={(e) =>
                      e.key === "Enter" && toggleSort("playerName")
                    }
                    className="flex items-center gap-1 cursor-pointer select-none hover:text-foreground transition-colors uppercase tracking-widest"
                  >
                    Player <SortIcon col="playerName" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground uppercase tracking-widest font-normal text-[10px]">
                  Discord
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground uppercase tracking-widest font-normal text-[10px]">
                  <button
                    type="button"
                    onClick={() => toggleSort("rankName")}
                    onKeyDown={(e) =>
                      e.key === "Enter" && toggleSort("rankName")
                    }
                    className="flex items-center gap-1 cursor-pointer select-none hover:text-foreground transition-colors uppercase tracking-widest"
                  >
                    Rank <SortIcon col="rankName" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground uppercase tracking-widest font-normal text-[10px]">
                  Price/mo
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground uppercase tracking-widest font-normal text-[10px]">
                  Purchase Date
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground uppercase tracking-widest font-normal text-[10px]">
                  <button
                    type="button"
                    onClick={() => toggleSort("renewalDate")}
                    onKeyDown={(e) =>
                      e.key === "Enter" && toggleSort("renewalDate")
                    }
                    className="flex items-center gap-1 cursor-pointer select-none hover:text-foreground transition-colors uppercase tracking-widest"
                  >
                    Renewal Date <SortIcon col="renewalDate" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground uppercase tracking-widest font-normal text-[10px]">
                  Months
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground uppercase tracking-widest font-normal text-[10px]">
                  Notes
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground uppercase tracking-widest font-normal text-[10px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((m, i) => {
                const days = daysLeft(m.renewalDate);
                const warn = days <= 7;
                const status = getStatus(m.renewalDate);
                const rowBorder =
                  status === "expired"
                    ? "border-l-2 border-l-red-500"
                    : status === "expiring"
                      ? "border-l-2 border-l-yellow-400"
                      : "border-l-2 border-l-green-500";
                const isChecked = selected.has(m.id.toString());
                return (
                  <tr
                    key={m.id.toString()}
                    data-ocid={`members.row.${i + 1}`}
                    className={`hover:bg-secondary/30 transition-colors ${rowBorder}`}
                  >
                    <td className={`px-3 ${rowPy}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(m.id)}
                        data-ocid={`members.checkbox.${i + 1}`}
                        className="accent-primary cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td
                      className={`px-4 ${rowPy} text-foreground font-bold ${fontSize}`}
                    >
                      {m.playerName}
                    </td>
                    <td
                      className={`px-4 ${rowPy} text-muted-foreground ${fontSize}`}
                    >
                      {m.discordUsername}
                    </td>
                    <td className={`px-4 ${rowPy}`}>
                      <span className="bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                        {getRankName(m.rankId)}
                      </span>
                    </td>
                    <td
                      className={`px-4 ${rowPy} text-muted-foreground ${fontSize}`}
                    >
                      ₹{Number(getRankPrice(m.rankId))}
                    </td>
                    <td
                      className={`px-4 ${rowPy} text-muted-foreground ${fontSize}`}
                    >
                      {formatDate(m.purchaseDate)}
                    </td>
                    <td className={`px-4 ${rowPy}`}>
                      <span
                        className={`${fontSize} ${
                          warn
                            ? "text-primary font-bold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatDate(m.renewalDate)}
                      </span>
                      {warn && (
                        <span
                          className={`ml-2 border px-1.5 py-0.5 text-[9px] uppercase ${
                            status === "expired"
                              ? "bg-red-500/20 text-red-400 border-red-500/40"
                              : "bg-primary/20 text-primary border-primary/40"
                          }`}
                        >
                          {days <= 0 ? "EXPIRED" : `${days}D`}
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-4 ${rowPy} text-muted-foreground ${fontSize}`}
                    >
                      {Number(m.monthsPaidInAdvance)}
                    </td>
                    <td
                      className={`px-4 ${rowPy} text-muted-foreground max-w-[120px] truncate ${fontSize}`}
                    >
                      {m.notes || "—"}
                    </td>
                    <td className={`px-4 ${rowPy}`}>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMember(m);
                            setProfileOpen(true);
                          }}
                          data-ocid={`members.secondary_button.${i + 1}`}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="View profile"
                          aria-label="View profile"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(m);
                          }}
                          data-ocid={`members.edit_button.${i + 1}`}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(m.id);
                          }}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div
          data-ocid="members.dialog"
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-card border border-border border-t-2 border-t-primary w-full max-w-sm">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary">
                ⚠ DELETE MEMBER
              </h3>
            </div>
            <div className="p-5">
              <p className="text-xs text-foreground mb-1">
                Are you sure you want to delete{" "}
                <span className="font-bold text-primary">
                  {deleteTarget?.playerName ?? "this member"}
                </span>
                ?
              </p>
              <p className="text-[10px] text-muted-foreground mb-5">
                You can undo this action for 5 seconds after deletion.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  data-ocid="members.confirm_button"
                  className="flex-1 bg-primary hover:bg-accent text-primary-foreground py-2 text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  DELETE
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  data-ocid="members.cancel_button"
                  className="flex-1 bg-secondary hover:bg-muted text-foreground py-2 text-xs uppercase tracking-widest transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Renew Modal */}
      {bulkRenewOpen && (
        <div
          data-ocid="members.dialog"
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-card border border-border border-t-2 border-t-primary w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest">
                BULK RENEW — {selected.size} MEMBER
                {selected.size !== 1 ? "S" : ""}
              </h3>
              <button
                type="button"
                onClick={() => setBulkRenewOpen(false)}
                data-ocid="members.close_button"
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label
                  htmlFor="bulk-months"
                  className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
                >
                  Extend by how many months?
                </label>
                <input
                  id="bulk-months"
                  type="number"
                  min="1"
                  value={bulkMonths}
                  onChange={(e) => setBulkMonths(e.target.value)}
                  data-ocid="members.input"
                  className="w-full bg-input text-foreground px-3 py-2 text-xs border border-border focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBulkRenew}
                  disabled={bulkRenewing}
                  data-ocid="members.confirm_button"
                  className="flex-1 bg-primary hover:bg-accent text-primary-foreground py-2 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {bulkRenewing && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {bulkRenewing ? "RENEWING..." : "RENEW"}
                </button>
                <button
                  type="button"
                  onClick={() => setBulkRenewOpen(false)}
                  data-ocid="members.cancel_button"
                  className="flex-1 bg-secondary hover:bg-muted text-foreground py-2 text-xs uppercase tracking-widest transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Member Modal */}
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
              {/* Purchase Date — 3-box DD/MM/YYYY picker */}
              <div>
                <label
                  htmlFor="m-date-day"
                  className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
                >
                  Purchase Date
                </label>
                <div className="flex gap-2">
                  {/* Box 1: Day */}
                  <input
                    id="m-date-day"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="DD"
                    value={form.purchaseDateDay}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (
                        val === "" ||
                        (Number.parseInt(val) >= 1 &&
                          Number.parseInt(val) <= 31)
                      ) {
                        setForm((f) => ({ ...f, purchaseDateDay: val }));
                      }
                    }}
                    required
                    data-ocid="members.input"
                    className="w-16 bg-input text-foreground px-3 py-2 text-xs border border-border focus:border-primary focus:outline-none text-center"
                  />
                  {/* Box 2: Month dropdown */}
                  <select
                    value={form.purchaseDateMonth}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        purchaseDateMonth: e.target.value,
                      }))
                    }
                    required
                    data-ocid="members.select"
                    className="flex-1 bg-input text-foreground px-3 py-2 text-xs border border-border focus:border-primary focus:outline-none"
                  >
                    <option value="">Month</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                  {/* Box 3: Year */}
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    placeholder="YYYY"
                    value={form.purchaseDateYear}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        purchaseDateYear: e.target.value,
                      }))
                    }
                    required
                    data-ocid="members.input"
                    className="w-20 bg-input text-foreground px-3 py-2 text-xs border border-border focus:border-primary focus:outline-none text-center"
                  />
                </div>
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
