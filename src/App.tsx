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
  minus: "M5 12h14",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  rupee: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  trendingUp: "M23 6l-9.5 9.5-5-5L1 18",
  alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  chevronRight: "M9 18l6-6-6-6",
  chevronDown: "M6 9l6 6 6-6",
  bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  home: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z",
  x: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  userPlus: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M13 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M20 1.13a4 4 0 010 7.75",
  car: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10l-1.5-3c-.3-.6-.9-1-1.6-1H9c-.7 0-1.3.4-1.6 1L6 10s-2.7.6-4.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2M7 17a2 2 0 100-4 2 2 0 000 4zM15 17a2 2 0 100-4 2 2 0 000 4z",
  calendar: "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18",
  moreVertical: "M12 13a1 1 0 100-2 1 1 0 000 2zM12 6a1 1 0 100-2 1 1 0 000 2zM12 20a1 1 0 100-2 1 1 0 000 2z",
}

const Icon = ({ d, size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const EXPENSE_CATEGORIES = [
  { id: "food", name: "Food & Dining", icon: "🍔", color: "#FFD700" },
  { id: "transport", name: "Transport", icon: "🚗", color: "#4ECDC4" },
  { id: "utilities", name: "Utilities", icon: "⚡", color: "#FF6B6B" },
  { id: "matches", name: "Matches", icon: "🏏", color: "#95E1D3" },
]

export default function App() {
  const [tab, setTab] = useState("dashboard")
  const [players, setPlayers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [requests, setRequests] = useState([])
  const [expenses, setExpenses] = useState([])
  const [filter, setFilter] = useState("all")
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const [selected, setSelected] = useState([])
  const [selectionMode, setSelectionMode] = useState(false)
  const [actionType, setActionType] = useState("debit") // "debit" or "credit"

  const [expenseTitle, setExpenseTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [splitUsers, setSplitUsers] = useState([])
  const [vehicleCredits, setVehicleCredits] = useState([])
  const [expandedExpense, setExpandedExpense] = useState(null)

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
    
    if (playersRes.data) setPlayers(playersRes.data)
    if (txRes.data) setTransactions(txRes.data)
    if (reqRes.data) setRequests(reqRes.data)
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

  const saveExpenses = (exps) => {
    localStorage.setItem("challengers:expenses", JSON.stringify(exps))
    setExpenses(exps)
  }

  const playerStats = {}
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

  const filteredPlayers = players.filter(p => {
    const bal = playerStats[p.id]?.balance || 0
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    if (filter === "debtors") return bal < 0 && matchesSearch
    if (filter === "creditors") return bal > 0 && matchesSearch
    return matchesSearch
  })

  const categoryTotals = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.id).reduce((sum, e) => sum + e.total_amount, 0)
  }))

  // ================= PLAYERS (ADMIN CREDIT/DEBIT) =================

  const toggleSelect = (id) => {
    if (!isAdmin || !selectionMode) return
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const startSelection = (id, type = "debit") => {
    if (!isAdmin) return
    setSelectionMode(true)
    setActionType(type)
    setSelected([id])
  }

  const bulkAction = async () => {
    if (!isAdmin) return
    const amt = Number(prompt(`Enter amount to ${actionType === "credit" ? "add" : "deduct"}`))
    if (!amt || amt <= 0) return

    for (const id of selected) {
      await supabase.from("transactions").insert({
        id: uid(),
        player_id: id,
        amount: amt,
        type: actionType,
        category: actionType === "credit" ? "Credit" : "Deduction",
        date: new Date().toISOString().slice(0, 10),
        note: `Admin ${actionType}`
      })
    }

    setSelected([])
    setSelectionMode(false)
    refresh()
  }

  // ================= EXPENSE WITH VEHICLE CREDITS =================

  const toggleSplitUser = (player) => {
    if (!isAdmin) return
    const exists = splitUsers.find(u => u.id === player.id)
    if (exists) {
      setSplitUsers(prev => prev.filter(u => u.id !== player.id))
      setVehicleCredits(prev => prev.filter(v => v.player_id !== player.id))
    } else {
      setSplitUsers(prev => [...prev, { ...player, weight: 1 }])
    }
  }

  const updateWeight = (id, weight) => {
    setSplitUsers(prev => prev.map(u => (u.id === id ? { ...u, weight } : u)))
  }

  const toggleVehicleCredit = (player_id) => {
    const exists = vehicleCredits.find(v => v.player_id === player_id)
    if (exists) {
      setVehicleCredits(prev => prev.filter(v => v.player_id !== player_id))
    } else {
      setVehicleCredits(prev => [...prev, { player_id, vehicle_cost: 0 }])
    }
  }

  const updateVehicleCost = (player_id, cost) => {
    setVehicleCredits(prev => prev.map(v => v.player_id === player_id ? { ...v, vehicle_cost: cost } : v))
  }

  const splits = () => {
    const total = Number(amount)
    if (!total || splitUsers.length === 0) return []
    const totalWeight = splitUsers.reduce((s, u) => s + u.weight, 0)
    return splitUsers.map(u => {
      const share = Math.round((u.weight / totalWeight) * total)
      const vehicleData = vehicleCredits.find(v => v.player_id === u.id)
      const vehicleCost = vehicleData ? Number(vehicleData.vehicle_cost) || 0 : 0
      const netAmount = share - vehicleCost // Debit share minus vehicle cost
      const creditAmount = vehicleCost > share ? vehicleCost - share : 0 // Extra credit if vehicle > share
      
      return {
        ...u,
        share,
        vehicleCost,
        netAmount,
        creditAmount
      }
    })
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
      // Debit for expense share
      await supabase.from("transactions").insert({
        id: uid(),
        player_id: s.id,
        amount: s.share,
        type: "debit",
        category: selectedCategory,
        date: now,
        note: `${expenseTitle || EXPENSE_CATEGORIES.find(c => c.id === selectedCategory)?.name} - Share (${s.weight}x)`
      })

      // Credit for vehicle if applicable
      if (s.vehicleCost > 0) {
        await supabase.from("transactions").insert({
          id: uid(),
          player_id: s.id,
          amount: s.vehicleCost,
          type: "credit",
          category: "Vehicle",
          date: now,
          note: `${expenseTitle || "Expense"} - Vehicle credit`
        })
      }
    }

    const newExpense = {
      id: uid(),
      title: expenseTitle || EXPENSE_CATEGORIES.find(c => c.id === selectedCategory)?.name || "Expense",
      total_amount: Number(amount),
      date: now,
      category: selectedCategory,
      contributors: splits().map(s => ({ 
        player_id: s.id, 
        amount: s.share, 
        weight: s.weight,
        vehicle_cost: s.vehicleCost,
        net_amount: s.netAmount
      })),
      player_count: splitUsers.length,
      vehicle_count: vehicleCredits.filter(v => v.vehicle_cost > 0).length,
      created_at: new Date().toISOString()
    }

    saveExpenses([newExpense, ...expenses])

    setLoading(false)
    setExpenseTitle("")
    setAmount("")
    setSelectedCategory("")
    setSplitUsers([])
    setVehicleCredits([])
    alert("Expense created ✅")
    setTab("dashboard")
    refresh()
  }

  // ================= REQUESTS =================

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

  const approve = async (r) => {
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

  const reject = async (id) => {
    if (!isAdmin) return
    await supabase.from("credit_requests").update({ status: "rejected" }).eq("id", id)
    refresh()
  }

  const pendingRequests = requests.filter(r => r.status === "pending")

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

        <button style={styles.bellBtn} onClick={() => isAdmin && setTab("requests")}>
          <Icon d={ICONS.bell} size={20} color="#fff" />
          {pendingRequests.length > 0 && (
            <div style={styles.notifBadge}>{pendingRequests.length}</div>
          )}
        </button>
      </header>

      {/* Main Content */}
      <main style={styles.main}>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div style={styles.page}>
            <div style={styles.balanceCard}>
              <div style={styles.balanceHeader}>
                <span style={styles.balanceLabel}>TOTAL BALANCE</span>
                <Icon d={ICONS.rupee} size={18} color="#A8D5A2" />
              </div>
              <div style={styles.balanceAmount}>₹{totalBalance.toLocaleString()}</div>
              <div style={styles.balanceGrowth}>
                <Icon d={ICONS.trendingUp} size={14} color="#A8D5A2" />
                <span>12.5% vs last month</span>
              </div>
              <div style={styles.cricketIllustration}>🏏</div>
            </div>

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
                <div style={styles.statAmount}>{players.length}</div>
                <div style={styles.statFooter}>Squad Size</div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statHeader}>
                  <span style={styles.statLabel}>OVERDUE PLAYERS</span>
                  <Icon d={ICONS.alert} size={16} color="#FFD700" />
                </div>
                <div style={styles.statAmount}>{debtorCount}</div>
                <div style={styles.statFooter}>Need Attention</div>
              </div>
            </div>

            {isAdmin && (
              <div style={styles.quickActions}>
                <div style={styles.sectionTitle}>QUICK ACTIONS</div>
                <div style={styles.actionGrid}>
                  <button style={styles.actionBtn} onClick={() => setTab("players")}>
                    <Icon d={ICONS.userPlus} size={24} color="#A8D5A2" />
                    <span>Add Player</span>
                  </button>
                  <button style={styles.actionBtn} onClick={() => setTab("expense")}>
                    <Icon d={ICONS.rupee} size={24} color="#4ECDC4" />
                    <span>Add Expense</span>
                  </button>
                  <button style={styles.actionBtn} onClick={() => setTab("expense")}>
                    <Icon d={ICONS.calendar} size={24} color="#FFD700" />
                    <span>Split Bill</span>
                  </button>
                  <button style={styles.actionBtn} onClick={() => setTab("players")}>
                    <Icon d={ICONS.check} size={24} color="#FF6B6B" />
                    <span>Settle Dues</span>
                  </button>
                </div>
              </div>
            )}

            {debtorCount > 0 && (
              <div style={styles.alertBox}>
                <Icon d={ICONS.alert} size={20} color="#FF6B6B" />
                <div style={{ flex: 1 }}>
                  <div style={styles.alertTitle}>{debtorCount} players have pending dues</div>
                  <div style={styles.alertDesc}>Keep track and collect on time.</div>
                </div>
                <button style={styles.alertBtn} onClick={() => { setTab("players"); setFilter("debtors") }}>
                  VIEW DEBTORS
                </button>
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionTitle}>RECENT ACTIVITY</span>
                <button style={styles.viewAllBtn} onClick={() => setTab("players")}>View All</button>
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
                        <div style={styles.activityStatus}>
                          {tx.type === "credit" ? "Creditor" : "Pending dues"}
                        </div>
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
                      <button style={styles.moreBtn}>
                        <Icon d={ICONS.moreVertical} size={16} color="#6B7280" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* PLAYERS */}
        {tab === "players" && (
          <div style={styles.page}>
            <div style={styles.pageHeader}>
              <button style={styles.backBtn} onClick={() => setTab("dashboard")}>←</button>
              <h2 style={styles.pageTitle}>Players</h2>
              {!isAdmin ? (
                <button 
                  style={{ ...styles.addPlayerBtn, background: "#374151", borderRadius: 8, padding: "8px 12px" }}
                  onClick={() => setShowLogin(true)}
                >
                  <Icon d={ICONS.lock} size={16} color="#FFD700" />
                  <span style={{ fontSize: 11, color: "#FFD700", marginLeft: 4 }}>Admin</span>
                </button>
              ) : (
                <button 
                  style={styles.addPlayerBtn}
                  onClick={() => setShowAddPlayer(true)}
                >
                  <Icon d={ICONS.userPlus} size={20} color="#A8D5A2" />
                </button>
              )}
            </div>

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
                    onClick={() => isAdmin && (selectionMode ? toggleSelect(p.id) : startSelection(p.id, "debit"))}
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
                    {isAdmin && !selectionMode ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button 
                          style={styles.quickCreditBtn}
                          onClick={async (e) => {
                            e.stopPropagation()
                            const amt = Number(prompt(`Add credit to ${p.name}`))
                            if (amt && amt > 0) {
                              await supabase.from("transactions").insert({
                                id: uid(),
                                player_id: p.id,
                                amount: amt,
                                type: "credit",
                                category: "Credit",
                                date: new Date().toISOString().slice(0, 10),
                                note: "Admin credit"
                              })
                              await refresh()
                              alert(`✅ Added ₹${amt} credit to ${p.name}`)
                            }
                          }}
                        >
                          <Icon d={ICONS.plus} size={14} color="#A8D5A2" />
                        </button>
                        <button 
                          style={styles.quickDebitBtn}
                          onClick={async (e) => {
                            e.stopPropagation()
                            const amt = Number(prompt(`Deduct from ${p.name}`))
                            if (amt && amt > 0) {
                              await supabase.from("transactions").insert({
                                id: uid(),
                                player_id: p.id,
                                amount: amt,
                                type: "debit",
                                category: "Deduction",
                                date: new Date().toISOString().slice(0, 10),
                                note: "Admin deduction"
                              })
                              await refresh()
                              alert(`✅ Deducted ₹${amt} from ${p.name}`)
                            }
                          }}
                        >
                          <Icon d={ICONS.minus} size={14} color="#FF6B6B" />
                        </button>
                      </div>
                    ) : (
                      <button style={styles.chevronBtn}>
                        <Icon d={ICONS.chevronRight} size={16} color="#6B7280" />
                      </button>
                    )}
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
                  <button 
                    style={{ ...styles.actionBarBtn, background: "#A8D5A2", color: "#0A1F1A" }} 
                    onClick={() => { setActionType("credit"); bulkAction() }}
                  >
                    + Credit
                  </button>
                  <button 
                    style={{ ...styles.actionBarBtn, background: "#FF6B6B" }} 
                    onClick={() => { setActionType("debit"); bulkAction() }}
                  >
                    - Debit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EXPENSE */}
        {tab === "expense" && (
          <div style={styles.page}>
            <div style={styles.pageHeader}>
              <button style={styles.backBtn} onClick={() => setTab("dashboard")}>←</button>
              <h2 style={styles.pageTitle}>Create Expense</h2>
              <div style={{ width: 40 }} />
            </div>

            {!isAdmin ? (
              <div style={styles.lockedBox}>
                <Icon d={ICONS.alert} size={48} color="#6B7280" />
                <p style={{ color: "#9CA3AF", marginTop: 12 }}>Admin access required</p>
                <button style={styles.loginBtn} onClick={() => setShowLogin(true)}>
                  Login as Admin
                </button>
              </div>
            ) : (
              <div style={styles.createExpenseBox}>
                <input
                  value={expenseTitle}
                  onChange={e => setExpenseTitle(e.target.value)}
                  placeholder="Expense title (e.g., Sunglow Ground)"
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
                    const hasVehicle = vehicleCredits.find(v => v.player_id === p.id)
                    return (
                      <div key={p.id} style={{ marginBottom: 12 }}>
                        <div
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

                        {sel && (
                          <div style={{ marginTop: 8, paddingLeft: 12 }}>
                            <button
                              onClick={() => toggleVehicleCredit(p.id)}
                              style={{
                                ...styles.vehicleToggle,
                                ...(hasVehicle ? { background: "#4ECDC433", borderColor: "#4ECDC4" } : {})
                              }}
                            >
                              <Icon d={ICONS.car} size={16} color={hasVehicle ? "#4ECDC4" : "#6B7280"} />
                              <span>Add Vehicle Credit</span>
                            </button>
                            {hasVehicle && (
                              <input
                                type="number"
                                value={hasVehicle.vehicle_cost || ""}
                                onChange={e => updateVehicleCost(p.id, Number(e.target.value))}
                                placeholder="Vehicle cost (₹)"
                                style={{ ...styles.input, marginTop: 8 }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {splits().length > 0 && (
                  <div style={styles.splitPreview}>
                    <div style={styles.formLabel}>Split Preview</div>
                    {splits().map(s => (
                      <div key={s.id} style={styles.splitPreviewRow}>
                        <div>
                          <div style={{ color: "#E5E7EB", fontWeight: 600 }}>{s.name} ({s.weight}x)</div>
                          <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                            Share: ₹{s.share} 
                            {s.vehicleCost > 0 && ` - Vehicle: ₹${s.vehicleCost}`}
                            {s.vehicleCost > 0 && ` = Net: ₹${s.netAmount}`}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: s.netAmount < 0 ? "#A8D5A2" : "#FF6B6B", fontWeight: 700 }}>
                            {s.netAmount > 0 ? "-" : "+"}₹{Math.abs(s.netAmount)}
                          </div>
                        </div>
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
            )}
          </div>
        )}

        {/* EXPENSES HISTORY */}
        {tab === "expenses" && (
          <div style={styles.page}>
            <div style={styles.pageHeader}>
              <button style={styles.backBtn} onClick={() => setTab("dashboard")}>←</button>
              <h2 style={styles.pageTitle}>Expenses</h2>
              <div style={{ width: 40 }} />
            </div>

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
                            <div style={styles.expenseIconLarge}>{category?.icon || "📦"}</div>
                            <div>
                              <div style={styles.expenseTitle}>{exp.title}</div>
                              <div style={styles.expenseDate}>
                                {new Date(exp.date).toLocaleDateString()} • {exp.player_count} players
                                {exp.vehicle_count > 0 && ` • ${exp.vehicle_count} vehicle${exp.vehicle_count > 1 ? 's' : ''}`}
                              </div>
                            </div>
                          </div>
                          <div style={styles.expenseAmount}>₹{exp.total_amount}</div>
                        </div>
                        <button
                          onClick={() => setExpandedExpense(expandedExpense === exp.id ? null : exp.id)}
                          style={styles.expandBtn}
                        >
                          <Icon d={ICONS.chevronDown} size={14} />
                          <span>Details</span>
                        </button>
                        {expandedExpense === exp.id && (
                          <div style={styles.expenseDetails}>
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 8 }}>CONTRIBUTORS</div>
                              {exp.contributors.map(c => {
                                const player = players.find(p => p.id === c.player_id)
                                return (
                                  <div key={c.player_id} style={styles.contributorDetailRow}>
                                    <div>
                                      <span style={{ color: "#E5E7EB" }}>{player?.name}</span>
                                      <span style={{ color: "#6B7280", fontSize: 12, marginLeft: 6 }}>({c.weight}x)</span>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                      <div style={{ color: "#FF6B6B", fontWeight: 600 }}>₹{c.amount}</div>
                                      {c.vehicle_cost > 0 && (
                                        <div style={{ fontSize: 11, color: "#4ECDC4" }}>
                                          Vehicle: +₹{c.vehicle_cost}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
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

        {/* REQUESTS */}
        {tab === "requests" && (
          <div style={styles.page}>
            <div style={styles.pageHeader}>
              <button style={styles.backBtn} onClick={() => setTab("dashboard")}>←</button>
              <h2 style={styles.pageTitle}>Credit Requests</h2>
              <div style={{ width: 40 }} />
            </div>

            <div style={styles.createExpenseBox}>
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

            {isAdmin && (
              <div style={{ marginTop: 24 }}>
                <div style={styles.sectionTitle}>
                  ADMIN: ALL REQUESTS 
                  {pendingRequests.length > 0 && <span style={{ color: "#FFD700", marginLeft: 8 }}>({pendingRequests.length} pending)</span>}
                </div>
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
                                <Icon d={ICONS.check} size={16} />
                                Approve
                              </button>
                              <button onClick={() => reject(r.id)} style={styles.rejectBtn}>
                                <Icon d={ICONS.x} size={16} />
                                Reject
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
        <button onClick={() => setTab("expense")} style={{ ...styles.navBtn, position: "relative", top: -15 }}>
          <div style={styles.fabButton}>
            <Icon d={ICONS.plus} size={28} color="#0A1F1A" />
          </div>
        </button>
        <button onClick={() => setTab("expenses")} style={styles.navBtn}>
          <Icon d={ICONS.calendar} size={24} color={tab === "expenses" ? "#A8D5A2" : "#6B7280"} />
          <span style={{ color: tab === "expenses" ? "#A8D5A2" : "#9CA3AF" }}>Expenses</span>
        </button>
        <button onClick={() => setTab("requests")} style={styles.navBtn}>
          <Icon d={ICONS.bell} size={24} color={tab === "requests" ? "#A8D5A2" : "#6B7280"} />
          <span style={{ color: tab === "requests" ? "#A8D5A2" : "#9CA3AF" }}>
            Requests
            {pendingRequests.length > 0 && <span style={styles.navBadge}>{pendingRequests.length}</span>}
          </span>
        </button>
      </footer>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => { setIsAdmin(true); sessionStorage.setItem("rl:isAdmin", "yes"); setShowLogin(false) }}
        />
      )}

      {showAddPlayer && (
        <AddPlayerModal
          onClose={() => { setShowAddPlayer(false); setNewPlayerName("") }}
          onAdd={async (name) => {
            if (name.trim()) {
              await supabase.from("players").insert({
                id: uid(),
                name: name.trim(),
                created_at: new Date().toISOString()
              })
              await refresh()
              setShowAddPlayer(false)
              setNewPlayerName("")
              alert(`✅ Added ${name} to the team!`)
            }
          }}
          value={newPlayerName}
          onChange={setNewPlayerName}
        />
      )}
    </div>
  )
}

function LoginModal({ onClose, onSuccess }) {
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

function AddPlayerModal({ onClose, onAdd, value, onChange }) {
  const submit = () => {
    if (value.trim()) {
      onAdd(value)
    } else {
      alert("Please enter a player name")
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={{ color: "#E5E7EB", fontSize: 18, margin: 0 }}>Add New Player</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            <Icon d={ICONS.x} size={20} color="#6B7280" />
          </button>
        </div>
        <div style={{ padding: "20px" }}>
          <input
            type="text" value={value} autoFocus
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Enter player name"
            style={styles.input}
          />
        </div>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #1F2937", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...styles.loginBtn, background: "#A8D5A2" }} onClick={submit}>Add Player</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  root: { display: "flex", flexDirection: "column", minHeight: "100vh", background: "#0A1F1A", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#E5E7EB" },
  header: { background: "linear-gradient(135deg, #0F2922 0%, #0A1F1A 100%)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1F2937" },
  menuBtn: { background: "none", border: "none", cursor: "pointer", padding: 8 },
  headerCenter: { display: "flex", alignItems: "center", gap: 12, flex: 1, justifyContent: "center" },
  logoImg: { width: 40, height: 40, borderRadius: 8 },
  headerTitle: { fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: 1 },
  headerSub: { fontSize: 11, color: "#9CA3AF" },
  bellBtn: { background: "none", border: "none", cursor: "pointer", position: "relative", padding: 8 },
  notifBadge: { position: "absolute", top: 4, right: 4, background: "#FF6B6B", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" },
  main: { flex: 1, overflow: "auto", paddingBottom: 100 },
  page: { padding: "0 0 20px" },
  pageHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px", marginBottom: 20 },
  backBtn: { background: "#1F2937", border: "none", color: "#fff", borderRadius: 8, width: 40, height: 40, fontSize: 20, cursor: "pointer" },
  pageTitle: { fontSize: 24, fontWeight: 900, color: "#fff", flex: 1, textAlign: "center" },
  addPlayerBtn: { background: "none", border: "none", cursor: "pointer", padding: 8 },
  balanceCard: { background: "linear-gradient(135deg, #1F4A3C 0%, #0F2922 100%)", borderRadius: 20, margin: "0 20px 20px", padding: 24, position: "relative", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" },
  balanceHeader: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  balanceLabel: { fontSize: 12, color: "#A8D5A2", fontWeight: 700 },
  balanceAmount: { fontSize: 42, fontWeight: 900, color: "#fff", marginBottom: 8 },
  balanceGrowth: { display: "flex", alignItems: "center", gap: 4, color: "#A8D5A2", fontSize: 13, fontWeight: 600 },
  cricketIllustration: { position: "absolute", right: 20, bottom: 20, fontSize: 80, opacity: 0.15 },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "0 20px 20px" },
  statCard: { background: "#1F2937", borderRadius: 12, padding: 16, border: "1px solid #374151" },
  statHeader: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  statLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: 600 },
  statAmount: { fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 4 },
  statFooter: { fontSize: 11, color: "#6B7280" },
  quickActions: { padding: "0 20px 20px" },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginBottom: 12 },
  actionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 },
  actionBtn: { background: "#1F2937", border: "1px solid #374151", borderRadius: 12, padding: "16px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", color: "#E5E7EB", fontSize: 11, fontWeight: 600 },
  alertBox: { background: "#2D1F1F", border: "1px solid #4A2828", borderRadius: 12, padding: 16, margin: "0 20px 20px", display: "flex", alignItems: "center", gap: 12 },
  alertTitle: { fontSize: 14, fontWeight: 600, color: "#FF6B6B", marginBottom: 2 },
  alertDesc: { fontSize: 12, color: "#9CA3AF" },
  alertBtn: { background: "#FF6B6B", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", marginLeft: "auto", whiteSpace: "nowrap" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", marginBottom: 12 },
  viewAllBtn: { background: "none", border: "none", color: "#A8D5A2", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  activityList: { padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 },
  activityItem: { background: "#1F2937", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12, border: "1px solid #374151" },
  activityAvatar: { width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "#fff" },
  activityName: { fontSize: 15, fontWeight: 600, color: "#E5E7EB", marginBottom: 2 },
  activityStatus: { fontSize: 11, color: "#9CA3AF" },
  activityTime: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  moreBtn: { background: "none", border: "none", color: "#6B7280", cursor: "pointer", padding: "0 8px" },
  searchBar: { display: "flex", alignItems: "center", gap: 12, background: "#1F2937", border: "1px solid #374151", borderRadius: 12, padding: "12px 16px", margin: "0 20px 16px" },
  searchInput: { flex: 1, background: "none", border: "none", color: "#E5E7EB", fontSize: 14, outline: "none" },
  filterIconBtn: { background: "none", border: "none", cursor: "pointer", padding: 4 },
  filterTabs: { display: "flex", gap: 8, padding: "0 20px", marginBottom: 20 },
  filterTab: { flex: 1, background: "#1F2937", border: "1px solid #374151", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, color: "#9CA3AF", cursor: "pointer" },
  filterTabActive: { background: "#A8D5A233", borderColor: "#A8D5A2", color: "#A8D5A2" },
  playersList: { padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 },
  playerCard: { background: "#1F2937", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12, border: "1px solid #374151", cursor: "pointer" },
  playerCardSelected: { borderColor: "#A8D5A2", background: "#A8D5A233" },
  playerAvatar: { width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, color: "#fff" },
  playerName: { fontSize: 16, fontWeight: 600, color: "#E5E7EB", marginBottom: 2 },
  playerStatus: { fontSize: 11, color: "#9CA3AF" },
  chevronBtn: { background: "none", border: "none", cursor: "pointer", padding: 4 },
  quickCreditBtn: { background: "#A8D5A233", border: "1px solid #A8D5A2", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  quickDebitBtn: { background: "#FF6B6B33", border: "1px solid #FF6B6B", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  floatingActionBar: { position: "fixed", bottom: 80, left: 20, right: 20, background: "#1F2937", borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #374151", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" },
  cancelBtn: { background: "#374151", color: "#E5E7EB", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  actionBarBtn: { color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  createExpenseBox: { background: "#1F2937", borderRadius: 12, padding: 20, margin: "0 20px", border: "1px solid #374151" },
  boxTitle: { fontSize: 16, fontWeight: 700, color: "#E5E7EB", marginBottom: 16 },
  input: { width: "100%", background: "#0A1F1A", border: "1px solid #374151", color: "#E5E7EB", borderRadius: 8, padding: 12, fontSize: 14, boxSizing: "border-box" },
  formLabel: { fontSize: 12, fontWeight: 600, color: "#9CA3AF", marginTop: 16, marginBottom: 12 },
  categorySelector: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  categorySelectBtn: { background: "#0A1F1A", border: "2px solid #374151", borderRadius: 8, padding: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", color: "#9CA3AF", fontSize: 11, fontWeight: 600 },
  categorySelectBtnActive: { borderColor: "#A8D5A2", background: "#A8D5A233" },
  contributorList: { display: "flex", flexDirection: "column" },
  contributorItem: { background: "#0A1F1A", border: "1px solid #374151", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", color: "#E5E7EB", fontSize: 14 },
  contributorItemActive: { borderColor: "#A8D5A2", background: "#A8D5A233" },
  contributorAvatar: { width: 32, height: 32, borderRadius: "50%", background: "#374151", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff" },
  weightSelect: { background: "#1F2937", color: "#E5E7EB", border: "1px solid #374151", borderRadius: 6, padding: "6px 12px", fontSize: 13, fontWeight: 600 },
  vehicleToggle: { background: "#0A1F1A", border: "1px solid #374151", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "#9CA3AF", fontWeight: 600, width: "100%" },
  splitPreview: { background: "#0A1F1A", borderRadius: 8, padding: 16, marginTop: 16, border: "1px solid #374151" },
  splitPreviewRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #374151" },
  createExpenseBtn: { width: "100%", background: "#A8D5A2", color: "#0A1F1A", border: "none", borderRadius: 8, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 20 },
  lockedBox: { background: "#1F2937", borderRadius: 12, padding: 40, margin: "0 20px", border: "1px solid #374151", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" },
  loginBtn: { background: "#A8D5A2", color: "#0A1F1A", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 16 },
  categoryBreakdown: { padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 },
  categoryCard: { background: "#1F2937", border: "1px solid #374151", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12 },
  categoryIcon: { fontSize: 32 },
  categoryName: { fontSize: 12, color: "#9CA3AF", marginBottom: 4 },
  categoryAmount: { fontSize: 16, fontWeight: 700, color: "#E5E7EB" },
  expensesList: { padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 },
  expenseCard: { background: "#1F2937", borderRadius: 12, padding: 16, border: "1px solid #374151" },
  expenseHeader: { display: "flex", justifyContent: "space-between", marginBottom: 12 },
  expenseIconLarge: { fontSize: 32 },
  expenseTitle: { fontSize: 15, fontWeight: 600, color: "#E5E7EB", marginBottom: 2 },
  expenseDate: { fontSize: 11, color: "#6B7280" },
  expenseAmount: { fontSize: 20, fontWeight: 900, color: "#A8D5A2" },
  expandBtn: { background: "none", border: "none", color: "#A8D5A2", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "8px 0" },
  expenseDetails: { marginTop: 12, paddingTop: 12, borderTop: "1px solid #374151" },
  contributorDetailRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13 },
  emptyState: { textAlign: "center", padding: 40, color: "#6B7280", fontSize: 14 },
  requestsList: { padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 },
  requestCard: { background: "#1F2937", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12, border: "1px solid #374151" },
  requestAvatar: { width: 36, height: 36, borderRadius: "50%", background: "#374151", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff" },
  requestPlayer: { fontSize: 14, fontWeight: 600, color: "#E5E7EB" },
  requestDate: { fontSize: 11, color: "#6B7280" },
  requestAmount: { fontSize: 18, fontWeight: 900, color: "#A8D5A2", marginTop: 8 },
  requestNote: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  statusBadge: { display: "inline-block", padding: "4px 12px", borderRadius: 12, fontSize: 10, fontWeight: 600, marginTop: 8 },
  approveBtn: { background: "#A8D5A2", color: "#0A1F1A", border: "none", borderRadius: 6, padding: "10px 16px", fontWeight: 600, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" },
  rejectBtn: { background: "#FF6B6B", color: "#fff", border: "none", borderRadius: 6, padding: "10px 16px", fontWeight: 600, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" },
  nav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#0F2922", borderTop: "1px solid #1F2937", display: "flex", justifyContent: "space-around", padding: "12px 0 20px", boxShadow: "0 -4px 12px rgba(0,0,0,0.3)" },
  navBtn: { background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11, fontWeight: 600, padding: "4px 12px", position: "relative" },
  navBadge: { position: "absolute", top: -8, right: 0, background: "#FF6B6B", color: "#fff", borderRadius: 10, padding: "2px 6px", fontSize: 9, fontWeight: 700 },
  fabButton: { background: "linear-gradient(135deg, #A8D5A2 0%, #8FBC8F 100%)", borderRadius: "50%", width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(168, 213, 162, 0.4)" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 1000 },
  modal: { background: "#1F2937", borderRadius: 12, width: "100%", maxWidth: 360, border: "1px solid #374151", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", borderBottom: "1px solid #374151" },
  closeBtn: { background: "none", border: "none", cursor: "pointer", padding: 4 },
}