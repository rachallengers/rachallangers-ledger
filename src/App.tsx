import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// ── CONFIG ─────────────────────────────────────────
const SUPABASE_URL = 'https://tcrsfnbauyjqglquivoj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcnNmbmJhdXlqcWdscXVpdm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MzEzMTUsImV4cCI6MjA5MzMwNzMxNX0.lbWX41JEEhFXEZzOkBN6wAUM3SS5czp3o6PtrLiO5yA';
const ADMIN_PASSWORD = 'rachal123';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── TYPES ─────────────────────────────────────────
type Player = { id: string; name: string };

type Transaction = {
  id: string;
  player_id: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  date: string;
};

// ── APP ─────────────────────────────────────────
export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [tx, setTx] = useState<Transaction[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [showTxModal, setShowTxModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const [form, setForm] = useState({
    amount: '',
    type: 'debit',
    category: 'Match',
  });

  // ── LOAD DATA ─────────────────────────────────
  const load = async () => {
    const p = await supabase.from('players').select('*');
    const t = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    setPlayers(p.data || []);
    setTx(t.data || []);
  };

  // ── REALTIME ─────────────────────────────────
  useEffect(() => {
    load();

    const channel = supabase
      .channel('live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        load
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        load
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── PLAYER CRUD ──────────────────────────────
  const savePlayer = async () => {
    if (!playerName.trim()) return;

    if (editingPlayer) {
      const { error } = await supabase
        .from('players')
        .update({ name: playerName })
        .eq('id', editingPlayer.id);

      if (error) return alert(error.message);
    } else {
      const { error } = await supabase.from('players').insert({
        id: crypto.randomUUID(),
        name: playerName,
      });

      if (error) return alert(error.message);
    }

    setPlayerName('');
    setEditingPlayer(null);
    setShowPlayerModal(false);
    load();
  };

  const deletePlayer = async (id: string) => {
    if (!confirm('Delete player?')) return;

    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) alert(error.message);
    else load();
  };

  // ── TRANSACTION ──────────────────────────────
  const saveTx = async () => {
    if (!selectedPlayer || !form.amount) return;

    const { error } = await supabase.from('transactions').insert({
      id: crypto.randomUUID(),
      player_id: selectedPlayer,
      amount: Number(form.amount),
      type: form.type,
      category: form.category,
      date: new Date().toISOString(),
    });

    if (error) alert(error.message);
    else {
      setShowTxModal(false);
      setForm({ amount: '', type: 'debit', category: 'Match' });
      load();
    }
  };

  // ── CALCULATE BALANCE ───────────────────────
  const stats: Record<string, any> = {};

  players.forEach((p) => {
    stats[p.id] = { credit: 0, debit: 0, balance: 0 };
  });

  tx.forEach((t) => {
    const s = stats[t.player_id];
    if (!s) return;

    if (t.type === 'credit') {
      s.credit += t.amount;
      s.balance += t.amount;
    } else {
      s.debit += t.amount;
      s.balance -= t.amount;
    }
  });

  // ── UI ──────────────────────────────────────
  return (
    <div
      style={{
        padding: 20,
        background: '#0a0a0a',
        minHeight: '100vh',
        color: '#fff',
      }}
    >
      <h1>🏆 RACHALLANGERS</h1>

      <button
        onClick={() => {
          const p = prompt('Admin password?');
          if (p === ADMIN_PASSWORD) setIsAdmin(true);
        }}
      >
        Admin Login
      </button>

      {isAdmin && (
        <button
          onClick={() => {
            setEditingPlayer(null);
            setPlayerName('');
            setShowPlayerModal(true);
          }}
          style={{ marginLeft: 10 }}
        >
          + Add Player
        </button>
      )}

      <hr />

      {players.map((p) => {
        const s = stats[p.id] || { credit: 0, debit: 0, balance: 0 };

        return (
          <div
            key={p.id}
            style={{
              background: '#111',
              padding: 15,
              borderRadius: 10,
              marginBottom: 10,
            }}
          >
            <h3>{p.name}</h3>

            <div>
              Credit ₹{s.credit} | Pending ₹{s.debit} | Balance{' '}
              <b style={{ color: s.balance >= 0 ? '#00C9A7' : '#FF6B35' }}>
                ₹{s.balance}
              </b>
            </div>

            {isAdmin && (
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => {
                    setSelectedPlayer(p.id);
                    setShowTxModal(true);
                  }}
                >
                  + Tx
                </button>

                <button
                  onClick={() => {
                    setEditingPlayer(p);
                    setPlayerName(p.name);
                    setShowPlayerModal(true);
                  }}
                  style={{ marginLeft: 10 }}
                >
                  Edit
                </button>

                <button
                  onClick={() => deletePlayer(p.id)}
                  style={{ marginLeft: 10 }}
                >
                  Delete
                </button>
              </div>
            )}

            <div style={{ marginTop: 10 }}>
              {tx
                .filter((t) => t.player_id === p.id)
                .map((t) => (
                  <div key={t.id}>
                    {t.date.slice(0, 10)} • {t.category} • {t.type} ₹{t.amount}
                  </div>
                ))}
            </div>
          </div>
        );
      })}

      {/* PLAYER MODAL */}
      {showPlayerModal && (
        <div style={modal}>
          <div style={box}>
            <h3>{editingPlayer ? 'Edit Player' : 'Add Player'}</h3>

            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Name"
            />

            <button onClick={savePlayer}>Save</button>
            <button onClick={() => setShowPlayerModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* TRANSACTION MODAL */}
      {showTxModal && (
        <div style={modal}>
          <div style={box}>
            <h3>Add Transaction</h3>

            <input
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />

            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </select>

            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option>Match</option>
              <option>Food</option>
              <option>Other</option>
            </select>

            <button onClick={saveTx}>Save</button>
            <button onClick={() => setShowTxModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── STYLES ──────────────────────────────────────
const modal = {
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const box = {
  background: '#111',
  padding: 20,
  borderRadius: 10,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 10,
};
