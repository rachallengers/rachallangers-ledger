import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://tcrsfnbauyjqglquivoj.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcnNmbmJhdXlqcWdscXVpdm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MzEzMTUsImV4cCI6MjA5MzMwNzMxNX0.lbWX41JEEhFXEZzOkBN6wAUM3SS5czp3o6PtrLiO5yA"
const ADMIN_PASSWORD = "rachal123"
const LOGO_URL = "https://i.ibb.co/V0my7sYq/039925f4-eab6-45a2-b640-f8bad2975157.png"

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const uid = () => Math.random().toString(36).slice(2, 9)

const ICONS = {
  plus: "M12 5v14M5 12h14",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  rupee: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  trendingUp: "M23 6l-9.5 9.5-5-5L1 18",
  trendingDown: "M23 18l-9.5-9.5-5 5L1 6",
  alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  chevronRight: "M9 18l6-6-6-6",
  chevronDown: "M6 9l6 6 6-6",
  chevronUp: "M18 15l-6-6-6 6",
  bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  home: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  x: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z",
  userPlus: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M13 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M20 1.13a4 4 0 010 7.75",
  clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
}

const Icon = ({ d, size = 20, color = "currentColor" }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

// Expense Categories
const EXPENSE_CATEGORIES = [
  { id: "food", name: "Food & Dining", icon: "🍔", color: "#FFD700" },
  { id: "transport", name: "Transport", icon: "🚗", color: "#4ECDC4" },
  { id: "utilities", name: "Utilities", icon: "⚡", color: "#FF6B6B" },
  { id: "matches", name: "Matches", icon: "🏏", color: "#95E1D3" },
]

type Player = { id: string; name: string; balance?: number }
type Transaction = {
  id: string; player_id: string; amount: number;
  type: "credit" | "debit"; date: string; note: string;
  category?: string; created_at?: string;
}
type Request = {
  id: string; player_id?: string; amount: number;
  note?: string; status: string; created_at?: string;
}

type Expense = {
  id: string; title: string; total_amount: number; date: string;
  category: string; contributors: { player_id: string; amount: number; weight: number }[];
  player_count: number; created_at?: string;
}

export default function App() {
  const [tab, setTab] = useState("dashboard")
  const [players, setPlayers] = useState<Player[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filter, setFilter] = useState<"all" | "debtors" | "creditors">("all")
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Players selection
  const [selected, setSelected] = useState<string[]>([])
  const [selectionMode, setSelectionMode] = useState(false)

  // Expense split
  const [expenseTitle, setExpenseTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [splitUsers, setSplitUsers] = useState<any[]>([])
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null)

  // Request
  const [reqAmount, setReqAmount] = useState("")
  const [reqNote, setReqNote] = useState("")
  const [reqPlayerId, setReqPlayerId] = useState("")

  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    const [playersRes, txRes, reqRes] = await Promise.all([
      supabase.from("players").select("*").order("created_at", { ascending: true }),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("credit_requests").select("*").order("created_at", { ascending: false }),
    ])
    
    if (playersRes.data) setPlayers(playersRes.data as Player[])
    if (txRes.data) setTransactions(txRes.data as Transaction[])
    if (reqRes.data) setRequests(reqRes.data as Request[])
  }

  useEffect(() => {
    if (sessionStorage.getItem("rl:isAdmin") === "yes") setIsAdmin(true)
    refresh()
    loadExpenses()
  }, [])

  useEffect(() => {
    const channel = supabase.channel("rl-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "credit_requests" }, refresh)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const loadExpenses = () => {
    const stored = localStorage.getItem("challengers:expenses")
    if (stored) setExpenses(JSON.parse(stored))
  }

  const saveExpenses = (exps: Expense[]) => {
    localStorage.setItem("challengers:expenses", JSON.stringify(exps))
    setExpenses(exps)
  }

  // Calculate balances
  const playerStats: Record<string, { credit: number; debit: number; balance: number }> = {}
  players.forEach((p) => { playerStats[p.id] = { credit: 0, debit: 0, balance: 0 } })
  transactions.forEach((t) => {
    const stat = playerStats[t.player_id]
    if (!stat) return
    if (t.type === "credit") { stat.credit += t.amount; stat.balance += t.amount }
    else { stat.debit += t.amount; stat.balance -= t.amount }
  })

  const totalBalance = Object.values(playerStats).filter((s) => s.balance > 0).reduce((a, b) => a + b.balance, 0)
  const totalPending = Math.abs(Object.values(playerStats).filter((s) => s.balance < 0).reduce((a, b) => a + b.balance, 0))
  const debtorCount = Object.values(playerStats).filter((s) => s.balance < 0).length
  const totalPlayers = players.length

  const filteredPlayers = players.filter(p => {
    const bal = playerStats[p.id]?.balance || 0
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    if (filter === "debtors") return bal < 0 && matchesSearch
    if (filter === "creditors") return bal > 0 && matchesSearch
    return matchesSearch
  })

  // Category totals
  const categoryTotals = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.id).reduce((sum, e) => sum + e.total_amount, 0)
  }))

  // ================= PLAYERS (ADMIN ONLY DEDUCT) =================

  const toggleSelect = (id: string) => {
    if (!isAdmin || !selectionMode) return
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const startSelection = (id: string) => {
    if (!isAdmin) return
    setSelectionMode(true)
    setSelected([id])
  }

  const bulkDeduct = async () => {
    if (!isAdmin) return
    const amt = Number(prompt("Enter amount to deduct"))
    if (!amt || amt <= 0) return

    for (const id of selected) {
      await supabase.from("transactions").insert({
        id: uid(),
        player_id: id,
        amount: amt,
        type: "debit",
        category: "Deduction",
        date: new Date().toISOString().slice(0, 10),
        note: "Admin deduction"
      })
    }

    setSelected([])
    setSelectionMode(false)
    refresh()
  }

  // ================= EXPENSE (ADMIN ONLY) =================

  const toggleSplitUser = (player: Player) => {
    if (!isAdmin) return
    const exists = splitUsers.find(u => u.id === player.id)
    if (exists) {
      setSplitUsers(prev => prev.filter(u => u.id !== player.id))
    } else {
      setSplitUsers(prev => [...prev, { ...player, weight: 1 }])
    }
  }

  const updateWeight = (id: string, weight: number) => {
    setSplitUsers(prev => prev.map(u => (u.id === id ? { ...u, weight } : u)))
  }

  const splits = () => {
    const total = Number(amount)
    if (!total || splitUsers.length === 0) return []
    const totalWeight = splitUsers.reduce((s, u) => s + u.weight, 0)
    return splitUsers.map(u => ({
      ...u,
      share: Math.round((u.weight / totalWeight) * total)
    }))
  }

  const applySplit = async () => {
    if (!isAdmin) {
      alert("Only admin can create expenses")
      return
    }
    if (loading) return
    if (!amount || splitUsers.length === 0 || !selectedCategory) {
      alert("Please enter amount, select players, and choose category")
      return
    }
    
    setLoading(true)

    const now = new Date().toISOString().slice(0, 10)

    for (const s of splits()) {
      await supabase.from("transactions").insert({
        id: uid(),
        player_id: s.id,
        amount: s.share,
        type: "debit",
        category: selectedCategory,
        date: now,
        note: expenseTitle || `${EXPENSE_CATEGORIES.find(c => c.id === selectedCategory)?.name} expense`
      })
    }

    const newExpense: Expense = {
      id: uid(),
      title: expenseTitle || EXPENSE_CATEGORIES.find(c => c.id === selectedCategory)?.name || "Expense",
      total_amount: Number(amount),
      date: now,
      category: selectedCategory,
      contributors: splits().map(s => ({ player_id: s.id, amount: s.share, weight: s.weight })),
      player_count: splitUsers.length,
      created_at: new Date().toISOString()
    }

    saveExpenses([newExpense, ...expenses])

    setLoading(false)
    setExpenseTitle("")
    setAmount("")
    setSelectedCategory("")
    setSplitUsers([])
    alert("Expense created ✅")
    setTab("dashboard")
    refresh()
  }

  // ================= REQUEST =================

  const sendRequest = async () => {
    if (!reqAmount || !reqPlayerId) {
      alert("Please enter amount and select a player")
      return
    }

    await supabase.from("credit_requests").insert({
      id: uid(),
      player_id: reqPlayerId,
      amount: Number(reqAmount),
      note: reqNote,
      status: "pending"
    })

    setReqAmount("")
    setReqNote("")
    setReqPlayerId("")
    alert("Request sent for admin approval ✅")
    refresh()
  }

  const approve = async (r: Request) => {
    if (!isAdmin) return
    if (!r.player_id) {
      alert("Error: No player ID in request")
      return
    }

    await supabase.from("transactions").insert({
      id: uid(),
      player_id: r.player_id,
      amount: r.amount,
      type: "credit",
      category: "Request",
      date: new Date().toISOString().slice(0, 10),
      note: r.note || "Approved request"
    })

    await supabase.from("credit_requests").update({ status: "approved" }).eq("id", r.id)
    refresh()
  }

  const reject = async (id: string) => {
    if (!isAdmin) return
    await supabase.from("credit_requests").update({ status: "rejected" }).eq("id", id)
    refresh()
  }

  // ================= UI =================

  return (
    <div style={styles.root}>
      {/* Header */}
      <header style={styles.header}>
        <button style={styles.menuBtn}>
          <div style={{ width: 20, height: 2, background: "#fff", margin: "4px 0" }} />
          <div style={{ width: 20, height: 2, background: "#fff", margin: "4px 0" }} />
          <div style={{ width: 20, height: 2, background: "#fff", margin: "4px 0" }} />
        </button>
        
        <div style={styles.headerCenter}>
          <img src={LOGO_URL} alt="Logo" style={styles.logoImg} />
          <div>
            <div style={styles.headerTitle}>CHALLENGERS</div>
            <div style={styles.headerSub}>
              Rohan Abhilasha {isAdmin && <span style={{ color: "#FFD700" }}>⚡ Admin</span>}
            </div>
          </div>
        </div>

        <button style={styles.bellBtn}>
          <Icon d={ICONS.bell} size={20} color="#fff" />
          {requests.filter(r => r.status === "pending").length > 0 && (
            <div style={styles.notifBadge}>{requests.filter(r => r.status === "pending").length}</div>
          )}
        </button>
      </header>

      {/* Main Content */}
      <main style={styles.main}>

        {/* DASHBOARD TAB */}
        {tab === "dashboard" && (
          <div style={styles.page}>
            {/* Main Balance Card */}
            <div style={styles.balanceCard}>
              <div style={styles.balanceHeader}>
                <span style={styles.balanceLabel}>TOTAL BALANCE</span>
                <Icon d={ICONS.eye} size={18} color="#A8D5A2" />
              </div>
              <div style={styles.balanceAmount}>₹{totalBalance.toLocaleString()}</div>
              <div style={styles.balanceGrowth}>
                <Icon d={ICONS.trendingUp} size={14} color="#A8D5A2" />
                <span>12.5% vs last month</span>
              </div>
              <div style={styles.cricketBg}>
                <div style={styles.cricketPlayer} />
              </div>
            </div>

            {/* Stats Grid */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statHeader}>
                  <span style={styles.statLabel}>PENDING DUES</span>
                  <Icon d={ICONS.alert} size={16} color="#FF6B6B" />
                </div>
                <div style={styles.statAmount}>₹{totalPending.toLocaleString()}</div>
                <div style={styles.statFooter}>{debtorCount} players</div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statHeader}>
                  <span style={styles.statLabel}>TOTAL PLAYERS</span>
                  <Icon d={ICONS.users} size={16} color="#4ECDC4" />
                </div>
                <div style={styles.statAmount}>{totalPlayers}</div>
                <div style={styles.statFooter}>Squad Size</div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statHeader}>
                  <span style={styles.statLabel}>OVERDUE PLAYERS</span>
                  <Icon d={ICONS.clock} size={16} color="#FFD700" />
                </div>
                <div style={styles.statAmount}>{debtorCount}</div>
                <div style={styles.statFooter}>Need Attention</div>
              </div>
            </div>

            {/* Quick Actions */}
            {isAdmin && (
              <div style={styles.quickActions}>
                <div style={styles.sectionTitle}>QUICK ACTIONS</div>
                <div style={styles.actionGrid}>
                  <button style={styles.actionBtn} onClick={() => setTab("players")}>
                    <Icon d={ICONS.userPlus} size={24} color="#A8D5A2" />
                    <span>Add Player</span>
                  </button>
                  <button style={styles.actionBtn} onClick={() => setTab("more")}>
                    <Icon d={ICONS.rupee} size={24} color="#4ECDC4" />
                    <span>Add Expense</span>
                  </button>
                  <button style={styles.actionBtn} onClick={() => setTab("more")}>
                    <Icon d={ICONS.activity} size={24} color="#FFD700" />
                    <span>Split Bill</span>
                  </button>
                  <button style={styles.actionBtn} onClick={() => setTab("players")}>
                    <Icon d={ICONS.shield} size={24} color="#FF6B6B" />
                    <span>Settle Dues</span>
                  </button>
                </div>
              </div>
            )}

            {/* Debtor Alert */}
            {debtorCount > 0 && (
              <div style={styles.alertBox}>
                <Icon d={ICONS.alert} size={20} color="#FF6B6B" />
                <div style={{ flex: 1 }}>
                  <div style={styles.alertTitle}>{debtorCount} players have pending dues</div>
                  <div style={styles.alertDesc}>Keep track and collect on time.</div>
                </div>
                <button style={styles.alertBtn} onClick={() => setTab("players")}>
                  VIEW DEBTORS
                </button>
              </div>
            )}

            {/* Recent Activity */}
            <div style={{ marginTop: 24 }}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionTitle}>RECENT ACTIVITY</span>
                <button style={styles.viewAllBtn}>View All</button>
              </div>
              <div style={styles.activityList}>
                {transactions.slice(0, 5).map(tx => {
                  const player = players.find(p => p.id === tx.player_id)
                  return (
                    <div key={tx.id} style={styles.activityItem}>
                      <div style={{
                        ...styles.activityAvatar,
                        background: tx.type === "credit" ? "#A8D5A233" : "#FF6B6B33"
                      }}>
                        {player?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={styles.activityName}>{player?.name}</div>
                        <div style={styles.activityStatus}>{tx.type === "credit" ? "Creditor" : "Pending dues"}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{
                          color: tx.type === "credit" ? "#A8D5A2" : "#FF6B6B",
                          fontWeight: 700,
                          fontSize: 15
                        }}>
                          {tx.type === "credit" ? "+" : "-"}₹{tx.amount}
                        </div>
                        <div style={styles.activityTime}>
                          {new Date(tx.date).toLocaleDateString()}
                        </div>
                      </div>
                      <button style={styles.moreBtn}>⋮</button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* PLAYERS TAB */}
        {tab === "players" && (
          <div style={styles.page}>
            <div style={styles.pageHeader}>
              <button style={styles.backBtn} onClick={() => setTab("dashboard")}>
                ←
              </button>
              <h2 style={styles.pageTitle}>Players</h2>
              {isAdmin && (
                <button style={styles.addPlayerBtn}>
                  <Icon d={ICONS.userPlus} size={20} color="#A8D5A2" />
                </button>
              )}
            </div>

            {/* Search & Filter */}
            <div style={styles.searchBar}>
              <Icon d={ICONS.search} size={18} color="#6B7280" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search players..."
                style={styles.searchInput}
              />
              <button style={styles.filterIconBtn}>
                <Icon d={ICONS.filter} size={18} color="#A8D5A2" />
              </button>
            </div>

            <div style={styles.filterTabs}>
              <button
                style={{ ...styles.filterTab, ...(filter === "all" ? styles.filterTabActive : {}) }}
                onClick={() => setFilter("all")}
              >
                All ({players.length})
              </button>
              <button
                style={{ ...styles.filterTab, ...(filter === "debtors" ? styles.filterTabActive : {}) }}
                onClick={() => setFilter("debtors")}
              >
                Debtors ({debtorCount})
              </button>
              <button
                style={{ ...styles.filterTab, ...(filter === "creditors" ? styles.filterTabActive : {}) }}
                onClick={() => setFilter("creditors")}
              >
                Creditors ({players.length - debtorCount})
              </button>
            </div>

            <div style={styles.playersList}>
              {filteredPlayers.map(p => {
                const bal = playerStats[p.id]?.balance || 0
                const isDebtor = bal < 0
                return (
                  <div
                    key={p.id}
                    onClick={() => isAdmin && (selectionMode ? toggleSelect(p.id) : startSelection(p.id))}
                    style={{
                      ...styles.playerCard,
                      ...(selected.includes(p.id) ? styles.playerCardSelected : {})
                    }}
                  >
                    <div style={{
                      ...styles.playerAvatar,
                      background: isDebtor ? "#FF6B6B" : "#A8D5A2"
                    }}>
                      {p.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.playerName}>{p.name}</div>
                      <div style={styles.playerStatus}>
                        {isDebtor ? "Pending dues" : "Creditor"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        color: bal >= 0 ? "#A8D5A2" : "#FF6B6B",
                        fontWeight: 900,
                        fontSize: 18
                      }}>
                        {bal >= 0 ? "+" : ""}₹{bal.toFixed(0)}
                      </div>
                    </div>
                    <button style={styles.chevronBtn}>
                      <Icon d={ICONS.chevronRight} size={16} color="#6B7280" />
                    </button>
                  </div>
                )
              })}
            </div>

            {isAdmin && selectionMode && selected.length > 0 && (
              <div style={styles.floatingActionBar}>
                <span style={{ color: "#fff", fontWeight: 600 }}>{selected.length} selected</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={styles.cancelBtn}
                    onClick={() => { setSelectionMode(false); setSelected([]) }}
                  >
                    Cancel
                  </button>
                  <button style={styles.deductBtn} onClick={bulkDeduct}>
                    Deduct ₹
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EXPENSES TAB */}
        {tab === "expenses" && (
          <div style={styles.page}>
            <div style={styles.pageHeader}>
              <button style={styles.backBtn} onClick={() => setTab("dashboard")}>←</button>
              <h2 style={styles.pageTitle}>Expenses</h2>
              <div style={{ width: 40 }} />
            </div>

            {/* Category Breakdown */}
            <div style={styles.categoryBreakdown}>
              {categoryTotals.map(cat => (
                <div key={cat.id} style={styles.categoryCard}>
                  <div style={styles.categoryIcon}>{cat.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.categoryName}>{cat.name}</div>
                    <div style={styles.categoryAmount}>₹{cat.total.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Expense History */}
            <div style={{ marginTop: 24 }}>
              <div style={styles.sectionTitle}>EXPENSE HISTORY</div>
              {expenses.length > 0 ? (
                <div style={styles.expensesList}>
                  {expenses.map(exp => {
                    const category = EXPENSE_CATEGORIES.find(c => c.id === exp.category)
                    return (
                      <div key={exp.id} style={styles.expenseCard}>
                        <div style={styles.expenseHeader}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={styles.expenseIcon}>{category?.icon || "📦"}</div>
                            <div>
                              <div style={styles.expenseTitle}>{exp.title}</div>
                              <div style={styles.expenseDate}>{new Date(exp.date).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={styles.expenseAmount}>₹{exp.total_amount}</div>
                            <div style={styles.expenseCount}>{exp.player_count} players</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedExpense(expandedExpense === exp.id ? null : exp.id)}
                          style={styles.expandBtn}
                        >
                          Details
                          <Icon d={expandedExpense === exp.id ? ICONS.chevronUp : ICONS.chevronDown} size={14} />
                        </button>
                        {expandedExpense === exp.id && (
                          <div style={styles.expenseDetails}>
                            {exp.contributors.map(c => {
                              const player = players.find(p => p.id === c.player_id)
                              return (
                                <div key={c.player_id} style={styles.contributorRow}>
                                  <span>{player?.name} ({c.weight}x)</span>
                                  <span>₹{c.amount}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={styles.emptyState}>No expenses yet</div>
              )}
            </div>
          </div>
        )}

        {/* MORE TAB (Create Expense + Recharges) */}
        {tab === "more" && (
          <div style={styles.page}>
            <div style={styles.pageHeader}>
              <button style={styles.backBtn} onClick={() => setTab("dashboard")}>←</button>
              <h2 style={styles.pageTitle}>More</h2>
              <div style={{ width: 40 }} />
            </div>

            {/* Create Expense Section */}
            {isAdmin ? (
              <div style={styles.createExpenseBox}>
                <h3 style={styles.boxTitle}>Create Expense</h3>
                
                <input
                  value={expenseTitle}
                  onChange={e => setExpenseTitle(e.target.value)}
                  placeholder="Expense title"
                  style={styles.input}
                />

                <input
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Total amount (₹)"
                  type="number"
                  style={{ ...styles.input, marginTop: 12 }}
                />

                <div style={styles.formLabel}>Category</div>
                <div style={styles.categorySelector}>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        ...styles.categorySelectBtn,
                        ...(selectedCategory === cat.id ? styles.categorySelectBtnActive : {})
                      }}
                    >
                      <span style={{ fontSize: 24 }}>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>

                <div style={styles.formLabel}>Select Contributors</div>
                <div style={styles.contributorList}>
                  {players.map(p => {
                    const sel = splitUsers.find(s => s.id === p.id)
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleSplitUser(p)}
                        style={{
                          ...styles.contributorItem,
                          ...(sel ? styles.contributorItemActive : {})
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={styles.contributorAvatar}>{p.name?.[0]?.toUpperCase()}</div>
                          <span>{p.name}</span>
                        </div>
                        {sel && (
                          <select
                            value={sel.weight}
                            onChange={e => updateWeight(p.id, Number(e.target.value))}
                            style={styles.weightSelect}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value={1}>1x</option>
                            <option value={2}>2x</option>
                            <option value={3}>3x</option>
                            <option value={4}>4x</option>
                          </select>
                        )}
                      </div>
                    )
                  })}
                </div>

                {splits().length > 0 && (
                  <div style={styles.splitPreview}>
                    <div style={styles.formLabel}>Split Preview</div>
                    {splits().map(s => (
                      <div key={s.id} style={styles.splitRow}>
                        <span>{s.name} ({s.weight}x)</span>
                        <span style={{ color: "#A8D5A2", fontWeight: 700 }}>₹{s.share}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={applySplit}
                  disabled={loading}
                  style={styles.createExpenseBtn}
                >
                  {loading ? "Creating..." : "Create Expense"}
                </button>
              </div>
            ) : (
              <div style={styles.lockedBox}>
                <Icon d={ICONS.shield} size={48} color="#6B7280" />
                <p style={{ color: "#9CA3AF", marginTop: 12 }}>Admin access required</p>
                <button style={styles.loginBtn} onClick={() => setShowLogin(true)}>
                  Login as Admin
                </button>
              </div>
            )}

            {/* Recharges Section */}
            <div style={{ ...styles.createExpenseBox, marginTop: 24 }}>
              <h3 style={styles.boxTitle}>Request Credit</h3>
              
              <select
                value={reqPlayerId}
                onChange={e => setReqPlayerId(e.target.value)}
                style={styles.input}
              >
                <option value="">Select Player</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <input
                value={reqAmount}
                onChange={e => setReqAmount(e.target.value)}
                placeholder="Amount (₹)"
                type="number"
                style={{ ...styles.input, marginTop: 12 }}
              />

              <input
                value={reqNote}
                onChange={e => setReqNote(e.target.value)}
                placeholder="Note (optional)"
                style={{ ...styles.input, marginTop: 12 }}
              />

              <button
                onClick={sendRequest}
                style={{ ...styles.createExpenseBtn, background: "#4ECDC4" }}
              >
                Submit Request
              </button>
            </div>

            {/* Admin Approvals */}
            {isAdmin && (
              <div style={{ marginTop: 24 }}>
                <div style={styles.sectionTitle}>ADMIN: ALL REQUESTS</div>
                {requests.length > 0 ? (
                  <div style={styles.requestsList}>
                    {requests.map(r => {
                      const player = players.find(p => p.id === r.player_id)
                      return (
                        <div key={r.id} style={styles.requestCard}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                              <div style={styles.requestAvatar}>{player?.name?.[0]?.toUpperCase()}</div>
                              <div>
                                <div style={styles.requestPlayer}>{player?.name || "Unknown"}</div>
                                <div style={styles.requestDate}>
                                  {new Date(r.created_at || "").toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div style={styles.requestAmount}>₹{r.amount}</div>
                            {r.note && <div style={styles.requestNote}>{r.note}</div>}
                            <div style={{
                              ...styles.statusBadge,
                              background: r.status === "approved" ? "#A8D5A233" : r.status === "rejected" ? "#FF6B6B33" : "#FFD70033",
                              color: r.status === "approved" ? "#A8D5A2" : r.status === "rejected" ? "#FF6B6B" : "#FFD700"
                            }}>
                              ● {r.status.toUpperCase()}
                            </div>
                          </div>

                          {r.status === "pending" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              <button onClick={() => approve(r)} style={styles.approveBtn}>
                                ✓ Approve
                              </button>
                              <button onClick={() => reject(r.id)} style={styles.rejectBtn}>
                                × Reject
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={styles.emptyState}>No requests yet</div>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Bottom Navigation */}
      <footer style={styles.nav}>
        <button onClick={() => setTab("dashboard")} style={styles.navBtn}>
          <Icon d={ICONS.home} size={24} color={tab === "dashboard" ? "#A8D5A2" : "#6B7280"} />
          <span style={{ color: tab === "dashboard" ? "#A8D5A2" : "#9CA3AF" }}>Dashboard</span>
        </button>
        <button onClick={() => setTab("players")} style={styles.navBtn}>
          <Icon d={ICONS.users} size={24} color={tab === "players" ? "#A8D5A2" : "#6B7280"} />
          <span style={{ color: tab === "players" ? "#A8D5A2" : "#9CA3AF" }}>Players</span>
        </button>
        <button onClick={() => setTab("more")} style={{ ...styles.navBtn, position: "relative", top: -15 }}>
          <div style={styles.fabButton}>
            <Icon d={ICONS.plus} size={28} color="#0A1F1A" />
          </div>
        </button>
        <button onClick={() => setTab("expenses")} style={styles.navBtn}>
          <Icon d={ICONS.list} size={24} color={tab === "expenses" ? "#A8D5A2" : "#6B7280"} />
          <span style={{ color: tab === "expenses" ? "#A8D5A2" : "#9CA3AF" }}>Expenses</span>
        </button>
        <button onClick={() => isAdmin ? (setIsAdmin(false), sessionStorage.removeItem("rl:isAdmin")) : setShowLogin(true)} style={styles.navBtn}>
          <Icon d={isAdmin ? ICONS.shield : ICONS.user} size={24} color={isAdmin ? "#FFD700" : "#6B7280"} />
          <span style={{ color: isAdmin ? "#FFD700" : "#9CA3AF" }}>Profile</span>
        </button>
      </footer>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => { setIsAdmin(true); sessionStorage.setItem("rl:isAdmin", "yes"); setShowLogin(false) }}
        />
      )}
    </div>
  )
}

function LoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [pw, setPw] = useState("")
  const [err, setErr] = useState(false)
  const submit = () => { if (pw === ADMIN_PASSWORD) onSuccess(); else setErr(true) }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={{ color: "#E5E7EB", fontSize: 18, margin: 0 }}>Admin Login</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            <Icon d={ICONS.x} size={20} color="#6B7280" />
          </button>
        </div>
        <div style={{ padding: "20px" }}>
          <input
            type="password" value={pw} autoFocus
            onChange={(e) => { setPw(e.target.value); setErr(false) }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Enter admin password"
            style={styles.input}
          />
          {err && <div style={{ color: "#FF6B6B", fontSize: 12, marginTop: 8 }}>Wrong password</div>}
        </div>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #1F2937", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...styles.loginBtn, background: "#A8D5A2" }} onClick={submit}>Login</button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: { 
    display: "flex", flexDirection: "column", minHeight: "100vh",
    background: "#0A1F1A",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#E5E7EB"
  },
  header: { 
    background: "linear-gradient(135deg, #0F2922 0%, #0A1F1A 100%)",
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #1F2937"
  },
  menuBtn: { background: "none", border: "none", cursor: "pointer", padding: 8 },
  headerCenter: { display: "flex", alignItems: "center", gap: 12, flex: 1, justifyContent: "center" },
  logoImg: { width: 40, height: 40, borderRadius: 8 },
  headerTitle: { fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: 1 },
  headerSub: { fontSize: 11, color: "#9CA3AF" },
  bellBtn: { 
    background: "none", border: "none", cursor: "pointer", position: "relative", padding: 8 
  },
  notifBadge: { 
    position: "absolute", top: 4, right: 4, background: "#FF6B6B",
    borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center", color: "#fff"
  },
  main: { flex: 1, overflow: "auto", paddingBottom: 100 },
  page: { padding: "0 0 20px" },
  pageHeader: { 
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px", marginBottom: 20
  },
  backBtn: { 
    background: "#1F2937", border: "none", color: "#fff", borderRadius: 8,
    width: 40, height: 40, fontSize: 20, cursor: "pointer"
  },
  pageTitle: { fontSize: 24, fontWeight: 900, color: "#fff", flex: 1, textAlign: "center" },
  addPlayerBtn: { 
    background: "none", border: "none", cursor: "pointer", padding: 8
  },
  balanceCard: { 
    background: "linear-gradient(135deg, #1F4A3C 0%, #0F2922 100%)",
    borderRadius: 20, margin: "0 20px 20px", padding: 24, position: "relative",
    overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
  },
  balanceHeader: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  balanceLabel: { fontSize: 12, color: "#A8D5A2", fontWeight: 700 },
  balanceAmount: { fontSize: 42, fontWeight: 900, color: "#fff", marginBottom: 8 },
  balanceGrowth: { 
    display: "flex", alignItems: "center", gap: 4, color: "#A8D5A2",
    fontSize: 13, fontWeight: 600
  },
  cricketBg: { 
    position: "absolute", right: -20, bottom: -20, width: 200, height: 200,
    opacity: 0.1, pointerEvents: "none"
  },
  cricketPlayer: { 
    width: "100%", height: "100%",
    background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"white\"/></svg>')",
    backgroundSize: "contain"
  },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "0 20px 20px" },
  statCard: { 
    background: "#1F2937", borderRadius: 12, padding: 16,
    border: "1px solid #374151"
  },
  statHeader: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  statLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: 600 },
  statAmount: { fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 4 },
  statFooter: { fontSize: 11, color: "#6B7280" },
  quickActions: { padding: "0 20px 20px" },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginBottom: 12 },
  actionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 },
  actionBtn: { 
    background: "#1F2937", border: "1px solid #374151", borderRadius: 12,
    padding: "16px 8px", display: "flex", flexDirection: "column", alignItems: "center",
    gap: 8, cursor: "pointer", color: "#E5E7EB", fontSize: 11, fontWeight: 600
  },
  alertBox: { 
    background: "#2D1F1F", border: "1px solid #4A2828", borderRadius: 12,
    padding: 16, margin: "0 20px 20px", display: "flex", alignItems: "center", gap: 12
  },
  alertTitle: { fontSize: 14, fontWeight: 600, color: "#FF6B6B", marginBottom: 2 },
  alertDesc: { fontSize: 12, color: "#9CA3AF" },
  alertBtn: { 
    background: "#FF6B6B", color: "#fff", border: "none", borderRadius: 6,
    padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer",
    marginLeft: "auto", whiteSpace: "nowrap"
  },
  sectionHeader: { 
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0 20px", marginBottom: 12
  },
  viewAllBtn: { 
    background: "none", border: "none", color: "#A8D5A2",
    fontSize: 13, fontWeight: 600, cursor: "pointer"
  },
  activityList: { padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 },
  activityItem: { 
    background: "#1F2937", borderRadius: 12, padding: 16,
    display: "flex", alignItems: "center", gap: 12, border: "1px solid #374151"
  },
  activityAvatar: { 
    width: 44, height: 44, borderRadius: "50%", display: "flex",
    alignItems: "center", justifyContent: "center", fontWeight: 700,
    fontSize: 16, color: "#fff"
  },
  activityName: { fontSize: 15, fontWeight: 600, color: "#E5E7EB", marginBottom: 2 },
  activityStatus: { fontSize: 11, color: "#9CA3AF" },
  activityTime: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  moreBtn: { background: "none", border: "none", color: "#6B7280", fontSize: 20, cursor: "pointer", padding: "0 8px" },
  searchBar: { 
    display: "flex", alignItems: "center", gap: 12, background: "#1F2937",
    border: "1px solid #374151", borderRadius: 12, padding: "12px 16px",
    margin: "0 20px 16px"
  },
  searchInput: { 
    flex: 1, background: "none", border: "none", color: "#E5E7EB",
    fontSize: 14, outline: "none"
  },
  filterIconBtn: { background: "none", border: "none", cursor: "pointer", padding: 4 },
  filterTabs: { display: "flex", gap: 8, padding: "0 20px", marginBottom: 20 },
  filterTab: { 
    flex: 1, background: "#1F2937", border: "1px solid #374151",
    borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600,
    color: "#9CA3AF", cursor: "pointer"
  },
  filterTabActive: { background: "#A8D5A233", borderColor: "#A8D5A2", color: "#A8D5A2" },
  playersList: { padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 },
  playerCard: { 
    background: "#1F2937", borderRadius: 12, padding: 16,
    display: "flex", alignItems: "center", gap: 12, border: "1px solid #374151",
    cursor: "pointer"
  },
  playerCardSelected: { borderColor: "#A8D5A2", background: "#A8D5A233" },
  playerAvatar: { 
    width: 48, height: 48, borderRadius: "50%", display: "flex",
    alignItems: "center", justifyContent: "center", fontWeight: 900,
    fontSize: 18, color: "#fff"
  },
  playerName: { fontSize: 16, fontWeight: 600, color: "#E5E7EB", marginBottom: 2 },
  playerStatus: { fontSize: 11, color: "#9CA3AF" },
  chevronBtn: { background: "none", border: "none", cursor: "pointer", padding: 4 },
  floatingActionBar: { 
    position: "fixed", bottom: 80, left: 20, right: 20, background: "#1F2937",
    borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between",
    alignItems: "center", border: "1px solid #374151", boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
  },
  cancelBtn: { 
    background: "#374151", color: "#E5E7EB", border: "none", borderRadius: 8,
    padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14
  },
  deductBtn: { 
    background: "#FF6B6B", color: "#fff", border: "none", borderRadius: 8,
    padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14
  },
  categoryBreakdown: { padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 },
  categoryCard: { 
    background: "#1F2937", border: "1px solid #374151", borderRadius: 12,
    padding: 16, display: "flex", alignItems: "center", gap: 12
  },
  categoryIcon: { fontSize: 32 },
  categoryName: { fontSize: 12, color: "#9CA3AF", marginBottom: 4 },
  categoryAmount: { fontSize: 16, fontWeight: 700, color: "#E5E7EB" },
  expensesList: { padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 },
  expenseCard: { background: "#1F2937", borderRadius: 12, padding: 16, border: "1px solid #374151" },
  expenseHeader: { display: "flex", justifyContent: "space-between", marginBottom: 12 },
  expenseIcon: { fontSize: 28 },
  expenseTitle: { fontSize: 15, fontWeight: 600, color: "#E5E7EB", marginBottom: 2 },
  expenseDate: { fontSize: 11, color: "#6B7280" },
  expenseAmount: { fontSize: 18, fontWeight: 900, color: "#A8D5A2", marginBottom: 2 },
  expenseCount: { fontSize: 11, color: "#6B7280" },
  expandBtn: { 
    background: "none", border: "none", color: "#A8D5A2", fontSize: 13,
    fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center",
    gap: 4, padding: "8px 0"
  },
  expenseDetails: { 
    marginTop: 12, paddingTop: 12, borderTop: "1px solid #374151",
    display: "flex", flexDirection: "column", gap: 6
  },
  contributorRow: { 
    display: "flex", justifyContent: "space-between", fontSize: 13,
    color: "#9CA3AF", padding: "4px 0"
  },
  emptyState: { 
    textAlign: "center", padding: 40, color: "#6B7280", fontSize: 14
  },
  createExpenseBox: { 
    background: "#1F2937", borderRadius: 12, padding: 20,
    margin: "0 20px", border: "1px solid #374151"
  },
  boxTitle: { fontSize: 16, fontWeight: 700, color: "#E5E7EB", marginBottom: 16 },
  input: { 
    width: "100%", background: "#0A1F1A", border: "1px solid #374151",
    color: "#E5E7EB", borderRadius: 8, padding: 12, fontSize: 14,
    boxSizing: "border-box"
  },
  formLabel: { fontSize: 12, fontWeight: 600, color: "#9CA3AF", marginTop: 16, marginBottom: 12 },
  categorySelector: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  categorySelectBtn: { 
    background: "#0A1F1A", border: "2px solid #374151", borderRadius: 8,
    padding: "12px", display: "flex", flexDirection: "column", alignItems: "center",
    gap: 4, cursor: "pointer", color: "#9CA3AF", fontSize: 11, fontWeight: 600
  },
  categorySelectBtnActive: { borderColor: "#A8D5A2", background: "#A8D5A233" },
  contributorList: { display: "flex", flexDirection: "column", gap: 8 },
  contributorItem: { 
    background: "#0A1F1A", border: "1px solid #374151", borderRadius: 8,
    padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center",
    cursor: "pointer", color: "#E5E7EB", fontSize: 14
  },
  contributorItemActive: { borderColor: "#A8D5A2", background: "#A8D5A233" },
  contributorAvatar: { 
    width: 32, height: 32, borderRadius: "50%", background: "#374151",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 14, color: "#fff"
  },
  weightSelect: { 
    background: "#1F2937", color: "#E5E7EB", border: "1px solid #374151",
    borderRadius: 6, padding: "6px 12px", fontSize: 13, fontWeight: 600
  },
  splitPreview: { 
    background: "#0A1F1A", borderRadius: 8, padding: 16, marginTop: 16,
    border: "1px solid #374151"
  },
  splitRow: { 
    display: "flex", justifyContent: "space-between", padding: "6px 0",
    fontSize: 13, color: "#9CA3AF", borderBottom: "1px solid #374151"
  },
  createExpenseBtn: { 
    width: "100%", background: "#A8D5A2", color: "#0A1F1A", border: "none",
    borderRadius: 8, padding: 14, fontSize: 14, fontWeight: 700,
    cursor: "pointer", marginTop: 20
  },
  lockedBox: { 
    background: "#1F2937", borderRadius: 12, padding: 40, margin: "0 20px",
    border: "1px solid #374151", display: "flex", flexDirection: "column",
    alignItems: "center", textAlign: "center"
  },
  loginBtn: { 
    background: "#A8D5A2", color: "#0A1F1A", border: "none", borderRadius: 8,
    padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer",
    marginTop: 16
  },
  requestsList: { padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 },
  requestCard: { 
    background: "#1F2937", borderRadius: 12, padding: 16,
    display: "flex", alignItems: "center", gap: 12, border: "1px solid #374151"
  },
  requestAvatar: { 
    width: 36, height: 36, borderRadius: "50%", background: "#374151",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 14, color: "#fff"
  },
  requestPlayer: { fontSize: 14, fontWeight: 600, color: "#E5E7EB" },
  requestDate: { fontSize: 11, color: "#6B7280" },
  requestAmount: { fontSize: 18, fontWeight: 900, color: "#A8D5A2", marginTop: 8 },
  requestNote: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  statusBadge: { 
    display: "inline-block", padding: "4px 12px", borderRadius: 12,
    fontSize: 10, fontWeight: 600, marginTop: 8
  },
  approveBtn: { 
    background: "#A8D5A2", color: "#0A1F1A", border: "none", borderRadius: 6,
    padding: "10px 16px", fontWeight: 600, cursor: "pointer", fontSize: 13
  },
  rejectBtn: { 
    background: "#FF6B6B", color: "#fff", border: "none", borderRadius: 6,
    padding: "10px 16px", fontWeight: 600, cursor: "pointer", fontSize: 13
  },
  nav: { 
    position: "fixed", bottom: 0, left: 0, right: 0, background: "#0F2922",
    borderTop: "1px solid #1F2937", display: "flex", justifyContent: "space-around",
    padding: "12px 0 20px", boxShadow: "0 -4px 12px rgba(0,0,0,0.3)"
  },
  navBtn: { 
    background: "none", border: "none", display: "flex", flexDirection: "column",
    alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11,
    fontWeight: 600, padding: "4px 12px"
  },
  fabButton: { 
    background: "linear-gradient(135deg, #A8D5A2 0%, #8FBC8F 100%)",
    borderRadius: "50%", width: 56, height: 56, display: "flex",
    alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 12px rgba(168, 213, 162, 0.4)"
  },
  overlay: { 
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, zIndex: 1000
  },
  modal: { 
    background: "#1F2937", borderRadius: 12, width: "100%", maxWidth: 360,
    border: "1px solid #374151", boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
  },
  modalHeader: { 
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px", borderBottom: "1px solid #374151"
  },
  closeBtn: { background: "none", border: "none", cursor: "pointer", padding: 4 },
}
