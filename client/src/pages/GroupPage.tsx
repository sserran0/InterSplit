import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useCurrency } from '../hooks/useCurrency'
import { formatCurrency } from '../lib/formatCurrency'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CURRENCY_CONFIG, getCurrencyFlag } from '../lib/currencyConfig'
import AddExpenseForm from '../components/expenses/AddExpenseForm'
import api from '../lib/api'

interface Member {
  id: string
  name: string
  preferred_currency: string
}
interface Split {
  user_id: string
  share_amount: number
  is_settled: boolean
}
interface Expense {
  id: string
  amount: number
  currency: string
  description: string
  paid_by: string
  splits: Split[]
}

export default function GroupPage() {
  const { id } = useParams<{ id: string }>()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberCurrency, setNewMemberCurrency] = useState('USD')
  const [addMemberError, setAddMemberError] = useState('')
  const [groupName, setGroupName] = useState('')
  const [expandedExpense, setExpandedExpense] = useState<Set<string>>(new Set())
  const user = useAuthStore((s) => s.user)
  const { convert } = useCurrency()
  const navigate = useNavigate()

  const fetchAll = () => {
    api.get(`/groups/${id}/expenses`).then(({ data }) => setExpenses(data ?? []))
    api.get(`/groups/${id}/members`).then(({ data }) => setMembers(data ?? []))
    api.get('/groups').then(({ data }) => {
      const group = data?.find((g: any) => g.id === id)
      if (group) setGroupName(group.name)
    })
  }

  useEffect(() => {
    fetchAll()
  }, [id])

  const addMember = async () => {
    if (!newMemberName.trim()) return
    try {
      await api.post(`/groups/${id}/members`, {
        name: newMemberName,
        preferred_currency: newMemberCurrency,
      })
      setNewMemberName('')
      setNewMemberCurrency('USD')
      setShowAddMember(false)
      fetchAll()
    } catch (err: any) {
      setAddMemberError(err.response?.data || 'Could not add member :(')
    }
  }

  const removeMember = async (memberID: string) => {
    try {
      await api.delete(`/groups/${id}/members/${memberID}`)
      fetchAll()
    } catch (err: any) {
      alert(err.response?.data || 'Could not resolve member')
    }
  }

  const deleteExpense = async (expenseID: string) => {
    try {
      await api.delete(`/expenses/${expenseID}`)
      fetchAll()
    } catch (err: any) {
      alert(err.response?.data || 'Could Not Delete Expense')
    }
  }

  const toggleExpense = (expenseID: string) => {
    setExpandedExpense((prev) => {
      const next = new Set(prev)
      if (next.has(expenseID)) {
        next.delete(expenseID)
      } else {
        next.add(expenseID)
      }
      return next
    })
  }

  const myBalance = expenses.reduce((acc, expense) => {
    const myShare = expense.splits?.find((s) => s.user_id === user?.id)
    if (!myShare) return acc
    const shareInMyCurrency = convert(
      myShare.share_amount,
      expense.currency,
      user?.preferred_currency ?? 'USD'
    )
    const isPayer = expense.paid_by === user?.id
    const totalInMyCurrency = convert(
      expense.amount,
      expense.currency,
      user?.preferred_currency ?? 'USD'
    )
    return acc + (isPayer ? totalInMyCurrency - shareInMyCurrency : -shareInMyCurrency)
  }, 0)

  return (
    <div className="w-full px-8 py-6">

      {/* header */}
      <div className="mb-6">
        <button
          className="cursor-pointer text-sm hover:text-gray-500 transition-colors duration-200 hover:underline flex items-center gap-1 mb-3"
          onClick={() => navigate('/dashboard')}
        >
          ← Back To Groups
        </button>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold intersplit-header">{groupName} Expenses</h1>
        </div>
      </div>

      {/* grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/*left col*/}
        <div className="flex flex-col gap-4">
          <div className="border rounded-lg p-4">

            <div className="flex justify-between items-center mb-3">
              <p className="font-medium text-sm">Members ({members.length})</p>
              <button
                className="cursor-pointer text-sm text-blue-500 hover:underline hover:text-muted-foreground transition-colors duration-200 flex items-center gap-1"
                onClick={() => setShowAddMember(!showAddMember)}
              >
                {showAddMember ? '✕ Cancel' : '+ Add Member'}
              </button>
            </div>

            {showAddMember && (
              <div className="mb-4 p-3 rounded-lg flex flex-col gap-2">
                <Input
                  placeholder="Name"
                  className="placeholder:text-gray"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                />
                <select
                  className="cursor-pointer border rounded px-3 py-2 text-sm"
                  value={newMemberCurrency}
                  onChange={(e) => setNewMemberCurrency(e.target.value)}
                >
                  {Object.entries(CURRENCY_CONFIG).map(([code, { flag, label }]) => (
                    <option key={code} value={code}>
                      {flag} {code} — {label}
                    </option>
                  ))}
                </select>
                {addMemberError && (
                  <p className="text-red-500 text-xs">{addMemberError}</p>
                )}
                <Button
                  onClick={addMember}
                  className="cursor-pointer transition-colors duration-200 hover:bg-blue-600"
                >
                  Add to group
                </Button>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {members.map((m) => {
                const myShareTotal = expenses.reduce((acc, expense) => {
                  const split = expense.splits?.find((s) => s.user_id === m.id)
                  if (!split) return acc
                  return acc + convert(split.share_amount, expense.currency, user?.preferred_currency ?? 'USD')
                }, 0)

                const theirShareTotal = expenses.reduce((acc, expense) => {
                  const split = expense.splits?.find((s) => s.user_id === m.id)
                  if (!split) return acc
                  return acc + convert(split.share_amount, expense.currency, m.preferred_currency)
                }, 0)

                const isCurrentUser = m.id === user?.id

                return (
                  <div key={m.id} className="flex justify-between items-center py-1 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-xs text-black font-medium">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {m.name}{' '}
                          {isCurrentUser && (
                            <span className="text-muted-foreground font-normal">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getCurrencyFlag(m.preferred_currency)} {m.preferred_currency}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          myShareTotal < 0 ? 'text-red-500' :
                          myShareTotal > 0 ? 'text-green-600' : ''
                        }`}>
                          {myShareTotal === 0
                            ? '—'
                            : `${myShareTotal > 0 ? '+' : ''}${formatCurrency(myShareTotal, user?.preferred_currency ?? 'USD')}`
                          }
                        </p>
                        {m.preferred_currency !== user?.preferred_currency && (
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(theirShareTotal, m.preferred_currency)}
                          </p>
                        )}
                      </div>
                      {!isCurrentUser && (
                        <button
                          className="cursor-pointer text-red-400 text-xs transition-colors duration-200 hover:underline hover:text-muted-foreground ml-2"
                          onClick={() => removeMember(m.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </div>

        {/*right col*/}
        <div className="flex flex-col gap-4">

          <AddExpenseForm
            groupId={id!}
            members={members}
            onAdded={fetchAll}
          />

          <div className="flex flex-col gap-3">
            {expenses.length === 0 && (
              <p className="text-sm text-muted-foreground">All Square For Now...</p>
            )}
            {expenses.map((expense) => {
              const isExpanded = expandedExpense.has(expense.id)
              const myShare = expense.splits?.find((s) => s.user_id === user?.id)

              return (
                <div key={expense.id} className="border border-white/20 rounded-lg overflow-hidden">

                  {/* collapse*/}
                  <div
                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-white/5 transition-colors duration-150"
                    onClick={() => toggleExpense(expense.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{expense.description}</p>
                        <p className="text-xs text-white/50 mt-0.5">
                          {formatCurrency(expense.amount, expense.currency)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/50 mb-0.5">Your share</p>
                      <p className="text-sm font-medium">
                        {myShare
                          ? formatCurrency(
                              convert(myShare.share_amount, expense.currency, user?.preferred_currency ?? 'USD'),
                              user?.preferred_currency ?? 'USD'
                            )
                          : '—'
                        }
                      </p>
                    </div>
                  </div>

                  {/*expand*/}
                  {isExpanded && (
                    <div className="border-t border-white/10 px-4 pb-4 pt-3 flex flex-col gap-2">
                      <p className="text-xs text-white/40 uppercase tracking-wide mb-1">All shares</p>

                      {expense.splits?.map((split) => {
                        const member = members.find((m) => m.id === split.user_id)
                        const isMe = split.user_id === user?.id
                        const memberName = member?.name ?? 'Unknown'
                        const memberCurrency = member?.preferred_currency ?? 'USD'
                        const convertedAmount = formatCurrency(
                          convert(split.share_amount, expense.currency, memberCurrency),
                          memberCurrency
                        )
                        const sourceAmount = formatCurrency(split.share_amount, expense.currency)

                        return (
                          <div key={split.user_id} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/70">
                                {memberName.charAt(0).toUpperCase()}
                              </div>
                              <span className={isMe ? 'text-white font-medium' : 'text-white/70'}>
                                {isMe ? 'Your share' : `${memberName}'s share`}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-medium ${isMe ? 'text-white' : 'text-white/70'}`}>
                                {convertedAmount}
                              </p>
                              {memberCurrency !== expense.currency && (
                                <p className="text-xs text-white/30">
                                  {sourceAmount}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {expense.paid_by === user?.id && (
                        <div className="flex justify-end mt-2 pt-2 border-t border-white/10">
                          <button
                            className="text-red-400 text-xs hover:text-red-300 transition-colors duration-200"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteExpense(expense.id)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}