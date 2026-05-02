// ─────────────────────────────────────────────────────────────────────────────
// RACHALLANGERS — Match Ledger (ultra-simple players-only)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Configuration ────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://tcrsfnbauyjqglquivoj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcnNmbmJhdXlqcWdscXVpdm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MzEzMTUsImV4cCI6MjA5MzMwNzMxNX0.lbWX41JEEhFXEZzOkBN6wAUM3SS5czp3o6PtrLiO5yA";
const ADMIN_PASSWORD = "rachal123";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const uid = () => Math.random().toString(36).slice(2, 9);

const ICONS = {
  players: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  trash: "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 12l-4 1 1-4 9.5-9.5z",
  close: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  unlock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 019.9-1",
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
};

const Icon = ({ d, size = 16, color = "currentColor" }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// ── Types ────────────────────────────────────────────────────────────────────
type Player = { id: string; name: string };
type Transaction = {
  id: string;
  playerId: string;
  amount: number;
  type: "credit" | "debit";
  date: string;
  note: string;
};

// ── DB helpers ───────────────────────────────────────────────────────────────
async function fetchAll() {
  const [playersRes, txRes] = await Promise.all([
    supabase.from("players").select("*").order("created_at", { ascending: true }),
    supabase.from("transactions").select("*").order("date", { ascending: false }),
  ]);
  return {
    players: (playersRes.data || []).map((p: any) => ({ id: p.id, name: p.name })) as Player[],
    transactions: (txRes.data || []).map((t: any) => ({
      id: t.id,
      playerId: t.player_id,
      amount: +t.amount,
      type: t.type,
      date: t.date,
      note: t.note || "",
    })) as Transaction[],
    error: playersRes.error || txRes.error,
  };
}

const dbPlayers = {
  add: (p: Player) => supabase.from("players").insert({ id: p.id, name: p.name, team_id: null }),
  update: (p: Player) => supabase.from("players").update({ name: p.name }).eq("id", p.id),
  remove: (id: string) => supabase.from("players").delete().eq("id", id),
};
const dbTx = {
  add: (t: Transaction) => supabase.from("transactions").insert({
    id: t.id, player_id: t.playerId, amount: t.amount,
    type: t.type, category: "Match", date: t.date, note: t.note,
  }),
  remove: (id: string) => supabase.from("transactions").delete().eq("id", id),
};

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [viewPlayer, setViewPlayer] = useState<Player | null>(null);

  const refresh = async () => {
    const { players, transactions, error } = await fetchAll();
    if (error) setError(error.message);
    else { setPlayers(players); setTransactions(transactions); setError(null); }
    setLoading(false);
  };

  useEffect(() => {
    if (sessionStorage.getItem("rl:isAdmin") === "yes") setIsAdmin(true);
    refresh();
  }, []);

  useEffect(() => {
    const channel = supabase.channel("rl-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Per-player stats
  const playerStats: Record<string, { credit: number; debit: number; balance: number }> = {};
  players.forEach((p) => {
    playerStats[p.id] = { credit: 0, debit: 0, balance: 0 };
  });
  transactions.forEach((t) => {
    const stat = playerStats[t.playerId];
    if (!stat) return;
    if (t.type === "credit") { stat.credit += t.amount; stat.balance += t.amount; }
    else { stat.debit += t.amount; stat.balance -= t.amount; }
  });
  const balances: Record<string, number> = {};
  Object.entries(playerStats).forEach(([id, s]) => { balances[id] = s.balance; });

  if (loading) {
    return (
      <div style={styles.loadWrap}>
        <div style={styles.spinner} />
        <p style={{ color: "#888", marginTop: 16 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <Sidebar
        balances={balances} players={players}
        isAdmin={isAdmin}
        onAdminClick={() => {
          if (isAdmin) { setIsAdmin(false); sessionStorage.removeItem("rl:isAdmin"); }
          else setShowLogin(true);
        }}
      />
      <main style={styles.main}>
        {error && <div style={styles.errorBar}>⚠ {error}</div>}
        {!isAdmin && (
          <div style={styles.viewerBanner}>
            👀 Viewer mode — read-only. Admin can log in to edit.
          </div>
        )}
        <Players
          players={players} setPlayers={setPlayers}
          playerStats={playerStats}
          isAdmin={isAdmin}
          onPlayerClick={(p) => setViewPlayer(p)}
        />
      </main>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setIsAdmin(true);
            sessionStorage.setItem("rl:isAdmin", "yes");
            setShowLogin(false);
          }}
        />
      )}

      {viewPlayer && (
        <PlayerDetailScreen
          player={viewPlayer}
          stat={playerStats[viewPlayer.id] || { credit: 0, debit: 0, balance: 0 }}
          transactions={transactions.filter((t) => t.playerId === viewPlayer.id)}
          isAdmin={isAdmin}
          onClose={() => setViewPlayer(null)}
          onDeleteTransaction={async (id: string) => {
            if (!confirm("Delete this transaction?")) return;
            const { error } = await dbTx.remove(id);
            if (!error) setTransactions((prev) => prev.filter((t) => t.id !== id));
          }}
          onTransactionAdded={(tx: Transaction) => {
            setTransactions((prev) => [tx, ...prev]);
          }}
        />
      )}
    </div>
  );
}

// ── Login Modal ──────────────────────────────────────────────────────────────
function LoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => { if (pw === ADMIN_PASSWORD) onSuccess(); else setErr(true); };

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, maxWidth: 360 }}>
        <div style={styles.modalHeader}>
          <h2 style={{ color: "#eee", fontSize: 18, margin: 0 }}>Admin Login</h2>
          <button style={styles.iconBtn} onClick={onClose}>
            <Icon d={ICONS.close} size={18} color="#888" />
          </button>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <Label>Password</Label>
          <input
            type="password" value={pw} autoFocus
            onChange={(e) => { setPw(e.target.value); setErr(false); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Enter admin password"
            style={styles.input}
          />
          {err && <div style={{ color: "#FF6B35", fontSize: 12, marginTop: 8 }}>Wrong password</div>}
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid #1e1e1e", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button style={styles.btnSecondary} onClick={onClose}>Cancel</button>
          <button style={styles.btnPrimary} onClick={submit}>Login</button>
        </div>
      </div>
    </div>
  );
}

// ── Player Detail Screen ─────────────────────────────────────────────────────
function PlayerDetailScreen({
  player, stat, transactions, isAdmin, onClose, onDeleteTransaction, onTransactionAdded,
}: {
  player: Player;
  stat: { credit: number; debit: number; balance: number };
  transactions: Transaction[];
  isAdmin: boolean;
  onClose: () => void;
  onDeleteTransaction: (id: string) => void;
  onTransactionAdded: (tx: Transaction) => void;
}) {
  const [showTxForm, setShowTxForm] = useState(false);
  const [txForm, setTxForm] = useState<{
    amount: string; type: "credit" | "debit"; date: string; note: string;
  }>({
    amount: "", type: "credit", date: new Date().toISOString().slice(0, 10), note: "",
  });
  const [busy, setBusy] = useState(false);

  const saveTx = async () => {
    if (!txForm.amount || +txForm.amount <= 0) return;
    setBusy(true);
    const newTx: Transaction = {
      id: uid(),
      playerId: player.id,
      amount: +txForm.amount,
      type: txForm.type,
      date: txForm.date,
      note: txForm.note.trim(),
    };
    const { error } = await dbTx.add(newTx);
    if (!error) {
      onTransactionAdded(newTx);
      setShowTxForm(false);
      setTxForm({ amount: "", type: "credit", date: new Date().toISOString().slice(0, 10), note: "" });
    } else {
      alert("Save failed: " + error.message);
    }
    setBusy(false);
  };

  // Running balance
  const oldestFirst = [...transactions].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const runningMap: Record<string, number> = {};
  let bal = 0;
  oldestFirst.forEach((t) => {
    bal += t.type === "credit" ? t.amount : -t.amount;
    runningMap[t.id] = bal;
  });
  const newestFirst = [...transactions].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <div style={styles.overlay}>
      <div style={styles.playerDetailScreen}>
        {/* Header */}
        <div style={styles.playerDetailHeader}>
          <button style={{ ...styles.iconBtn, marginRight: 8 }} onClick={onClose}>
            <Icon d={ICONS.arrowLeft} size={20} color="#FFD60A" />
          </button>
          <h2 style={{ color: "#eee", fontSize: 20, margin: 0 }}>{player.name}</h2>
        </div>

        {/* Balance Summary - Single Box */}
        <div style={styles.balanceSummarySimple}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#888", fontSize: 11, fontWeight: 600, marginBottom: 6 }}>BALANCE</div>
            <div style={{
              color: stat.balance >= 0 ? "#00C9A7" : "#FF6B35",
              fontWeight: 900, fontSize: 36,
            }}>
              {stat.balance >= 0 ? "+" : ""}₹{stat.balance.toFixed(0)}
            </div>
            <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
              Credit ₹{stat.credit.toFixed(0)} • Pending ₹{stat.debit.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div style={styles.actionButtons}>
            <button
              style={{ ...styles.actionBtn, background: "#1a3a2a", borderColor: "#00C9A7", color: "#00C9A7" }}
              onClick={() => {
                setTxForm((f) => ({ ...f, type: "credit" }));
                setShowTxForm(true);
              }}
            >
              <Icon d={ICONS.plus} size={18} color="#00C9A7" />
              <span>Add Money</span>
            </button>
            <button
              style={{ ...styles.actionBtn, background: "#3a1a1a", borderColor: "#FF6B35", color: "#FF6B35" }}
              onClick={() => {
                setTxForm((f) => ({ ...f, type: "debit" }));
                setShowTxForm(true);
              }}
            >
              <Icon d={ICONS.minus} size={18} color="#FF6B35" />
              <span>Deduct Money</span>
            </button>
          </div>
        )}

        {/* Transaction Form */}
        {showTxForm && (
          <div style={styles.txForm}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ color: "#eee", fontSize: 16, margin: 0 }}>
                {txForm.type === "credit" ? "Add Money" : "Deduct Money"}
              </h3>
              <button style={styles.iconBtn} onClick={() => setShowTxForm(false)}>
                <Icon d={ICONS.close} size={16} color="#888" />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <Label>Amount ₹</Label>
                <input
                  type="number"
                  value={txForm.amount}
                  autoFocus
                  onChange={(e) => setTxForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  style={styles.input}
                />
              </div>
              <div>
                <Label>Date</Label>
                <input
                  type="date"
                  value={txForm.date}
                  onChange={(e) => setTxForm((f) => ({ ...f, date: e.target.value }))}
                  style={{ ...styles.input, colorScheme: "dark" }}
                />
              </div>
            </div>

            <Label>Note (optional)</Label>
            <Input
              value={txForm.note}
              onChange={(v) => setTxForm((f) => ({ ...f, note: v }))}
              placeholder="e.g. Sunday game, lunch..."
            />

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button style={styles.btnSecondary} onClick={() => setShowTxForm(false)} disabled={busy}>
                Cancel
              </button>
              <button style={styles.btnPrimary} onClick={saveTx} disabled={busy}>
                <Icon d={ICONS.check} size={14} /> {busy ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div style={styles.txHistory}>
          <h3 style={{ color: "#eee", fontSize: 16, marginBottom: 12 }}>Transaction History</h3>
          {newestFirst.length === 0 && <Empty msg="No transactions yet" />}
          {newestFirst.map((t) => {
            const running = runningMap[t.id] ?? 0;
            return (
              <div key={t.id} style={styles.txRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ color: "#eee", fontSize: 14, fontWeight: 600 }}>
                      {t.type === "credit" ? "Paid" : "Owes"}
                    </span>
                    <span style={{ color: "#666", fontSize: 11 }}>{t.date}</span>
                  </div>
                  {t.note && <div style={{ color: "#888", fontSize: 12, marginTop: 2 }}>{t.note}</div>}
                  <div style={{ color: "#555", fontSize: 10, marginTop: 2 }}>
                    Balance after: <span style={{
                      color: running >= 0 ? "#00C9A7" : "#FF6B35", fontWeight: 700,
                    }}>{running >= 0 ? "+" : ""}₹{running.toFixed(0)}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span style={{
                    color: t.type === "credit" ? "#00C9A7" : "#FF6B35",
                    fontWeight: 800, fontSize: 18,
                  }}>
                    {t.type === "credit" ? "+" : "-"}₹{t.amount.toFixed(0)}
                  </span>
                  {isAdmin && (
                    <button
                      style={{ ...styles.iconBtn, padding: 4 }}
                      onClick={() => onDeleteTransaction(t.id)}
                      title="Delete"
                    >
                      <Icon d={ICONS.trash} size={12} color="#FF6B35" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  balances, players, isAdmin, onAdminClick,
}: {
  balances: Record<string, number>; players: Player[];
  isAdmin: boolean; onAdminClick: () => void;
}) {
  const totalCredit = Object.values(balances).filter((b) => b > 0).reduce((a, b) => a + b, 0);
  const totalDebit = Math.abs(Object.values(balances).filter((b) => b < 0).reduce((a, b) => a + b, 0));

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <span style={styles.logoIcon}>🏆</span>
        <div>
          <div style={styles.logoTitle}>RACHALLANGERS</div>
          <div style={styles.logoSub}>Match Ledger</div>
        </div>
      </div>

      <div style={styles.sideStats}>
        <div style={styles.statChip}>
          <span style={{ color: "#00C9A7", fontSize: 10, fontWeight: 600 }}>CREDIT POOL</span>
          <span style={{ color: "#00C9A7", fontSize: 18, fontWeight: 700 }}>₹{totalCredit.toFixed(0)}</span>
        </div>
        <div style={styles.statChip}>
          <span style={{ color: "#FF6B35", fontSize: 10, fontWeight: 600 }}>TOTAL DEBT</span>
          <span style={{ color: "#FF6B35", fontSize: 18, fontWeight: 700 }}>₹{totalDebit.toFixed(0)}</span>
        </div>
      </div>

      <div style={{ padding: "12px 16px", borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#FFD60A" }}>
          <Icon d={ICONS.players} size={18} color="#FFD60A" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Players</span>
          {players.length > 0 && <span style={styles.badge}>{players.length}</span>}
        </div>
      </div>

      <div style={styles.sideFooter}>
        <button onClick={onAdminClick}
          style={{
            ...styles.adminBtn,
            background: isAdmin ? "#1a3a2a" : "#1a1a1a",
            color: isAdmin ? "#00C9A7" : "#888",
          }}>
          <Icon d={isAdmin ? ICONS.unlock : ICONS.lock} size={14} />
          {isAdmin ? "Admin (Logout)" : "Admin Login"}
        </button>
        <span style={{ color: "#444", fontSize: 10, display: "block", marginTop: 8 }}>
          🌐 Live • Synced
        </span>
      </div>
    </aside>
  );
}

// ── Players ──────────────────────────────────────────────────────────────────
function Players({
  players, setPlayers, playerStats, isAdmin, onPlayerClick,
}: {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  playerStats: Record<string, { credit: number; debit: number; balance: number }>;
  isAdmin: boolean;
  onPlayerClick: (p: Player) => void;
}) {
  const [playerModal, setPlayerModal] = useState<null | "add" | Player>(null);
  const [pForm, setPForm] = useState({ name: "" });
  const [busy, setBusy] = useState(false);

  const openAdd = () => { setPForm({ name: "" }); setPlayerModal("add"); };
  const openEdit = (p: Player) => { setPForm({ name: p.name }); setPlayerModal(p); };

  const savePlayer = async () => {
    if (!pForm.name.trim()) return;
    setBusy(true);
    if (playerModal === "add") {
      const newP: Player = { id: uid(), name: pForm.name.trim() };
      const { error } = await dbPlayers.add(newP);
      if (!error) setPlayers((prev) => [...prev, newP]);
      else alert("Save failed: " + error.message);
    } else if (playerModal) {
      const m = playerModal as Player;
      const updated: Player = { ...m, name: pForm.name.trim() };
      const { error } = await dbPlayers.update(updated);
      if (!error) setPlayers((prev) => prev.map((p) => (p.id === m.id ? updated : p)));
      else alert("Save failed: " + error.message);
    }
    setBusy(false);
    setPlayerModal(null);
  };

  const delPlayer = async (id: string) => {
    if (!confirm("Delete this player and all transactions?")) return;
    const { error } = await dbPlayers.remove(id);
    if (!error) setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Players</h1>
        {isAdmin && (
          <button style={styles.btnPrimary} onClick={openAdd}>
            <Icon d={ICONS.plus} size={16} /> Add Player
          </button>
        )}
      </div>

      {players.length === 0 && <Empty msg="No players yet. Add your first player!" big />}

      <div style={styles.cardGrid}>
        {players.map((p) => {
          const stat = playerStats[p.id] || { credit: 0, debit: 0, balance: 0 };
          const bal = stat.balance;
          return (
            <div
              key={p.id}
              style={{ ...styles.playerCardClean, cursor: "pointer" }}
              onClick={() => onPlayerClick(p)}
            >
              <div style={styles.avatar}>{p.name[0]?.toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#eee", fontWeight: 600, fontSize: 17 }}>{p.name}</div>
                <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>
                  Tap to view details
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: bal >= 0 ? "#00C9A7" : "#FF6B35", fontWeight: 900, fontSize: 24 }}>
                  {bal >= 0 ? "+" : ""}₹{bal.toFixed(0)}
                </div>
              </div>
              {isAdmin && (
                <div style={{ display: "flex", gap: 4, marginLeft: 8 }} onClick={(e) => e.stopPropagation()}>
                  <button style={styles.iconBtn} onClick={() => openEdit(p)} title="Edit">
                    <Icon d={ICONS.edit} size={14} color="#888" />
                  </button>
                  <button style={styles.iconBtn} onClick={() => delPlayer(p.id)} title="Delete">
                    <Icon d={ICONS.trash} size={14} color="#FF6B35" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {playerModal && (
        <Modal
          title={playerModal === "add" ? "Add Player" : "Edit Player"}
          onClose={() => setPlayerModal(null)}
          onSave={savePlayer}
          busy={busy}
        >
          <Label>Player Name</Label>
          <Input value={pForm.name} onChange={(v) => setPForm({ name: v })} placeholder="Enter name" />
        </Modal>
      )}
    </div>
  );
}

// ── Shared Components ────────────────────────────────────────────────────────
function Modal({
  title, children, onClose, onSave, busy,
}: {
  title: string; children: React.ReactNode;
  onClose: () => void; onSave: (() => void) | null;
  busy?: boolean;
}) {
  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, maxWidth: 400 }}>
        <div style={styles.modalHeader}>
          <h2 style={{ color: "#eee", fontSize: 18, margin: 0 }}>{title}</h2>
          <button style={styles.iconBtn} onClick={onClose}>
            <Icon d={ICONS.close} size={18} color="#888" />
          </button>
        </div>
        <div style={{ padding: "16px 20px" }}>{children}</div>
        {onSave && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid #1e1e1e", display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button style={styles.btnSecondary} onClick={onClose} disabled={busy}>Cancel</button>
            <button style={styles.btnPrimary} onClick={onSave} disabled={busy}>
              <Icon d={ICONS.check} size={15} /> {busy ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ color: "#666", fontSize: 11, fontWeight: 600, textTransform: "uppercase", margin: "12px 0 4px" }}>
    {children}
  </div>
);

const Input = ({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) => (
  <input value={value} onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder} style={styles.input} />
);

const Empty = ({ msg, big }: { msg: string; big?: boolean }) => (
  <div style={{ textAlign: "center", padding: big ? "80px 20px" : "30px", color: "#444" }}>
    <div style={{ fontSize: big ? 56 : 38 }}>👥</div>
    <p style={{ marginTop: 12, fontSize: big ? 16 : 14 }}>{msg}</p>
  </div>
);

// ── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  root: { display: "flex", minHeight: "100vh", background: "#0a0a0a",
    fontFamily: "system-ui, -apple-system, sans-serif", color: "#eee" },
  sidebar: { width: 220, background: "#0f0f0f", borderRight: "1px solid #1a1a1a",
    display: "flex", flexDirection: "column", flexShrink: 0 },
  logo: { display: "flex", alignItems: "center", gap: 10, padding: "20px 16px", borderBottom: "1px solid #1a1a1a" },
  logoIcon: { fontSize: 28 },
  logoTitle: { fontSize: 16, fontWeight: 800, letterSpacing: 2, color: "#fff" },
  logoSub: { fontSize: 10, color: "#444", letterSpacing: 1 },
  sideStats: { display: "flex", gap: 6, padding: "12px 10px", borderBottom: "1px solid #1a1a1a" },
  statChip: { flex: 1, background: "#141414", borderRadius: 8, padding: "8px 6px",
    display: "flex", flexDirection: "column", gap: 2, alignItems: "center" },
  badge: { marginLeft: "auto", background: "#222", color: "#888", fontSize: 10,
    padding: "2px 6px", borderRadius: 99 },
  sideFooter: { marginTop: "auto", padding: "16px", textAlign: "center" },
  adminBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    width: "100%", border: "1px solid #2a2a2a", borderRadius: 6, padding: "8px",
    fontSize: 12, fontWeight: 600, cursor: "pointer" },
  main: { flex: 1, overflow: "auto" },
  errorBar: { background: "#3a1a1a", color: "#FF6B35", padding: "10px 20px",
    fontSize: 13, borderBottom: "1px solid #FF6B35" },
  viewerBanner: { background: "#1a1a1a", color: "#888", padding: "8px 20px",
    fontSize: 12, textAlign: "center", borderBottom: "1px solid #222" },
  page: { padding: "32px", maxWidth: 900, margin: "0 auto" },
  pageTitle: { fontSize: 32, fontWeight: 900, color: "#fff", margin: 0 },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  cardGrid: { display: "flex", flexDirection: "column", gap: 12 },
  playerCardClean: { background: "#111", borderRadius: 12, padding: "20px 22px",
    display: "flex", alignItems: "center", gap: 16,
    transition: "all 0.2s", border: "2px solid transparent",
  },
  avatar: { width: 52, height: 52, borderRadius: "50%", background: "#FFD60A", color: "#000",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 900, fontSize: 22, flexShrink: 0 },
  btnPrimary: { display: "flex", alignItems: "center", gap: 6, background: "#FFD60A",
    color: "#000", border: "none", borderRadius: 8, padding: "10px 16px",
    fontWeight: 700, cursor: "pointer", fontSize: 14 },
  btnSecondary: { background: "#1a1a1a", color: "#ccc", border: "1px solid #2a2a2a",
    borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 14 },
  iconBtn: { background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6 },
  input: { width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a",
    color: "#eee", borderRadius: 8, padding: "10px 12px", fontSize: 14, boxSizing: "border-box" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 1000 },
  modal: { background: "#141414", borderRadius: 12, width: "100%",
    border: "1px solid #2a2a2a", overflow: "hidden" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 20px", borderBottom: "1px solid #1e1e1e" },
  loadWrap: { display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", minHeight: "100vh", background: "#0a0a0a" },
  spinner: { width: 40, height: 40, border: "3px solid #1a1a1a",
    borderTop: "3px solid #FFD60A", borderRadius: "50%", animation: "spin 1s linear infinite" },
  playerDetailScreen: {
    background: "#0f0f0f", borderRadius: 12, width: "100%", maxWidth: 500,
    maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
    border: "1px solid #2a2a2a",
  },
  playerDetailHeader: {
    display: "flex", alignItems: "center", padding: "18px 22px",
    borderBottom: "1px solid #1e1e1e",
  },
  balanceSummarySimple: {
    padding: "24px 20px", background: "#0a0a0a", borderBottom: "1px solid #1e1e1e",
  },
  actionButtons: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
    padding: "18px 22px", borderBottom: "1px solid #1e1e1e",
  },
  actionBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "14px", borderRadius: 10, border: "2px solid",
    fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
  txForm: {
    padding: "18px 22px", background: "#0a0a0a", borderBottom: "1px solid #1e1e1e",
  },
  txHistory: {
    flex: 1, overflowY: "auto", padding: "18px 22px",
  },
  txRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "14px 0", borderBottom: "1px solid #1a1a1a",
  },
}