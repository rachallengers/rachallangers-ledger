
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// CONFIG
const SUPABASE_URL = "https://tcrsfnbauyjqglquivoj.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_KEY";
const ADMIN_PASSWORD = "rachal123";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// TYPES
type Player = { id: string; name: string };

type Transaction = {
  id: string;
  player_id: string;
  amount: number;
  category: string;
  date: string;
};

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [tx, setTx] = useState<Transaction[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // login
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState("");

  // player modal
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // player page
  const [viewPlayer, setViewPlayer] = useState<Player | null>(null);

  // tx modal
  const [showTxModal, setShowTxModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [form, setForm] = useState({
    amount: "",
    category: "Match",
    type: "credit", // + / -
  });

  // LOAD
  const load = async () => {
    const p = await supabase.from("players").select("*");
    const t = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false });

    setPlayers(p.data || []);
    setTx(t.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  // PLAYER CRUD
  const savePlayer = async () => {
    if (!playerName.trim()) return;

    if (editingPlayer) {
      await supabase
        .from("players")
        .update({ name: playerName })
        .eq("id", editingPlayer.id);
    } else {
      await supabase.from("players").insert({
        id: crypto.randomUUID(),
        name: playerName,
      });
    }

    setPlayerName("");
    setEditingPlayer(null);
    setShowPlayerModal(false);
    load();
  };

  const deletePlayer = async (id: string) => {
    if (!confirm("Delete player?")) return;
    await supabase.from("players").delete().eq("id", id);
    load();
  };

  // TRANSACTION SAVE / EDIT
  const saveTx = async () => {
    if (!selectedPlayer || !form.amount) return;

    const amt =
      form.type === "credit"
        ? Number(form.amount)
        : -Number(form.amount);

    if (editingTx) {
      await supabase
        .from("transactions")
        .update({
          amount: amt,
          category: form.category,
        })
        .eq("id", editingTx.id);
    } else {
      await supabase.from("transactions").insert({
        id: crypto.randomUUID(),
        player_id: selectedPlayer,
        amount: amt,
        category: form.category,
        date: new Date().toISOString(),
      });
    }

    setEditingTx(null);
    setShowTxModal(false);
    setForm({ amount: "", category: "Match", type: "credit" });
    load();
  };

  const deleteTx = async (id: string) => {
    if (!confirm("Delete transaction?")) return;
    await supabase.from("transactions").delete().eq("id", id);
    load();
  };

  // BALANCE
  const stats: Record<string, number> = {};
  players.forEach((p) => (stats[p.id] = 0));

  tx.forEach((t) => {
    stats[t.player_id] = (stats[t.player_id] || 0) + t.amount;
  });

  return (
    <div style={{ padding: 20, background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <h1>🏆 RACHALLANGERS</h1>

      <button onClick={() => setShowLogin(true)}>Admin Login</button>

      {isAdmin && (
        <button
          onClick={() => {
            setEditingPlayer(null);
            setPlayerName("");
            setShowPlayerModal(true);
          }}
          style={{ marginLeft: 10 }}
        >
          + Add Player
        </button>
      )}

      <hr />

      {/* DASHBOARD */}
      {players.map((p) => {
        const balance = stats[p.id] || 0;

        return (
          <div key={p.id} style={{ background: "#111", padding: 15, borderRadius: 10, marginBottom: 10 }}>
            <h3 onClick={() => setViewPlayer(p)} style={{ cursor: "pointer" }}>
              {p.name}
            </h3>

            <div style={{ fontSize: 18 }}>
              Balance:{" "}
              <b style={{ color: balance >= 0 ? "#00C9A7" : "#FF6B35" }}>
                ₹{balance}
              </b>
            </div>

            {isAdmin && (
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => {
                    setEditingPlayer(p);
                    setPlayerName(p.name);
                    setShowPlayerModal(true);
                  }}
                >
                  Edit
                </button>

                <button onClick={() => deletePlayer(p.id)} style={{ marginLeft: 10 }}>
                  Delete
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* PLAYER PAGE */}
      {viewPlayer && (
        <div style={modal}>
          <div style={{ ...box, width: 350, maxHeight: "80vh", overflowY: "auto" }}>
            <h2>{viewPlayer.name}</h2>

            <div style={{ fontSize: 20 }}>
              Balance:{" "}
              <b style={{ color: (stats[viewPlayer.id] || 0) >= 0 ? "#00C9A7" : "#FF6B35" }}>
                ₹{stats[viewPlayer.id] || 0}
              </b>
            </div>

            {isAdmin && (
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => {
                    setSelectedPlayer(viewPlayer.id);
                    setForm({ ...form, type: "credit" });
                    setShowTxModal(true);
                  }}
                >
                  + Add
                </button>

                <button
                  onClick={() => {
                    setSelectedPlayer(viewPlayer.id);
                    setForm({ ...form, type: "debit" });
                    setShowTxModal(true);
                  }}
                  style={{ marginLeft: 10 }}
                >
                  - Deduct
                </button>
              </div>
            )}

            <hr />

            {tx
              .filter((t) => t.player_id === viewPlayer.id)
              .map((t) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: 6 }}>
                  <div>
                    {t.date.slice(0, 10)} • {t.category} •{" "}
                    <span style={{ color: t.amount >= 0 ? "#00C9A7" : "#FF6B35" }}>
                      {t.amount >= 0 ? "+" : "-"}₹{Math.abs(t.amount)}
                    </span>
                  </div>

                  {isAdmin && (
                    <div>
                      <button
                        onClick={() => {
                          setEditingTx(t);
                          setSelectedPlayer(t.player_id);
                          setForm({
                            amount: String(Math.abs(t.amount)),
                            category: t.category,
                            type: t.amount >= 0 ? "credit" : "debit",
                          });
                          setShowTxModal(true);
                        }}
                      >
                        Edit
                      </button>

                      <button onClick={() => deleteTx(t.id)} style={{ marginLeft: 5 }}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}

            <button onClick={() => setViewPlayer(null)}>Close</button>
          </div>
        </div>
      )}

      {/* LOGIN */}
      {showLogin && (
        <div style={modal}>
          <div style={box}>
            <input type="password" onChange={(e) => setPassword(e.target.value)} />
            <button
              onClick={() => {
                if (password === ADMIN_PASSWORD) {
                  setIsAdmin(true);
                  setShowLogin(false);
                }
              }}
            >
              Login
            </button>
          </div>
        </div>
      )}

      {/* PLAYER FORM */}
      {showPlayerModal && (
        <div style={modal}>
          <div style={box}>
            <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
            <button onClick={savePlayer}>Save</button>
          </div>
        </div>
      )}

      {/* TX FORM */}
      {showTxModal && (
        <div style={modal}>
          <div style={box}>
            <input
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />

            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option>Match</option>
              <option>Food</option>
              <option>Other</option>
            </select>

            <button onClick={saveTx}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

const modal = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const box = {
  background: "#111",
  padding: 20,
  borderRadius: 10,
  display: "flex",
  flexDirection: "column" as const,
  gap: 10,
}