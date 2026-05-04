import { useEffect, useMemo, useState, type ReactNode } from "react"
import { createClient } from "@supabase/supabase-js"
import "./index.css"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: false },
    })
  : null

type ExpenseType = "match" | "vehicle" | "utilities" | "food" | "other"
type RequestStatus = "pending" | "approved" | "rejected"
type Role = "admin" | "user"

type Player = {
  id: string
  name: string
  phone?: string
}

type Payment = {
  id: string
  playerId: string
  amount: number
  label: string
}

type Expense = {
  id: string
  name: string
  type: ExpenseType
  date: string
  payments: Payment[]
  participantIds: string[]
  splitWeights?: Record<string, number>
  createdAt: number
}

type Adjustment = {
  id: string
  playerId: string
  kind: "credit" | "debit"
  amount: number
  reason: string
  createdAt: number
}

type CreditRequest = {
  id: string
  playerId: string
  amount: number
  reason: string
  note: string
  status: RequestStatus
  createdAt: number
}

type Screen =
  | "dashboard"
  | "players"
  | "expenses"
  | "reports"
  | "add-player"
  | "expense-basic"
  | "expense-payments"
  | "expense-players"
  | "expense-review"
  | "expense-success"
  | "credit-request"
  | "pending-requests"
  | "adjustments"
  | `player:${string}`

type DraftExpense = {
  name: string
  type: ExpenseType
  date: string
  payments: Payment[]
  participantIds: string[]
  splitWeights: Record<string, number>
}

type AppState = {
  players: Player[]
  expenses: Expense[]
  adjustments: Adjustment[]
  requests: CreditRequest[]
}

const expenseTypes: { id: ExpenseType; label: string; icon: string }[] = [
  { id: "match", label: "Match Fee", icon: "T" },
  { id: "vehicle", label: "Vehicle", icon: "V" },
  { id: "utilities", label: "Utilities", icon: "U" },
  { id: "food", label: "Food", icon: "F" },
  { id: "other", label: "Other", icon: "O" },
]

const LOGO_URL = "https://i.ibb.co/xKHvpNq7/039925f4-eab6-45a2-b640-f8bad2975157.png"
const paymentCategories = [
  { label: "Food", type: "food" },
  { label: "Match Fee", type: "match" },
  { label: "Vehicle", type: "vehicle" },
  { label: "Utilities", type: "utilities" },
  { label: "Other", type: "other" },
] as const

const seedPlayers = [
  "Mohit",
  "Soum",
  "Pranab",
  "Nikhil K",
  "Abhinav",
  "Vinil",
  "Praphul",
  "Firdaus",
  "Vipin",
  "Vishnu",
  "Navmath",
  "Pritesh",
  "Sachin T",
  "Digvijay",
]

const newId = () => crypto.randomUUID()
const money = (value: number) => `₹${Math.round(Math.abs(value)).toLocaleString("en-IN")}`
const signedMoney = (value: number) => `${value >= 0 ? "+" : "-"} ${money(value)}`
const labelFor = (type: ExpenseType) => expenseTypes.find((item) => item.id === type)?.label ?? "Other"
const initialPlayers = (): Player[] => seedPlayers.map((name) => ({ id: newId(), name }))

function cleanExpenseForPlayers(expense: Expense, playerIds: Set<string>): Expense {
  const participantIds = expense.participantIds.filter((playerId) => playerIds.has(playerId))
  return {
    ...expense,
    participantIds,
    payments: expense.payments.filter((payment) => playerIds.has(payment.playerId)),
    splitWeights: Object.fromEntries(participantIds.map((playerId) => [playerId, expense.splitWeights?.[playerId] ?? 1])),
  }
}

function cleanState(rawState: AppState): AppState {
  const playerIds = new Set(rawState.players.map((player) => player.id))
  return {
    players: rawState.players,
    expenses: rawState.expenses.map((expense) => cleanExpenseForPlayers(expense, playerIds)).filter((expense) => expense.participantIds.length > 0 || expense.payments.length > 0),
    adjustments: rawState.adjustments.filter((adjustment) => playerIds.has(adjustment.playerId)),
    requests: rawState.requests.filter((request) => playerIds.has(request.playerId)),
  }
}

const defaultState = (): AppState => {
  const players = initialPlayers()
  const find = (name: string) => players.find((player) => player.name === name)?.id
  const participantIds = ["Pranab", "Nikhil K", "Abhinav", "Vinil", "Praphul", "Firdaus", "Vipin", "Vishnu"]
    .map((name) => find(name))
    .filter((id): id is string => Boolean(id))
  const splitWeights = Object.fromEntries(participantIds.map((playerId, index) => [playerId, index === 0 ? 4 : 1]))
  return {
    players,
    expenses: [
      {
        id: newId(),
        name: "Sunglow Ground",
        type: "match",
        date: "2026-02-05",
        payments: [
          { id: newId(), playerId: find("Soum") ?? players[0].id, amount: 1850, label: "Match Fee" },
          { id: newId(), playerId: find("Mohit") ?? players[0].id, amount: 800, label: "Vehicle" },
        ],
        participantIds,
        splitWeights,
        createdAt: Date.now() - 86400000,
      },
    ],
    adjustments: [],
    requests: [],
  }
}

function loadLocalState() {
  try {
    const raw = localStorage.getItem("cricket-expense-state")
    return raw ? cleanState(JSON.parse(raw) as AppState) : defaultState()
  } catch {
    return defaultState()
  }
}

function saveLocalState(state: AppState) {
  localStorage.setItem("cricket-expense-state", JSON.stringify(state))
}

const bootState = loadLocalState()

function starterDraft(players: Player[]): DraftExpense {
  const mohit = players.find((player) => player.name === "Mohit")?.id ?? players[0]?.id ?? ""
  const soum = players.find((player) => player.name === "Soum")?.id ?? players[1]?.id ?? mohit

  return {
    name: "Sunflow Ground Match",
    type: "match",
    date: "2024-05-17",
    payments: [
      { id: newId(), playerId: mohit, amount: 400, label: "Vehicle (Car)" },
      { id: newId(), playerId: soum, amount: 5000, label: "Ground Fee" },
    ],
    participantIds: players.map((player) => player.id),
    splitWeights: Object.fromEntries(players.map((player) => [player.id, 1])),
  }
}

function expenseTotal(expense: Pick<Expense, "payments"> | DraftExpense) {
  return expense.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
}

function totalSplitWeight(expense: Pick<Expense, "participantIds" | "splitWeights"> | DraftExpense) {
  return expense.participantIds.reduce((sum, playerId) => sum + (expense.splitWeights?.[playerId] ?? 1), 0)
}

function splitUnit(expense: Pick<Expense, "payments" | "participantIds" | "splitWeights"> | DraftExpense) {
  const totalWeight = totalSplitWeight(expense)
  return totalWeight ? expenseTotal(expense) / totalWeight : 0
}

function playerShare(expense: Pick<Expense, "payments" | "participantIds" | "splitWeights"> | DraftExpense, playerId: string) {
  if (!expense.participantIds.includes(playerId)) return 0
  return splitUnit(expense) * (expense.splitWeights?.[playerId] ?? 1)
}

function taggedCredits(expense: Pick<Expense, "payments">) {
  return expense.payments.filter((payment) => /vehicle|car|bike|fuel|transport|food|meal|snack|utilities|utility|light|water|other/i.test(payment.label))
}

function creditTagIcon(label: string) {
  if (/vehicle|car|bike|fuel|transport/i.test(label)) return "🚗"
  if (/food|meal|snack/i.test(label)) return "🍽"
  if (/utilities|utility|light|water/i.test(label)) return "⚡"
  return "₹"
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN")
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export default function App() {
  const [state, setState] = useState<AppState>(() => bootState)
  const [screen, setScreen] = useState<Screen>("dashboard")
  const [role, setRole] = useState<Role | null>(() => (localStorage.getItem("ra-role") as Role | null) ?? null)
  const [selectedUserId, setSelectedUserId] = useState(() => localStorage.getItem("ra-user-id") ?? bootState.players[0]?.id ?? "")
  const [draft, setDraft] = useState<DraftExpense>(() => starterDraft(bootState.players))
  const [lastExpenseId, setLastExpenseId] = useState<string | null>(null)
  const [cloudStatus, setCloudStatus] = useState(hasSupabaseConfig ? "Connecting" : "Local only")
  const [search, setSearch] = useState("")
  const [expenseSearch, setExpenseSearch] = useState("")
  const [expensePlayerFilter, setExpensePlayerFilter] = useState("all")
  const [expandedExpenseIds, setExpandedExpenseIds] = useState<Set<string>>(() => new Set(bootState.expenses[0] ? [bootState.expenses[0].id] : []))
  const [requestDraft, setRequestDraft] = useState({ playerId: "", amount: "500", reason: "Extra fuel amount", note: "Took my car for another match" })
  const [adjustDraft, setAdjustDraft] = useState({ playerId: "", amount: "", reason: "", kind: "credit" as "credit" | "debit" })
  const [playerFilter, setPlayerFilter] = useState<"all" | "creditors" | "debtors">("all")
  const [requestFilter, setRequestFilter] = useState<RequestStatus | "all">("pending")
  const [newPlayer, setNewPlayer] = useState({ name: "", phone: "" })
  const isAdmin = role === "admin"
  const activeUserId = isAdmin ? requestDraft.playerId : selectedUserId

  useEffect(() => {
    let active = true
    async function loadCloudState() {
      if (!supabase) return
      const { data, error } = await supabase.from("app_state").select("data").eq("id", "default").maybeSingle()
      if (!active) return
      if (error) {
        setCloudStatus("Supabase table missing")
        return
      }
      if (data?.data) {
        setState(data.data as AppState)
        setDraft(starterDraft((data.data as AppState).players))
      }
      setCloudStatus("Supabase synced")
    }
    loadCloudState()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    saveLocalState(state)
    if (!supabase) return
    const client = supabase
    const handle = window.setTimeout(async () => {
      const { error } = await client.from("app_state").upsert({ id: "default", data: state, updated_at: new Date().toISOString() })
      setCloudStatus(error ? "Supabase save failed" : "Supabase synced")
    }, 450)
    return () => window.clearTimeout(handle)
  }, [state])

  useEffect(() => {
    if (role) localStorage.setItem("ra-role", role)
    else localStorage.removeItem("ra-role")
  }, [role])

  useEffect(() => {
    if (selectedUserId) localStorage.setItem("ra-user-id", selectedUserId)
  }, [selectedUserId])

  const playerMap = useMemo(() => new Map(state.players.map((player) => [player.id, player])), [state.players])
  const playerIds = useMemo(() => new Set(state.players.map((player) => player.id)), [state.players])

  const balances = useMemo(() => {
    const result = new Map<string, number>()
    state.players.forEach((player) => result.set(player.id, 0))

    state.expenses.forEach((expense) => {
      expense.participantIds.forEach((playerId) => {
        if (!playerIds.has(playerId)) return
        result.set(playerId, (result.get(playerId) ?? 0) - playerShare(expense, playerId))
      })
      expense.payments.forEach((payment) => {
        if (!playerIds.has(payment.playerId)) return
        result.set(payment.playerId, (result.get(payment.playerId) ?? 0) + payment.amount)
      })
    })

    state.adjustments.forEach((adjustment) => {
      if (!playerIds.has(adjustment.playerId)) return
      result.set(adjustment.playerId, (result.get(adjustment.playerId) ?? 0) + (adjustment.kind === "credit" ? adjustment.amount : -adjustment.amount))
    })

    return result
  }, [playerIds, state])

  const totals = useMemo(() => {
    const values = [...balances.values()]
    return {
      credits: values.filter((value) => value > 0).reduce((sum, value) => sum + value, 0),
      debts: Math.abs(values.filter((value) => value < 0).reduce((sum, value) => sum + value, 0)),
      expenses: state.expenses.reduce((sum, expense) => sum + expenseTotal(expense), 0),
      creditors: values.filter((value) => value > 0).length,
      debtors: values.filter((value) => value < 0).length,
    }
  }, [balances, state.expenses])

  const pendingRechargeCount = state.requests.filter((request) => request.status === "pending").length

  const recentEntries = useMemo(() => {
    const expenseRows = state.expenses.map((expense) => ({
      id: expense.id,
      title: expense.name,
      meta: `${labelFor(expense.type)} | ${expense.participantIds.length} players`,
      amount: expenseTotal(expense),
      createdAt: expense.createdAt,
      type: "expense",
    }))
    const adjustmentRows = state.adjustments.map((adjustment) => ({
      id: adjustment.id,
      title: playerMap.get(adjustment.playerId)?.name ?? "Player",
      meta: adjustment.reason || (adjustment.kind === "credit" ? "Credit added" : "Debit added"),
      amount: adjustment.kind === "credit" ? adjustment.amount : -adjustment.amount,
      createdAt: adjustment.createdAt,
      type: adjustment.kind,
    }))
    return [...expenseRows, ...adjustmentRows].sort((a, b) => b.createdAt - a.createdAt)
  }, [playerMap, state.adjustments, state.expenses])

  const visiblePlayers = useMemo(
    () => state.players.filter((player) => player.name.toLowerCase().includes(search.toLowerCase())),
    [search, state.players],
  )

  const visibleExpenses = useMemo(
    () =>
      state.expenses
        .filter((expense) => expense.name.toLowerCase().includes(expenseSearch.toLowerCase()))
        .filter((expense) => {
          const filterId = isAdmin ? expensePlayerFilter : selectedUserId
          if (filterId === "all") return true
          return expense.participantIds.includes(filterId) || expense.payments.some((payment) => payment.playerId === filterId)
        }),
    [expensePlayerFilter, expenseSearch, isAdmin, selectedUserId, state.expenses],
  )

  function updateDraftPayment(id: string, patch: Partial<Payment>) {
    setDraft((current) => ({ ...current, payments: current.payments.map((payment) => (payment.id === id ? { ...payment, ...patch } : payment)) }))
  }

  function addPlayer() {
    if (!newPlayer.name.trim()) return
    const player: Player = { id: newId(), name: newPlayer.name.trim(), phone: newPlayer.phone.trim() || undefined }
    setState((current) => ({ ...current, players: [...current.players, player] }))
    setDraft((current) => ({ ...current, participantIds: [...current.participantIds, player.id], splitWeights: { ...current.splitWeights, [player.id]: 1 } }))
    setNewPlayer({ name: "", phone: "" })
    setScreen("players")
  }

  function deletePlayer(playerId: string) {
    const player = playerMap.get(playerId)
    if (!player || !confirm(`Delete ${player.name}? Existing expenses will stay, but this player will be removed from future lists.`)) return
    setState((current) => ({
      ...current,
      players: current.players.filter((item) => item.id !== playerId),
      expenses: current.expenses
        .map((expense) => cleanExpenseForPlayers(expense, new Set(current.players.filter((item) => item.id !== playerId).map((item) => item.id))))
        .filter((expense) => expense.participantIds.length > 0 || expense.payments.length > 0),
      requests: current.requests.filter((item) => item.playerId !== playerId),
      adjustments: current.adjustments.filter((item) => item.playerId !== playerId),
    }))
    if (selectedUserId === playerId) {
      const nextUserId = state.players.find((item) => item.id !== playerId)?.id ?? ""
      setSelectedUserId(nextUserId)
      setRole(nextUserId ? role : null)
    }
    setScreen("players")
  }

  function createExpense() {
    const expense: Expense = {
      ...draft,
      id: newId(),
      payments: draft.payments.filter((payment) => payment.playerId && payment.amount > 0),
      participantIds: draft.participantIds,
      splitWeights: draft.splitWeights,
      createdAt: Date.now(),
    }
    if (!expenseTotal(expense) || !expense.participantIds.length) return
    setState((current) => ({ ...current, expenses: [expense, ...current.expenses] }))
    setLastExpenseId(expense.id)
    setScreen("expense-success")
  }

  function resetDraft() {
    if (!isAdmin) return
    setDraft(starterDraft(state.players))
    setScreen("expense-basic")
  }

  function submitRequest() {
    if (!activeUserId || !Number(requestDraft.amount)) return
    const request: CreditRequest = {
      id: newId(),
      playerId: activeUserId,
      amount: Number(requestDraft.amount),
      reason: requestDraft.reason,
      note: requestDraft.note,
      status: "pending",
      createdAt: Date.now(),
    }
    setState((current) => ({ ...current, requests: [request, ...current.requests] }))
    setScreen(role === "admin" ? "pending-requests" : "dashboard")
  }

  function updateRequest(id: string, status: RequestStatus) {
    setState((current) => {
      const request = current.requests.find((item) => item.id === id)
      const alreadyFinal = request?.status !== "pending"
      const adjustment =
        status === "approved" && request && !alreadyFinal
          ? [{ id: newId(), playerId: request.playerId, kind: "credit" as const, amount: request.amount, reason: `Recharge approved: ${request.reason}`, createdAt: Date.now() }]
          : []
      return {
        ...current,
        requests: current.requests.map((item) => (item.id === id && item.status === "pending" ? { ...item, status } : item)),
        adjustments: [...adjustment, ...current.adjustments],
      }
    })
  }

  function applyAdjustment() {
    if (!adjustDraft.playerId || !Number(adjustDraft.amount)) return
    const adjustment: Adjustment = {
      id: newId(),
      playerId: adjustDraft.playerId,
      kind: adjustDraft.kind,
      amount: Number(adjustDraft.amount),
      reason: adjustDraft.reason || (adjustDraft.kind === "credit" ? "Manual credit" : "Manual debit"),
      createdAt: Date.now(),
    }
    setState((current) => ({ ...current, adjustments: [adjustment, ...current.adjustments] }))
    setAdjustDraft({ playerId: "", amount: "", reason: "", kind: adjustDraft.kind })
    setScreen("dashboard")
  }

  function clearData() {
    if (!confirm("Reset all players, expenses, requests, credits, and debits?")) return
    const fresh = defaultState()
    setState(fresh)
    setDraft(starterDraft(fresh.players))
  }

  function updateDraftWeight(playerId: string, value: number) {
    setDraft((current) => ({ ...current, splitWeights: { ...current.splitWeights, [playerId]: value } }))
  }

  function toggleExpenseDetails(id: string) {
    setExpandedExpenseIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const lastExpense = state.expenses.find((expense) => expense.id === lastExpenseId)

  if (!role) {
    return (
      <main className="app-shell auth-shell">
        <section className="login-screen">
          <img src={LOGO_URL} alt="RA Challenger logo" />
          <h1>RA Challenger</h1>
          <p>Choose how you want to enter the app.</p>
          <button className="primary success" onClick={() => { setRole("admin"); setScreen("dashboard") }}>
            Admin Login
          </button>
          <div className="login-card">
            <Field label="Player Login">
              <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                {state.players.map((player) => (
                  <option key={player.id} value={player.id}>{player.name}</option>
                ))}
              </select>
            </Field>
            <button className="primary" onClick={() => { setRole("user"); setScreen("dashboard") }}>
              Continue as User
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="icon-button" onClick={() => setScreen("dashboard")} aria-label="Back to dashboard">
          ☰
        </button>
        <div className="brand-lockup">
          <img className="team-logo-img" src={LOGO_URL} alt="RA Challenger logo" />
          <div>
            <p>RA Challenger</p>
            <span>{isAdmin ? "Rohan Abhilasha" : playerMap.get(selectedUserId)?.name ?? "Player"} <b>{isAdmin ? "Admin" : "User"}</b></span>
          </div>
        </div>
        <button className="notify-button" onClick={() => setScreen(isAdmin ? "pending-requests" : "credit-request")} aria-label="Recharge">
          🔔
          {isAdmin && pendingRechargeCount > 0 && <span>{pendingRechargeCount}</span>}
        </button>
      </header>

      {screen === "dashboard" && (
        <section className="screen dashboard">
          <div className="balance-panel">
            <div className="batter-art" />
            <span>Total balance</span>
            <strong>{money(totals.credits - totals.debts)}</strong>
            <small>Total Credits - Total Debts</small>
            <div className="sparkline" />
          </div>

          <div className="metric-grid three">
            <Metric label="Pending dues" value={money(totals.debts)} tone="debit" detail={`${totals.debtors} players`} />
            <Metric label="Total credits" value={money(totals.credits)} tone="credit" />
            <Metric label="Recharge approvals" value={String(pendingRechargeCount)} tone="warn" />
          </div>

          <div className="quick-grid">
            {isAdmin && <QuickAction label="Add Player" icon="👤" onClick={() => setScreen("add-player")} />}
            {isAdmin && <QuickAction label="Add Expense" icon="₹" onClick={resetDraft} />}
            <QuickAction label="Recharge" icon="↻" onClick={() => setScreen(isAdmin ? "pending-requests" : "credit-request")} />
            <QuickAction label="Players" icon="P" onClick={() => setScreen("players")} />
            {!isAdmin && <QuickAction label="Expenses" icon="E" onClick={() => setScreen("expenses")} />}
          </div>

          {isAdmin && pendingRechargeCount > 0 && (
            <button className="danger-alert" onClick={() => setScreen("pending-requests")}>
              <b>!</b>
              <span>{pendingRechargeCount} recharge request{pendingRechargeCount > 1 ? "s" : ""} waiting for admin approval</span>
              <strong>Review</strong>
            </button>
          )}
        </section>
      )}

      {screen === "add-player" && (
        <FormScreen title="Add Player" back={() => setScreen("players")}>
          {!isAdmin && <EmptyState text="Only admin can add players." />}
          {isAdmin && (
            <>
          <Field label="Player Name">
            <input placeholder="e.g. Amit Tiwary" value={newPlayer.name} onChange={(event) => setNewPlayer((current) => ({ ...current, name: event.target.value }))} />
          </Field>
          <Field label="Phone (optional)">
            <input placeholder="9876543210" value={newPlayer.phone} onChange={(event) => setNewPlayer((current) => ({ ...current, phone: event.target.value }))} />
          </Field>
          <button className="primary success" onClick={addPlayer}>
            Add Player
          </button>
            </>
          )}
        </FormScreen>
      )}

      {screen === "expense-basic" && (
        <FormScreen title="Add Expense" back={() => setScreen("dashboard")}>
          {!isAdmin && <EmptyState text="Only admin can add expenses." />}
          {isAdmin && (
            <>
          <TypePicker value={draft.type} onChange={(type) => setDraft((current) => ({ ...current, type }))} />
          <Field label="Expense Name">
            <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
          </Field>
          <Field label="Date">
            <input type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} />
          </Field>
          <Field label="Total Amount">
            <input value={expenseTotal(draft)} readOnly />
          </Field>
          <button className="primary" onClick={() => setScreen("expense-payments")}>
            Next: Add Payments
          </button>
            </>
          )}
        </FormScreen>
      )}

      {screen === "expense-payments" && (
        <FormScreen title="Add Payments" back={() => setScreen("expense-basic")}>
          <button
            className="primary subtle"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                payments: [...current.payments, { id: newId(), playerId: state.players[0]?.id ?? "", amount: 0, label: "Food" }],
              }))
            }
          >
            Add Spending / Credit
          </button>
          <div className="list">
            {draft.payments.map((payment) => (
              <div className="payment-card" key={payment.id}>
                <select value={payment.playerId} onChange={(event) => updateDraftPayment(payment.id, { playerId: event.target.value })}>
                  {state.players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
                <select value={payment.label} onChange={(event) => updateDraftPayment(payment.id, { label: event.target.value })}>
                  {paymentCategories.map((category) => (
                    <option key={category.label} value={category.label}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <input type="number" value={payment.amount} onChange={(event) => updateDraftPayment(payment.id, { amount: Number(event.target.value) })} />
                <button className="remove-payment" onClick={() => setDraft((current) => ({ ...current, payments: current.payments.filter((item) => item.id !== payment.id) }))}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="total-row">
            <span>Total Paid</span>
            <strong>{money(expenseTotal(draft))}</strong>
          </div>
          <button className="primary" onClick={() => setScreen("expense-players")}>
            Next: Select Players
          </button>
        </FormScreen>
      )}

      {screen === "expense-players" && (
        <FormScreen title="Select Players" back={() => setScreen("expense-payments")}>
          <div className="search-box">
            <input placeholder="Search players..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <label className="check-row">
            <input
              type="checkbox"
              checked={draft.participantIds.length === state.players.length}
              onChange={(event) => setDraft((current) => ({ ...current, participantIds: event.target.checked ? state.players.map((player) => player.id) : [] }))}
            />
            Select All ({state.players.length})
          </label>
          <div className="select-list">
            {visiblePlayers.map((player) => (
              <div className="player-pick-row" key={player.id}>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={draft.participantIds.includes(player.id)}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        participantIds: event.target.checked
                          ? [...current.participantIds, player.id]
                          : current.participantIds.filter((id) => id !== player.id),
                      }))
                    }
                  />
                  {player.name}
                </label>
                {draft.participantIds.includes(player.id) && (
                  <select className="weight-select" value={draft.splitWeights[player.id] ?? 1} onChange={(event) => updateDraftWeight(player.id, Number(event.target.value))}>
                    <option value={1}>1x</option>
                    <option value={2}>2x</option>
                    <option value={3}>3x</option>
                    <option value={4}>4x</option>
                  </select>
                )}
              </div>
            ))}
          </div>
          <div className="sticky-actions">
            <span>Selected: {draft.participantIds.length} players</span>
            <button className="primary compact" onClick={() => setScreen("expense-review")}>
              Next: Review
            </button>
          </div>
        </FormScreen>
      )}

      {screen === "expense-review" && (
        <FormScreen title="Review Expense" back={() => setScreen("expense-players")}>
          <div className="review-card">
            <div>
              <span>Total Amount</span>
              <strong>{money(expenseTotal(draft))}</strong>
            </div>
            <div>
              <span>Players</span>
              <strong>{draft.participantIds.length}</strong>
            </div>
            <div>
              <span>Per Head</span>
              <strong>{money(splitUnit(draft))}</strong>
            </div>
          </div>
          <SectionHeader title="Payments Summary" />
          <div className="list">
            {draft.payments.map((payment) => (
              <div className="activity-row" key={payment.id}>
                <Avatar label={playerMap.get(payment.playerId)?.name ?? "?"} />
                <div>
                  <strong>{playerMap.get(payment.playerId)?.name}</strong>
                  <span>{payment.label}</span>
                </div>
                <b className="credit">{money(payment.amount)}</b>
              </div>
            ))}
          </div>
          <div className="total-row">
            <span>Total Paid</span>
            <strong>{money(expenseTotal(draft))}</strong>
          </div>
          <button className="primary" onClick={createExpense}>
            Create Expense
          </button>
        </FormScreen>
      )}

      {screen === "expense-success" && lastExpense && (
        <FormScreen title="" back={() => setScreen("dashboard")}>
          <div className="success-state">
            <div className="success-icon">✓</div>
            <h1>Expense Created Successfully!</h1>
            <p>{lastExpense.name}</p>
            <span>{new Date(lastExpense.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <div className="review-card">
            <div>
              <span>Total Amount</span>
              <strong>{money(expenseTotal(lastExpense))}</strong>
            </div>
            <div>
              <span>Players</span>
              <strong>{lastExpense.participantIds.length}</strong>
            </div>
            <div>
              <span>Per Head</span>
              <strong>{money(splitUnit(lastExpense))}</strong>
            </div>
          </div>
          <button className="primary success" onClick={() => { setExpandedExpenseIds((s) => new Set(s).add(lastExpense.id)); setScreen("expenses") }}>
            View Expense Details
          </button>
          <button className="link-button" onClick={() => setScreen("dashboard")}>
            Back to Dashboard
          </button>
        </FormScreen>
      )}

      {screen === "expenses" && (
        <section className="screen expenses-screen">
          <SubNav title="Expenses" back={() => setScreen("dashboard")} />
          <div className="expense-filter-card">
            <div className="expense-search">
              <span>⌕</span>
              <input placeholder="Search description..." value={expenseSearch} onChange={(event) => setExpenseSearch(event.target.value)} />
            </div>
            {isAdmin ? (
              <select value={expensePlayerFilter} onChange={(event) => setExpensePlayerFilter(event.target.value)}>
                <option value="all">All Players</option>
                {state.players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="readonly-filter">{playerMap.get(selectedUserId)?.name ?? "My Expenses"}</div>
            )}
          </div>
          <div className="expenses-list">
            {visibleExpenses.length === 0 && <EmptyState text="No expenses match this filter." />}
            {visibleExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                playerMap={playerMap}
                expanded={expandedExpenseIds.has(expense.id)}
                onToggle={() => toggleExpenseDetails(expense.id)}
              />
            ))}
          </div>
        </section>
      )}

      {screen === "players" && (
        <section className="screen">
          <SubNav title="Players" back={() => setScreen("dashboard")} right={<button className="subnav-action" onClick={() => setScreen("add-player")}>👤+</button>} />
          <div className="search-box players-search">
            <input placeholder="Search players..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="segmented">
            <button className={playerFilter === "all" ? "active" : ""} onClick={() => setPlayerFilter("all")}>All ({state.players.length})</button>
            <button className={playerFilter === "creditors" ? "active" : ""} onClick={() => setPlayerFilter("creditors")}>Creditors ({totals.creditors})</button>
            <button className={playerFilter === "debtors" ? "active" : ""} onClick={() => setPlayerFilter("debtors")}>Debtors ({totals.debtors})</button>
          </div>
          <div className="list">
            {[...state.players]
              .sort((a, b) => (balances.get(b.id) ?? 0) - (balances.get(a.id) ?? 0))
              .filter((player) => isAdmin || player.id === selectedUserId)
              .filter((player) => player.name.toLowerCase().includes(search.toLowerCase()))
              .filter((player) => {
                const bal = balances.get(player.id) ?? 0
                if (playerFilter === "creditors") return bal > 0
                if (playerFilter === "debtors") return bal < 0
                return true
              })
              .map((player) => {
                const balance = balances.get(player.id) ?? 0
                return (
                  <button className="player-row" key={player.id} onClick={() => setScreen(`player:${player.id}`)}>
                    <Avatar label={player.name} />
                    <div>
                      <strong>{player.name}</strong>
                      <span>{balance > 0 ? "Creditor" : balance < 0 ? "Debtor" : "Balanced"}</span>
                    </div>
                    <b className={balance >= 0 ? "credit" : "debit"}>{signedMoney(balance)}</b>
                  </button>
                )
              })}
          </div>
        </section>
      )}

      {screen.startsWith("player:") && <PlayerProfile playerId={screen.split(":")[1]} state={state} balances={balances} setScreen={setScreen} onDelete={deletePlayer} isAdmin={isAdmin} />}

      {screen === "credit-request" && (
        <FormScreen title="Recharge Request" back={() => setScreen("dashboard")}>
          <Field label="Player">
            <select value={isAdmin ? requestDraft.playerId : selectedUserId} disabled={!isAdmin} onChange={(event) => setRequestDraft((current) => ({ ...current, playerId: event.target.value }))}>
              <option value="">Select player</option>
              {state.players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount">
            <input type="number" value={requestDraft.amount} onChange={(event) => setRequestDraft((current) => ({ ...current, amount: event.target.value }))} />
          </Field>
          <Field label="Reason">
            <input placeholder="Recharge reason" value={requestDraft.reason} onChange={(event) => setRequestDraft((current) => ({ ...current, reason: event.target.value }))} />
          </Field>
          <Field label="Note (optional)">
            <input value={requestDraft.note} onChange={(event) => setRequestDraft((current) => ({ ...current, note: event.target.value }))} />
          </Field>
          <button className="primary" onClick={submitRequest}>
            Send Recharge Request
          </button>
        </FormScreen>
      )}

      {screen === "pending-requests" && (
        <section className="screen">
          <SubNav title="Recharge Approvals" back={() => setScreen("dashboard")} right={<button className="subnav-action" onClick={() => setScreen("credit-request")}>+</button>} />
          {!isAdmin && <EmptyState text="Recharge approvals are available for admin only." />}
          {isAdmin && (
            <>
          <div className="segmented">
            <button className={requestFilter === "pending" ? "active" : ""} onClick={() => setRequestFilter("pending")}>Pending ({state.requests.filter((item) => item.status === "pending").length})</button>
            <button className={requestFilter === "approved" ? "active" : ""} onClick={() => setRequestFilter("approved")}>Approved</button>
            <button className={requestFilter === "rejected" ? "active" : ""} onClick={() => setRequestFilter("rejected")}>Rejected</button>
          </div>
          <div className="list">
            {state.requests.filter((r) => requestFilter === "all" || r.status === requestFilter).length === 0 && <EmptyState text="No recharge requests yet." />}
            {state.requests.filter((r) => requestFilter === "all" || r.status === requestFilter).map((request) => (
              <div className="request-card" key={request.id}>
                <Avatar label={playerMap.get(request.playerId)?.name ?? "?"} />
                <div>
                  <strong>{playerMap.get(request.playerId)?.name}</strong>
                  <span>{request.reason}</span>
                  <small>{new Date(request.createdAt).toLocaleDateString("en-IN")}</small>
                </div>
                <b className="credit">{money(request.amount)}</b>
                {request.status === "pending" ? (
                  <div className="request-actions">
                    <button onClick={() => updateRequest(request.id, "approved")}>Approve</button>
                    <button onClick={() => updateRequest(request.id, "rejected")}>Reject</button>
                  </div>
                ) : (
                  <em>{request.status}</em>
                )}
              </div>
            ))}
          </div>
            </>
          )}
        </section>
      )}

      {screen === "adjustments" && (
        <FormScreen title="Add Credit / Debit" back={() => setScreen("dashboard")}>
          {!isAdmin && <EmptyState text="Only admin can add manual credit or debit." />}
          {isAdmin && (
            <>
          <div className="segmented strong">
            <button className={adjustDraft.kind === "credit" ? "active" : ""} onClick={() => setAdjustDraft((current) => ({ ...current, kind: "credit" }))}>
              Add Credit
            </button>
            <button className={adjustDraft.kind === "debit" ? "active danger" : ""} onClick={() => setAdjustDraft((current) => ({ ...current, kind: "debit" }))}>
              Add Debit
            </button>
          </div>
          <Field label="Select Player">
            <select value={adjustDraft.playerId} onChange={(event) => setAdjustDraft((current) => ({ ...current, playerId: event.target.value }))}>
              <option value="">Select player</option>
              {state.players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount">
            <input type="number" value={adjustDraft.amount} onChange={(event) => setAdjustDraft((current) => ({ ...current, amount: event.target.value }))} />
          </Field>
          <Field label="Reason">
            <input value={adjustDraft.reason} onChange={(event) => setAdjustDraft((current) => ({ ...current, reason: event.target.value }))} />
          </Field>
          <button className={`primary ${adjustDraft.kind === "debit" ? "danger" : "success"}`} onClick={applyAdjustment}>
            {adjustDraft.kind === "credit" ? "Add Credit" : "Add Debit"}
          </button>
            </>
          )}
        </FormScreen>
      )}

      {screen === "reports" && (
        <section className="screen">
          <SubNav title="More" back={() => setScreen("dashboard")} />
          <div className="report-layout">
            <div className="donut">
              <div />
            </div>
            <div className="legend">
              {expenseTypes.map((type) => {
                const total = state.expenses.filter((expense) => expense.type === type.id).reduce((sum, expense) => sum + expenseTotal(expense), 0)
                return total ? <span key={type.id}>{type.label}: {money(total)}</span> : null
              })}
            </div>
          </div>
          <div className="summary-card">
            <Row label="Login" value={isAdmin ? "Admin" : `User - ${playerMap.get(selectedUserId)?.name ?? "Player"}`} />
            <Row label="Total Credits" value={money(totals.credits)} />
            <Row label="Total Debts" value={money(totals.debts)} />
            <Row label="Net Balance" value={money(totals.credits - totals.debts)} />
            <Row label="Total Expenses" value={money(totals.expenses)} />
            <Row label="Sync" value={cloudStatus} />
          </div>
          <SectionHeader title="Transaction Activity" />
          <div className="list">
            {recentEntries.length === 0 && <EmptyState text="Create the first expense to calculate balances." />}
            {recentEntries.map((entry) => (
              <div className="activity-row" key={entry.id}>
                <Avatar label={entry.title} />
                <div>
                  <strong>{entry.title}</strong>
                  <span>{entry.meta}</span>
                </div>
                <b className={entry.amount >= 0 ? "credit" : "debit"}>{entry.type === "expense" ? money(entry.amount) : signedMoney(entry.amount)}</b>
              </div>
            ))}
          </div>
          <button className="secondary" onClick={clearData}>
            Reset Demo Data
          </button>
          <button className="secondary logout" onClick={() => setRole(null)}>
            Logout
          </button>
        </section>
      )}

      <nav className="bottom-nav">
        <button className={screen === "dashboard" ? "active" : ""} onClick={() => setScreen("dashboard")}>Home</button>
        <button className={screen === "players" ? "active" : ""} onClick={() => setScreen("players")}>Players</button>
        <button className="fab" onClick={() => isAdmin ? resetDraft() : setScreen("credit-request")}>{isAdmin ? "+" : "↻"}</button>
        <button className={screen === "expenses" ? "active" : ""} onClick={() => setScreen("expenses")}>Expenses</button>
        <button className={screen === "reports" ? "active" : ""} onClick={() => setScreen("reports")}>More</button>
      </nav>
    </main>
  )
}

function ExpenseCard({
  expense,
  playerMap,
  expanded,
  onToggle,
}: {
  expense: Expense
  playerMap: Map<string, Player>
  expanded: boolean
  onToggle: () => void
}) {
  const contributors = expense.participantIds.map((playerId) => ({
    id: playerId,
    name: playerMap.get(playerId)?.name ?? "Player",
    weight: expense.splitWeights?.[playerId] ?? 1,
    amount: playerShare(expense, playerId),
  }))
  const tagged = taggedCredits(expense)

  return (
    <article className="expense-card">
      <button className="expense-card-head" onClick={onToggle}>
        <div>
          <h2>{expense.name}</h2>
          <time>{formatDate(expense.date)}</time>
        </div>
        <div className="expense-head-meta">
          <strong>{money(expenseTotal(expense))}</strong>
          <span>
            <b>👥 {expense.participantIds.length}</b>
            {tagged.length > 0 && <b>₹ {tagged.length}</b>}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="expense-details">
          <button className="details-toggle" onClick={onToggle}>
            ▼ Details
          </button>
          <h3>Contributors</h3>
          <div className="contributor-grid">
            {contributors.map((contributor) => (
              <div className="contributor-tile" key={contributor.id}>
                <p>
                  {contributor.name} <span>• {contributor.weight}x •</span>
                </p>
                <strong>{money(contributor.amount)}</strong>
              </div>
            ))}
          </div>

          {tagged.length > 0 && (
            <>
              <h3>Tagged Credits</h3>
              <div className="vehicle-grid">
                {tagged.map((payment) => (
                  <div className="vehicle-tile" key={payment.id}>
                    {creditTagIcon(payment.label)} {playerMap.get(payment.playerId)?.name ?? "Player"} <span>• {payment.label} • {money(payment.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </article>
  )
}

function PlayerProfile({
  playerId,
  state,
  balances,
  setScreen,
  onDelete,
  isAdmin,
}: {
  playerId: string
  state: AppState
  balances: Map<string, number>
  setScreen: (screen: Screen) => void
  onDelete: (playerId: string) => void
  isAdmin: boolean
}) {
  const player = state.players.find((item) => item.id === playerId)
  if (!player) return null
  const balance = balances.get(playerId) ?? 0
  const expenseRows = state.expenses
    .filter((expense) => expense.participantIds.includes(playerId) || expense.payments.some((payment) => payment.playerId === playerId))
    .map((expense) => {
      const paid = expense.payments.filter((payment) => payment.playerId === playerId).reduce((sum, payment) => sum + payment.amount, 0)
      const share = playerShare(expense, playerId)
      const playerPayments = expense.payments.filter((p) => p.playerId === playerId)
      const paymentLabel = playerPayments.length > 0 ? playerPayments.map((p) => p.label).join(", ") : "Match Fee Share"
      const net = paid - share
      return {
        id: expense.id,
        title: expense.name,
        meta: net >= 0 ? `Credit Added\n${paymentLabel}` : `Debt Added\n${paymentLabel}`,
        amount: net,
        date: expense.date,
        createdAt: expense.createdAt,
      }
    })
  const adjustmentRows = state.adjustments
    .filter((adjustment) => adjustment.playerId === playerId)
    .map((adjustment) => ({
      id: adjustment.id,
      title: adjustment.reason,
      meta: adjustment.kind === "credit" ? "Credit Added" : "Debit Added",
      amount: adjustment.kind === "credit" ? adjustment.amount : -adjustment.amount,
      date: new Date(adjustment.createdAt).toISOString().slice(0, 10),
      createdAt: adjustment.createdAt,
    }))
  const rows = [...expenseRows, ...adjustmentRows].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <section className="screen">
      <SubNav title={`${player.name}'s Profile`} back={() => setScreen("players")} right={isAdmin ? <button className="subnav-action danger-text" onClick={() => onDelete(player.id)}>Delete</button> : undefined} />
      <div className="profile-head">
        <Avatar label={player.name} large />
        <div>
          <h1>{player.name}</h1>
          <span className={balance >= 0 ? "credit" : "debit"}>{balance > 0 ? "Creditor" : balance < 0 ? "Debtor" : "Balanced"}</span>
        </div>
        <b className={balance >= 0 ? "credit" : "debit"}>{signedMoney(balance)}</b>
      </div>
      <div className="summary-card">
        <Row label="Total Credits" value={money(rows.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0))} />
        <Row label="Total Debts" value={money(rows.filter((r) => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0))} />
        <Row label="Net Balance" value={signedMoney(balance)} />
      </div>
      <SectionHeader title="Recent Transactions" />
      <div className="list">
        {rows.length === 0 && <EmptyState text="No transactions for this player yet." />}
        {rows.map((row) => (
          <div className="activity-row" key={row.id}>
            <Avatar label={row.title} />
            <div>
              <strong>{row.title}</strong>
              <small style={{ display: "block", color: "#66778b", fontSize: 10 }}>{formatDate(row.date)}</small>
              {row.meta.split("\n").map((line, i) => (
                <span key={i} style={{ display: "block" }}>{line}</span>
              ))}
            </div>
            <b className={row.amount >= 0 ? "credit" : "debit"}>{signedMoney(row.amount)}</b>
          </div>
        ))}
      </div>
    </section>
  )
}

function FormScreen({ title, back, children }: { title: string; back: () => void; children: ReactNode }) {
  return (
    <section className="screen form-screen">
      <SubNav title={title} back={back} />
      {children}
    </section>
  )
}

function SubNav({ title, back, right }: { title: string; back: () => void; right?: ReactNode }) {
  return (
    <div className="subnav">
      <button onClick={back} aria-label="Go back">
        ‹
      </button>
      <h1>{title}</h1>
      {right && <div className="subnav-right">{right}</div>}
    </div>
  )
}

function TypePicker({ value, onChange }: { value: ExpenseType; onChange: (value: ExpenseType) => void }) {
  return (
    <div className="type-picker">
      {expenseTypes.map((type) => (
        <button className={value === type.id ? "active" : ""} key={type.id} onClick={() => onChange(type.id)}>
          <b>{type.icon}</b>
          <span>{type.label}</span>
        </button>
      ))}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function Avatar({ label, large = false }: { label: string; large?: boolean }) {
  return <div className={large ? "avatar large" : "avatar"}>{initials(label)}</div>
}

function Metric({ label, value, tone, detail }: { label: string; value: string; tone: "credit" | "debit" | "warn"; detail?: string }) {
  return (
    <div className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  )
}

function QuickAction({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button className="quick-action" onClick={onClick}>
      <b>{icon}</b>
      <span>{label}</span>
    </button>
  )
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {action && <button onClick={onAction}>{action}</button>}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
