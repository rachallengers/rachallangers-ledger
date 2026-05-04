import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://tcrsfnbauyjqglquivoj.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcnNmbmJhdXlqcWdscXVpdm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MzEzMTUsImV4cCI6MjA5MzMwNzMxNX0.lbWX41JEEhFXEZzOkBN6wAUM3SS5czp3o6PtrLiO5yA"
const ADMIN_PASSWORD = "rachal123"
const LOGO_URL = "https://i.ibb.co/V0my7sYq/039925f4-eab6-45a2-b640-f8bad2975157.png"

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const uid = () => Math.random().toString(36).slice(2, 11)

const EXPENSE_CATEGORIES = [
  { id: "food", name: "Food & Dining", emoji: "🍔", color: "#FF6B6B" },
  { id: "transport", name: "Transport", emoji: "🚗", color: "#4ECDC4" },
  { id: "utilities", name: "Utilities", emoji: "⚡", color: "#FFD93D" },
  { id: "matches", name: "Matches", emoji: "🏏", color: "#95E1D3" },
]

export default function App() {
  const [tab, setTab] = useState("home")
  const [players, setPlayers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [requests, setRequests] = useState([])
  const [expenses, setExpenses] = useState([])
  const [filter, setFilter] = useState("all")
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [showDebitModal, setShowDebitModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  
  // Forms
  const [newPlayerName, setNewPlayerName] = useState("")
  const [creditAmount, setCreditAmount] = useState("")
  const [debitAmount, setDebitAmount] = useState("")
  const [expenseTitle, setExpenseTitle] = useState("")
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseCategory, setExpenseCategory] = useState("")
  const [expensePlayers, setExpensePlayers] = useState([])
  const [vehicleCredits, setVehicleCredits] = useState([])
  const [reqPlayerId, setReqPlayerId] = useState("")
  const [reqAmount, setReqAmount] = useState("")
  const [reqNote, setReqNote] = useState("")
  const [expandedExpense, setExpandedExpense] = useState(null)

  // Fetch data
  const refresh = async () => {
    const [p, t, r] = await Promise.all([
      supabase.from("players").select("*").order("created_at"),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("credit_requests").select("*").order("created_at", { ascending: false }),
    ])
    if (p.data) setPlayers(p.data)
    if (t.data) setTransactions(t.data)
    if (r.data) setRequests(r.data)
  }

  useEffect(() => {
    if (sessionStorage.getItem("admin") === "true") setIsAdmin(true)
    refresh()
    const stored = localStorage.getItem("expenses")
    if (stored) setExpenses(JSON.parse(stored))
  }, [])

  useEffect(() => {
    const channel = supabase.channel("changes")
      .on("postgres_changes", { event: "*", schema: "public" }, refresh)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Calculate balances
  const stats = {}
  players.forEach(p => { stats[p.id] = { balance: 0 } })
  transactions.forEach(t => {
    if (!stats[t.player_id]) return
    stats[t.player_id].balance += t.type === "credit" ? t.amount : -t.amount
  })

  const totalBalance = Object.values(stats).filter(s => s.balance > 0).reduce((a, b) => a + b.balance, 0)
  const totalPending = Math.abs(Object.values(stats).filter(s => s.balance < 0).reduce((a, b) => a + b.balance, 0))
  const debtorCount = Object.values(stats).filter(s => s.balance < 0).length

  const filteredPlayers = players.filter(p => {
    const bal = stats[p.id]?.balance || 0
    if (filter === "debtors") return bal < 0
    if (filter === "creditors") return bal > 0
    return true
  })

  // Actions
  const addPlayer = async () => {
    if (!newPlayerName.trim()) return alert("Please enter a name")
    await supabase.from("players").insert({ id: uid(), name: newPlayerName.trim() })
    setNewPlayerName("")
    setShowAddPlayerModal(false)
    refresh()
  }

  const addCredit = async () => {
    const amt = Number(creditAmount)
    if (!amt || amt <= 0) return alert("Please enter a valid amount")
    await supabase.from("transactions").insert({
      id: uid(),
      player_id: selectedPlayer.id,
      amount: amt,
      type: "credit",
      category: "Credit",
      date: new Date().toISOString().split("T")[0],
      note: "Admin credit"
    })
    setCreditAmount("")
    setShowCreditModal(false)
    setSelectedPlayer(null)
    refresh()
  }

  const addDebit = async () => {
    const amt = Number(debitAmount)
    if (!amt || amt <= 0) return alert("Please enter a valid amount")
    await supabase.from("transactions").insert({
      id: uid(),
      player_id: selectedPlayer.id,
      amount: amt,
      type: "debit",
      category: "Deduction",
      date: new Date().toISOString().split("T")[0],
      note: "Admin deduction"
    })
    setDebitAmount("")
    setShowDebitModal(false)
    setSelectedPlayer(null)
    refresh()
  }

  const createExpense = async () => {
    const amt = Number(expenseAmount)
    if (!amt || !expenseCategory || expensePlayers.length === 0) {
      return alert("Please fill all fields and select players")
    }

    const totalWeight = expensePlayers.reduce((sum, p) => sum + p.weight, 0)
    const now = new Date().toISOString().split("T")[0]

    for (const player of expensePlayers) {
      const share = Math.round((player.weight / totalWeight) * amt)
      
      // Add debit for share
      await supabase.from("transactions").insert({
        id: uid(),
        player_id: player.id,
        amount: share,
        type: "debit",
        category: expenseCategory,
        date: now,
        note: `${expenseTitle || "Expense"} - ${player.weight}x share`
      })

      // Add credit for vehicle if applicable
      const vehicle = vehicleCredits.find(v => v.player_id === player.id)
      if (vehicle && vehicle.amount > 0) {
        await supabase.from("transactions").insert({
          id: uid(),
          player_id: player.id,
          amount: vehicle.amount,
          type: "credit",
          category: "Vehicle",
          date: now,
          note: `${expenseTitle || "Expense"} - Vehicle credit`
        })
      }
    }

    // Save expense record
    const newExp = {
      id: uid(),
      title: expenseTitle || EXPENSE_CATEGORIES.find(c => c.id === expenseCategory)?.name,
      amount: amt,
      category: expenseCategory,
      date: now,
      players: expensePlayers.map(p => {
        const share = Math.round((p.weight / totalWeight) * amt)
        const vehicle = vehicleCredits.find(v => v.player_id === p.id)
        return {
          id: p.id,
          name: p.name,
          weight: p.weight,
          share,
          vehicle: vehicle?.amount || 0
        }
      })
    }
    const updated = [newExp, ...expenses]
    localStorage.setItem("expenses", JSON.stringify(updated))
    setExpenses(updated)

    // Reset form
    setExpenseTitle("")
    setExpenseAmount("")
    setExpenseCategory("")
    setExpensePlayers([])
    setVehicleCredits([])
    setTab("home")
    refresh()
  }

  const toggleExpensePlayer = (player) => {
    const exists = expensePlayers.find(p => p.id === player.id)
    if (exists) {
      setExpensePlayers(expensePlayers.filter(p => p.id !== player.id))
      setVehicleCredits(vehicleCredits.filter(v => v.player_id !== player.id))
    } else {
      setExpensePlayers([...expensePlayers, { ...player, weight: 1 }])
    }
  }

  const updateWeight = (playerId, weight) => {
    setExpensePlayers(expensePlayers.map(p => p.id === playerId ? { ...p, weight } : p))
  }

  const toggleVehicle = (playerId) => {
    const exists = vehicleCredits.find(v => v.player_id === playerId)
    if (exists) {
      setVehicleCredits(vehicleCredits.filter(v => v.player_id !== playerId))
    } else {
      setVehicleCredits([...vehicleCredits, { player_id: playerId, amount: 0 }])
    }
  }

  const updateVehicleAmount = (playerId, amount) => {
    setVehicleCredits(vehicleCredits.map(v => 
      v.player_id === playerId ? { ...v, amount: Number(amount) || 0 } : v
    ))
  }

  const sendRequest = async () => {
    if (!reqPlayerId || !reqAmount) return alert("Please fill all fields")
    await supabase.from("credit_requests").insert({
      id: uid(),
      player_id: reqPlayerId,
      amount: Number(reqAmount),
      note: reqNote,
      status: "pending"
    })
    setReqPlayerId("")
    setReqAmount("")
    setReqNote("")
    refresh()
  }

  const approveRequest = async (req) => {
    await supabase.from("transactions").insert({
      id: uid(),
      player_id: req.player_id,
      amount: req.amount,
      type: "credit",
      category: "Request",
      date: new Date().toISOString().split("T")[0],
      note: req.note || "Approved request"
    })
    await supabase.from("credit_requests").update({ status: "approved" }).eq("id", req.id)
    refresh()
  }

  const rejectRequest = async (id) => {
    await supabase.from("credit_requests").update({ status: "rejected" }).eq("id", id)
    refresh()
  }

  const categoryTotals = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.id).reduce((sum, e) => sum + e.amount, 0)
  }))

  const pendingRequests = requests.filter(r => r.status === "pending")

  return (
    <div style={s.root}>
      {/* Header */}
      <header style={s.header}>
        <img src={LOGO_URL} alt="Logo" style={s.logo} />
        <div style={s.headerText}>
          <div style={s.title}>CHALLENGERS</div>
          <div style={s.subtitle}>Rohan Abhilasha {isAdmin && "⚡"}</div>
        </div>
        <button style={s.notif} onClick={() => setTab("requests")}>
          🔔
          {pendingRequests.length > 0 && <span style={s.badge}>{pendingRequests.length}</span>}
        </button>
      </header>

      {/* Content */}
      <main style={s.main}>
        
        {/* HOME */}
        {tab === "home" && (
          <div style={s.page}>
            <div style={s.balanceCard}>
              <div style={s.balanceLabel}>TOTAL BALANCE</div>
              <div style={s.balanceAmount}>₹{totalBalance.toLocaleString()}</div>
              <div style={s.balanceGrowth}>↗ 12.5% vs last month</div>
            </div>

            <div style={s.statsRow}>
              <div style={{ ...s.statCard, ...s.statRed }}>
                <div style={s.statLabel}>PENDING</div>
                <div style={s.statValue}>₹{totalPending.toLocaleString()}</div>
                <div style={s.statSub}>{debtorCount} players</div>
              </div>
              <div style={{ ...s.statCard, ...s.statBlue }}>
                <div style={s.statLabel}>PLAYERS</div>
                <div style={s.statValue}>{players.length}</div>
                <div style={s.statSub}>Squad</div>
              </div>
            </div>

            {isAdmin && (
              <div style={s.actions}>
                <div style={s.sectionTitle}>QUICK ACTIONS</div>
                <div style={s.actionsGrid}>
                  <button style={s.actionBtn} onClick={() => setShowAddPlayerModal(true)}>
                    <div style={s.actionIcon}>👤</div>
                    <div style={s.actionLabel}>Add Player</div>
                  </button>
                  <button style={s.actionBtn} onClick={() => setTab("expense")}>
                    <div style={s.actionIcon}>💰</div>
                    <div style={s.actionLabel}>Add Expense</div>
                  </button>
                  <button style={s.actionBtn} onClick={() => setTab("players")}>
                    <div style={s.actionIcon}>✅</div>
                    <div style={s.actionLabel}>Settle Dues</div>
                  </button>
                  <button style={s.actionBtn} onClick={() => setTab("expenses")}>
                    <div style={s.actionIcon}>📊</div>
                    <div style={s.actionLabel}>View History</div>
                  </button>
                </div>
              </div>
            )}

            {debtorCount > 0 && (
              <div style={s.alert}>
                <div>⚠️ {debtorCount} players have pending dues</div>
                <button style={s.alertBtn} onClick={() => { setTab("players"); setFilter("debtors") }}>
                  VIEW
                </button>
              </div>
            )}

            <div style={s.activity}>
              <div style={s.sectionTitle}>RECENT ACTIVITY</div>
              {transactions.slice(0, 5).map(tx => {
                const player = players.find(p => p.id === tx.player_id)
                return (
                  <div key={tx.id} style={s.activityItem}>
                    <div style={{ ...s.activityAvatar, background: tx.type === "credit" ? "#4ECDC4" : "#FF6B6B" }}>
                      {player?.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={s.activityInfo}>
                      <div style={s.activityName}>{player?.name}</div>
                      <div style={s.activityDate}>{new Date(tx.date).toLocaleDateString()}</div>
                    </div>
                    <div style={{ ...s.activityAmount, color: tx.type === "credit" ? "#4ECDC4" : "#FF6B6B" }}>
                      {tx.type === "credit" ? "+" : "-"}₹{tx.amount}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* PLAYERS */}
        {tab === "players" && (
          <div style={s.page}>
            <div style={s.pageHeader}>
              <button style={s.backBtn} onClick={() => setTab("home")}>←</button>
              <div style={s.pageTitle}>Players</div>
              {isAdmin && <button style={s.addBtn} onClick={() => setShowAddPlayerModal(true)}>+</button>}
            </div>

            <div style={s.filters}>
              <button 
                style={{ ...s.filterBtn, ...(filter === "all" ? s.filterActive : {}) }}
                onClick={() => setFilter("all")}
              >
                All ({players.length})
              </button>
              <button 
                style={{ ...s.filterBtn, ...(filter === "debtors" ? s.filterActive : {}) }}
                onClick={() => setFilter("debtors")}
              >
                Debtors ({debtorCount})
              </button>
              <button 
                style={{ ...s.filterBtn, ...(filter === "creditors" ? s.filterActive : {}) }}
                onClick={() => setFilter("creditors")}
              >
                Creditors
              </button>
            </div>

            <div style={s.playersList}>
              {filteredPlayers.map(p => {
                const bal = stats[p.id]?.balance || 0
                return (
                  <div key={p.id} style={s.playerCard}>
                    <div style={{ ...s.playerAvatar, background: bal < 0 ? "#FF6B6B" : "#4ECDC4" }}>
                      {p.name[0].toUpperCase()}
                    </div>
                    <div style={s.playerInfo}>
                      <div style={s.playerName}>{p.name}</div>
                      <div style={s.playerStatus}>{bal < 0 ? "Pending dues" : "Creditor"}</div>
                    </div>
                    <div style={{ ...s.playerBalance, color: bal < 0 ? "#FF6B6B" : "#4ECDC4" }}>
                      {bal >= 0 ? "+" : ""}₹{bal.toFixed(0)}
                    </div>
                    {isAdmin && (
                      <div style={s.playerActions}>
                        <button 
                          style={s.creditBtn}
                          onClick={() => { setSelectedPlayer(p); setShowCreditModal(true) }}
                        >
                          +
                        </button>
                        <button 
                          style={s.debitBtn}
                          onClick={() => { setSelectedPlayer(p); setShowDebitModal(true) }}
                        >
                          −
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* EXPENSE */}
        {tab === "expense" && (
          <div style={s.page}>
            <div style={s.pageHeader}>
              <button style={s.backBtn} onClick={() => setTab("home")}>←</button>
              <div style={s.pageTitle}>Create Expense</div>
              <div style={{ width: 40 }} />
            </div>

            {!isAdmin ? (
              <div style={s.locked}>
                <div style={s.lockIcon}>🔒</div>
                <div style={s.lockText}>Admin access required</div>
                <button style={s.loginBtn} onClick={() => setShowLoginModal(true)}>Login</button>
              </div>
            ) : (
              <div style={s.form}>
                <input
                  value={expenseTitle}
                  onChange={e => setExpenseTitle(e.target.value)}
                  placeholder="Expense title (e.g., Sunglow Ground)"
                  style={s.input}
                />
                <input
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                  placeholder="Total amount (₹)"
                  type="number"
                  style={s.input}
                />

                <div style={s.formLabel}>Category</div>
                <div style={s.categoryGrid}>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setExpenseCategory(cat.id)}
                      style={{
                        ...s.categoryBtn,
                        ...(expenseCategory === cat.id ? { background: cat.color + "33", borderColor: cat.color } : {})
                      }}
                    >
                      <div style={{ fontSize: 32 }}>{cat.emoji}</div>
                      <div style={{ fontSize: 11 }}>{cat.name}</div>
                    </button>
                  ))}
                </div>

                <div style={s.formLabel}>Contributors</div>
                {players.map(p => {
                  const selected = expensePlayers.find(ep => ep.id === p.id)
                  const vehicle = vehicleCredits.find(v => v.player_id === p.id)
                  return (
                    <div key={p.id} style={s.contributor}>
                      <button
                        onClick={() => toggleExpensePlayer(p)}
                        style={{
                          ...s.contributorBtn,
                          ...(selected ? s.contributorActive : {})
                        }}
                      >
                        <span>{p.name}</span>
                        {selected && (
                          <select
                            value={selected.weight}
                            onChange={e => updateWeight(p.id, Number(e.target.value))}
                            style={s.weightSelect}
                            onClick={e => e.stopPropagation()}
                          >
                            <option value={1}>1x</option>
                            <option value={2}>2x</option>
                            <option value={3}>3x</option>
                            <option value={4}>4x</option>
                          </select>
                        )}
                      </button>
                      {selected && (
                        <div style={s.vehicleRow}>
                          <button
                            onClick={() => toggleVehicle(p.id)}
                            style={{ ...s.vehicleBtn, ...(vehicle ? s.vehicleActive : {}) }}
                          >
                            🚗 Vehicle
                          </button>
                          {vehicle && (
                            <input
                              type="number"
                              value={vehicle.amount || ""}
                              onChange={e => updateVehicleAmount(p.id, e.target.value)}
                              placeholder="₹"
                              style={s.vehicleInput}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {expensePlayers.length > 0 && (
                  <button style={s.createBtn} onClick={createExpense}>
                    Create Expense
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* EXPENSES */}
        {tab === "expenses" && (
          <div style={s.page}>
            <div style={s.pageHeader}>
              <button style={s.backBtn} onClick={() => setTab("home")}>←</button>
              <div style={s.pageTitle}>Expenses</div>
              <div style={{ width: 40 }} />
            </div>

            <div style={s.categoryTotals}>
              {categoryTotals.map(cat => (
                <div key={cat.id} style={s.categoryTotal}>
                  <div style={{ fontSize: 28 }}>{cat.emoji}</div>
                  <div>
                    <div style={s.categoryTotalLabel}>{cat.name}</div>
                    <div style={s.categoryTotalValue}>₹{cat.total.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>

            {expenses.map(exp => (
              <div key={exp.id} style={s.expenseCard}>
                <div style={s.expenseHeader}>
                  <div>
                    <div style={s.expenseTitle}>{exp.title}</div>
                    <div style={s.expenseDate}>{new Date(exp.date).toLocaleDateString()}</div>
                  </div>
                  <div style={s.expenseAmount}>₹{exp.amount}</div>
                </div>
                <button
                  style={s.expenseToggle}
                  onClick={() => setExpandedExpense(expandedExpense === exp.id ? null : exp.id)}
                >
                  {expandedExpense === exp.id ? "▲" : "▼"} Details
                </button>
                {expandedExpense === exp.id && (
                  <div style={s.expenseDetails}>
                    {exp.players.map(p => (
                      <div key={p.id} style={s.expensePlayer}>
                        <div>
                          <div>{p.name} ({p.weight}x)</div>
                          {p.vehicle > 0 && <div style={s.vehicleTag}>🚗 ₹{p.vehicle}</div>}
                        </div>
                        <div>₹{p.share}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* REQUESTS */}
        {tab === "requests" && (
          <div style={s.page}>
            <div style={s.pageHeader}>
              <button style={s.backBtn} onClick={() => setTab("home")}>←</button>
              <div style={s.pageTitle}>Requests</div>
              <div style={{ width: 40 }} />
            </div>

            <div style={s.requestForm}>
              <div style={s.formLabel}>Request Credit</div>
              <select value={reqPlayerId} onChange={e => setReqPlayerId(e.target.value)} style={s.input}>
                <option value="">Select Player</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input
                value={reqAmount}
                onChange={e => setReqAmount(e.target.value)}
                placeholder="Amount (₹)"
                type="number"
                style={s.input}
              />
              <input
                value={reqNote}
                onChange={e => setReqNote(e.target.value)}
                placeholder="Note (optional)"
                style={s.input}
              />
              <button style={s.submitBtn} onClick={sendRequest}>Submit Request</button>
            </div>

            {isAdmin && (
              <div>
                <div style={s.sectionTitle}>ADMIN: REQUESTS ({pendingRequests.length} pending)</div>
                {requests.map(req => {
                  const player = players.find(p => p.id === req.player_id)
                  return (
                    <div key={req.id} style={s.requestCard}>
                      <div style={s.requestInfo}>
                        <div style={s.requestPlayer}>{player?.name}</div>
                        <div style={s.requestAmount}>₹{req.amount}</div>
                        {req.note && <div style={s.requestNote}>{req.note}</div>}
                        <div style={{
                          ...s.requestStatus,
                          color: req.status === "approved" ? "#4ECDC4" : req.status === "rejected" ? "#FF6B6B" : "#FFD93D"
                        }}>
                          ● {req.status.toUpperCase()}
                        </div>
                      </div>
                      {req.status === "pending" && (
                        <div style={s.requestActions}>
                          <button style={s.approveBtn} onClick={() => approveRequest(req)}>✓</button>
                          <button style={s.rejectBtn} onClick={() => rejectRequest(req.id)}>×</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Bottom Nav */}
      <nav style={s.nav}>
        <button style={s.navBtn} onClick={() => setTab("home")}>
          <div style={{ fontSize: 24 }}>🏠</div>
          <div style={{ ...s.navLabel, color: tab === "home" ? "#4ECDC4" : "#666" }}>Home</div>
        </button>
        <button style={s.navBtn} onClick={() => setTab("players")}>
          <div style={{ fontSize: 24 }}>👥</div>
          <div style={{ ...s.navLabel, color: tab === "players" ? "#4ECDC4" : "#666" }}>Players</div>
        </button>
        <button style={{ ...s.navBtn, marginTop: -20 }} onClick={() => setTab("expense")}>
          <div style={s.fab}>+</div>
        </button>
        <button style={s.navBtn} onClick={() => setTab("expenses")}>
          <div style={{ fontSize: 24 }}>📊</div>
          <div style={{ ...s.navLabel, color: tab === "expenses" ? "#4ECDC4" : "#666" }}>Expenses</div>
        </button>
        <button style={s.navBtn} onClick={() => setTab("requests")}>
          <div style={{ fontSize: 24, position: "relative" }}>
            🔔
            {pendingRequests.length > 0 && <span style={s.navBadge}>{pendingRequests.length}</span>}
          </div>
          <div style={{ ...s.navLabel, color: tab === "requests" ? "#4ECDC4" : "#666" }}>Requests</div>
        </button>
      </nav>

      {/* Modals */}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onLogin={() => {
        setIsAdmin(true)
        sessionStorage.setItem("admin", "true")
        setShowLoginModal(false)
      }} />}

      {showAddPlayerModal && <AddPlayerModal 
        onClose={() => { setShowAddPlayerModal(false); setNewPlayerName("") }}
        value={newPlayerName}
        onChange={setNewPlayerName}
        onSubmit={addPlayer}
      />}

      {showCreditModal && selectedPlayer && <CreditModal
        player={selectedPlayer}
        onClose={() => { setShowCreditModal(false); setCreditAmount(""); setSelectedPlayer(null) }}
        value={creditAmount}
        onChange={setCreditAmount}
        onSubmit={addCredit}
      />}

      {showDebitModal && selectedPlayer && <DebitModal
        player={selectedPlayer}
        onClose={() => { setShowDebitModal(false); setDebitAmount(""); setSelectedPlayer(null) }}
        value={debitAmount}
        onChange={setDebitAmount}
        onSubmit={addDebit}
      />}
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

function LoginModal({ onClose, onLogin }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      onLogin()
    } else {
      setError(true)
    }
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.modalTitle}>Admin Login</div>
        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError(false) }}
          placeholder="Enter password"
          style={s.modalInput}
          autoFocus
          onKeyPress={e => e.key === "Enter" && handleLogin()}
        />
        {error && <div style={{ color: "#FF6B6B", fontSize: 12, marginBottom: 12 }}>Wrong password</div>}
        <button style={s.modalBtn} onClick={handleLogin}>Login</button>
      </div>
    </div>
  )
}

function AddPlayerModal({ onClose, value, onChange, onSubmit }) {
  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit()
    } else {
      alert("Please enter a name")
    }
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.modalTitle}>Add New Player</div>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Player name"
          style={s.modalInput}
          autoFocus
          onKeyPress={e => e.key === "Enter" && handleSubmit()}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...s.modalBtn, background: "#374151", flex: 1 }} onClick={onClose}>Cancel</button>
          <button style={{ ...s.modalBtn, flex: 1 }} onClick={handleSubmit}>Add Player</button>
        </div>
      </div>
    </div>
  )
}

function CreditModal({ player, onClose, value, onChange, onSubmit }) {
  const handleSubmit = () => {
    const amt = Number(value)
    if (amt && amt > 0) {
      onSubmit()
    } else {
      alert("Please enter a valid amount")
    }
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.modalTitle}>Add Credit to {player.name}</div>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Amount (₹)"
          style={s.modalInput}
          autoFocus
          onKeyPress={e => e.key === "Enter" && handleSubmit()}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...s.modalBtn, background: "#374151", flex: 1 }} onClick={onClose}>Cancel</button>
          <button style={{ ...s.modalBtn, background: "#4ECDC4", flex: 1 }} onClick={handleSubmit}>Add Credit</button>
        </div>
      </div>
    </div>
  )
}

function DebitModal({ player, onClose, value, onChange, onSubmit }) {
  const handleSubmit = () => {
    const amt = Number(value)
    if (amt && amt > 0) {
      onSubmit()
    } else {
      alert("Please enter a valid amount")
    }
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.modalTitle}>Deduct from {player.name}</div>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Amount (₹)"
          style={s.modalInput}
          autoFocus
          onKeyPress={e => e.key === "Enter" && handleSubmit()}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...s.modalBtn, background: "#374151", flex: 1 }} onClick={onClose}>Cancel</button>
          <button style={{ ...s.modalBtn, background: "#FF6B6B", flex: 1 }} onClick={handleSubmit}>Deduct</button>
        </div>
      </div>
    </div>
  )
}

const s = {
  root: { minHeight: "100vh", background: "#0A1F1A", color: "#fff", fontFamily: "system-ui, sans-serif", paddingBottom: 80 },
  header: { display: "flex", alignItems: "center", gap: 12, padding: 16, background: "#0F2922", borderBottom: "1px solid #1F4A3C" },
  logo: { width: 40, height: 40, borderRadius: 8 },
  headerText: { flex: 1 },
  title: { fontSize: 16, fontWeight: 900, letterSpacing: 1 },
  subtitle: { fontSize: 11, color: "#9CA3AF" },
  notif: { background: "none", border: "none", fontSize: 24, cursor: "pointer", position: "relative" },
  badge: { position: "absolute", top: -4, right: -4, background: "#FF6B6B", borderRadius: 10, padding: "2px 6px", fontSize: 10, fontWeight: 700 },
  
  main: { padding: 16 },
  page: { animation: "fadeIn 0.3s ease" },
  
  balanceCard: { background: "linear-gradient(135deg, #1F4A3C 0%, #0F2922 100%)", borderRadius: 16, padding: 24, marginBottom: 16 },
  balanceLabel: { fontSize: 11, color: "#A8D5A2", fontWeight: 700, marginBottom: 8 },
  balanceAmount: { fontSize: 40, fontWeight: 900, marginBottom: 8 },
  balanceGrowth: { fontSize: 13, color: "#A8D5A2" },
  
  statsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 },
  statCard: { borderRadius: 12, padding: 16 },
  statRed: { background: "#2D1F1F" },
  statBlue: { background: "#1F2937" },
  statLabel: { fontSize: 10, fontWeight: 700, marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 900, marginBottom: 4 },
  statSub: { fontSize: 11, opacity: 0.7 },
  
  actions: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#9CA3AF", marginBottom: 12 },
  actionsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 },
  actionBtn: { background: "#1F2937", border: "1px solid #374151", borderRadius: 12, padding: "16px 8px", cursor: "pointer", textAlign: "center" },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionLabel: { fontSize: 11, color: "#E5E7EB" },
  
  alert: { background: "#2D1F1F", borderLeft: "4px solid #FF6B6B", borderRadius: 8, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, fontSize: 13 },
  alertBtn: { background: "#FF6B6B", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  
  activity: { marginBottom: 16 },
  activityItem: { background: "#1F2937", borderRadius: 12, padding: 12, display: "flex", alignItems: "center", gap: 12, marginBottom: 8 },
  activityAvatar: { width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 14, fontWeight: 600 },
  activityDate: { fontSize: 11, color: "#9CA3AF" },
  activityAmount: { fontSize: 16, fontWeight: 700 },
  
  pageHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backBtn: { width: 40, height: 40, background: "#1F2937", border: "none", borderRadius: 8, color: "#fff", fontSize: 20, cursor: "pointer" },
  pageTitle: { flex: 1, textAlign: "center", fontSize: 20, fontWeight: 900 },
  addBtn: { width: 40, height: 40, background: "#4ECDC4", border: "none", borderRadius: 8, color: "#fff", fontSize: 24, cursor: "pointer" },
  
  filters: { display: "flex", gap: 8, marginBottom: 16 },
  filterBtn: { flex: 1, background: "#1F2937", border: "1px solid #374151", borderRadius: 8, padding: 10, color: "#9CA3AF", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  filterActive: { background: "#4ECDC433", borderColor: "#4ECDC4", color: "#4ECDC4" },
  
  playersList: {},
  playerCard: { background: "#1F2937", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  playerAvatar: { width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, flexShrink: 0 },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 16, fontWeight: 600 },
  playerStatus: { fontSize: 11, color: "#9CA3AF" },
  playerBalance: { fontSize: 18, fontWeight: 900, marginRight: 8 },
  playerActions: { display: "flex", gap: 8 },
  creditBtn: { width: 36, height: 36, background: "#4ECDC433", border: "1px solid #4ECDC4", borderRadius: 8, color: "#4ECDC4", fontSize: 20, cursor: "pointer" },
  debitBtn: { width: 36, height: 36, background: "#FF6B6B33", border: "1px solid #FF6B6B", borderRadius: 8, color: "#FF6B6B", fontSize: 20, cursor: "pointer" },
  
  locked: { textAlign: "center", padding: 60, color: "#9CA3AF" },
  lockIcon: { fontSize: 48, marginBottom: 16 },
  lockText: { fontSize: 14, marginBottom: 16 },
  loginBtn: { background: "#4ECDC4", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  
  form: {},
  input: { width: "100%", background: "#1F2937", border: "1px solid #374151", color: "#fff", borderRadius: 8, padding: 14, fontSize: 14, marginBottom: 12, boxSizing: "border-box" },
  formLabel: { fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginTop: 20, marginBottom: 12 },
  categoryGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 },
  categoryBtn: { background: "#1F2937", border: "2px solid #374151", borderRadius: 12, padding: 16, cursor: "pointer", textAlign: "center" },
  
  contributor: { marginBottom: 12 },
  contributorBtn: { width: "100%", background: "#1F2937", border: "1px solid #374151", borderRadius: 8, padding: 12, color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" },
  contributorActive: { background: "#4ECDC433", borderColor: "#4ECDC4" },
  weightSelect: { background: "#0F2922", color: "#fff", border: "1px solid #374151", borderRadius: 6, padding: "6px 12px", fontSize: 13 },
  vehicleRow: { display: "flex", gap: 8, marginTop: 8, paddingLeft: 12 },
  vehicleBtn: { flex: 1, background: "#1F2937", border: "1px solid #374151", borderRadius: 8, padding: 8, fontSize: 12, cursor: "pointer", color: "#9CA3AF" },
  vehicleActive: { background: "#FFD93D33", borderColor: "#FFD93D", color: "#FFD93D" },
  vehicleInput: { width: 100, background: "#1F2937", border: "1px solid #374151", borderRadius: 8, padding: 8, color: "#fff", fontSize: 13 },
  
  createBtn: { width: "100%", background: "#4ECDC4", color: "#fff", border: "none", borderRadius: 8, padding: 16, fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 20 },
  
  categoryTotals: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 },
  categoryTotal: { background: "#1F2937", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12 },
  categoryTotalLabel: { fontSize: 11, color: "#9CA3AF", marginBottom: 4 },
  categoryTotalValue: { fontSize: 16, fontWeight: 700 },
  
  expenseCard: { background: "#1F2937", borderRadius: 12, padding: 16, marginBottom: 12 },
  expenseHeader: { display: "flex", justifyContent: "space-between", marginBottom: 12 },
  expenseTitle: { fontSize: 16, fontWeight: 600, marginBottom: 4 },
  expenseDate: { fontSize: 11, color: "#9CA3AF" },
  expenseAmount: { fontSize: 20, fontWeight: 900, color: "#4ECDC4" },
  expenseToggle: { background: "none", border: "none", color: "#4ECDC4", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 0", width: "100%" },
  expenseDetails: { marginTop: 12, paddingTop: 12, borderTop: "1px solid #374151" },
  expensePlayer: { display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13 },
  vehicleTag: { fontSize: 11, color: "#FFD93D", marginTop: 4 },
  
  requestForm: { background: "#1F2937", borderRadius: 12, padding: 16, marginBottom: 20 },
  submitBtn: { width: "100%", background: "#4ECDC4", color: "#fff", border: "none", borderRadius: 8, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer" },
  requestCard: { background: "#1F2937", borderRadius: 12, padding: 16, marginBottom: 12, display: "flex", gap: 12 },
  requestInfo: { flex: 1 },
  requestPlayer: { fontSize: 14, fontWeight: 600, marginBottom: 4 },
  requestAmount: { fontSize: 18, fontWeight: 900, color: "#4ECDC4", marginBottom: 4 },
  requestNote: { fontSize: 12, color: "#9CA3AF", marginBottom: 8 },
  requestStatus: { fontSize: 11, fontWeight: 600 },
  requestActions: { display: "flex", flexDirection: "column", gap: 8 },
  approveBtn: { width: 40, height: 40, background: "#4ECDC4", border: "none", borderRadius: 8, color: "#fff", fontSize: 20, cursor: "pointer" },
  rejectBtn: { width: 40, height: 40, background: "#FF6B6B", border: "none", borderRadius: 8, color: "#fff", fontSize: 20, cursor: "pointer" },
  
  nav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#0F2922", borderTop: "1px solid #1F4A3C", display: "flex", justifyContent: "space-around", padding: "12px 0 20px" },
  navBtn: { background: "none", border: "none", cursor: "pointer", textAlign: "center" },
  navLabel: { fontSize: 11, marginTop: 4 },
  fab: { width: 56, height: 56, background: "linear-gradient(135deg, #4ECDC4 0%, #44B3A9 100%)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: "#fff", boxShadow: "0 4px 12px rgba(78,205,196,0.4)" },
  navBadge: { position: "absolute", top: -4, right: -4, background: "#FF6B6B", borderRadius: 10, padding: "2px 6px", fontSize: 9, fontWeight: 700 },
  
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 },
  modal: { background: "#1F2937", borderRadius: 16, padding: 24, width: "100%", maxWidth: 360, border: "1px solid #374151" },
  modalTitle: { fontSize: 18, fontWeight: 700, marginBottom: 16, textAlign: "center" },
  modalInput: { 
    width: "100%", 
    background: "#0F2922", 
    border: "2px solid #4ECDC4", 
    color: "#fff", 
    borderRadius: 8, 
    padding: "16px", 
    fontSize: 16, 
    marginBottom: 16, 
    boxSizing: "border-box",
    WebkitAppearance: "none",
    appearance: "none"
  },
  modalBtn: { width: "100%", background: "#4ECDC4", color: "#fff", border: "none", borderRadius: 8, padding: 16, fontSize: 16, fontWeight: 700, cursor: "pointer" },
}
