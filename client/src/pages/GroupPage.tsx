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
  const user = useAuthStore((s) => s.user)
  const { convert } = useCurrency()
  const navigate = useNavigate()

  const fetchAll = () => {
    api.get(`/groups/${id}/expenses`).then(({ data }) => setExpenses(data ?? []))
    api.get(`/groups/${id}/members`).then(({ data }) => setMembers(data ?? []))
    api.get('/groups').then(({data}) => { const group = data?.find((g: any) => g.id === id)
        if (group) setGroupName(group.name)
    })
  }

  useEffect(() => {
    fetchAll()
  }, [id])

  const addMember = async() => {
    if (!newMemberName.trim()) return
    try{
        await api.post(`/groups/${id}/members`, {
        name: newMemberName,
        preferred_currency: newMemberCurrency
        })
        setNewMemberName('')
        setNewMemberCurrency('USD')
        setShowAddMember(false)
        fetchAll()
    }
    catch (err : any){
        setAddMemberError(err.response?.data || 'Could not add member :(')
    }
  }

  const removeMember = async (memberID: string) => {
    console.log('Removing member:', memberID)
    try{
        await api.delete(`/groups/${id}/members/${memberID}`)
        fetchAll()
    } catch (err : any){
        alert(err.response?.data || 'Could not resolve member')
    }
  }
    const deleteExpense = async (expenseID: string) => {
    try {
        await api.delete(`/expenses/${expenseID}`)
        fetchAll()
    }
    catch (err: any){
        alert(err.response?.data || 'Could Not Delete Expense')
    }
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
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"
        onClick={() => navigate('/dashboard')}
        >
            Back To Groups
        </button>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold intersplit-header">{groupName} Expenses</h1>
        </div>
      </div>

        {/*column*/}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
            <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
            <p className="font-medium text-sm">Members ({members.length})</p>
            <button
            className="text-sm text-blue-500 hover:underline flex items-center gap-1"
            onClick={() => setShowAddMember(!showAddMember)}
            >
            {showAddMember ? '✕ Cancel' : '+ Add Member'}
            </button>
        </div>

        {showAddMember && (
            <div className="mb-4 p-3 bg-muted/30 rounded-lg flex flex-col gap-2">
            <Input
                placeholder="Name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
            />
            <select
                className="border rounded px-3 py-2 text-sm"
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
            <Button onClick={addMember}>Add to group</Button>
            </div>
        )}
         <div className="flex flex-col gap-3">
            {members.map((m) => {
            const myShare = expenses.reduce((acc, expense) => {
                const split = expense.splits?.find(s => s.user_id === m.id)
                if (!split) return acc
                return acc + convert(split.share_amount, expense.currency, user?.preferred_currency ?? 'USD')
            }, 0)

            const theirShare = expenses.reduce((acc, expense) => {
                const split = expense.splits?.find(s => s.user_id === m.id)
                if (!split) return acc
                return acc + convert(split.share_amount, expense.currency, m.preferred_currency)
            }, 0)

            const isCurrentUser = m.id === user?.id

            return (
                <div key={m.id} className="flex justify-between items-center py-1">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                    <p className="text-sm font-medium">
                        {m.name} {isCurrentUser && <span className="text-muted-foreground font-normal">(you)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {getCurrencyFlag(m.preferred_currency)} {m.preferred_currency}
                    </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="text-right">
                    <p className={`text-sm font-medium ${myShare < 0 ? 'text-red-500' : myShare > 0 ? 'text-green-600' : ''}`}>
                        {myShare === 0 ? '—' : `${myShare > 0 ? '+' : ''}${formatCurrency(myShare, user?.preferred_currency ?? 'USD')}`}
                    </p>
                    {m.preferred_currency !== user?.preferred_currency && (
                        <p className="text-xs text-muted-foreground">
                        {formatCurrency(theirShare, m.preferred_currency)}
                        </p>
                    )}
                    </div>
                    {!isCurrentUser && (
                    <button
                        className="text-red-400 text-xs hover:underline ml-2"
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
    <div className="flex flex-col gap-4">
    <AddExpenseForm
    groupId={id!}
    members={members}
    onAdded={fetchAll}
    />
      <div className="flex flex-col gap-3 mt-6">
        {expenses.length === 0 && (
            <p className = "text-sm text-muted-foreground">All Square For Now...</p>
        )}
        {expenses.map((expense) => (
          <div key={expense.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{expense.description}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(expense.amount, expense.currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Your share</p>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const myShare = expense.splits?.find(s => s.user_id === user?.id)
                    if (!myShare) return '—'
                    return formatCurrency(
                      convert(myShare.share_amount, expense.currency, user?.preferred_currency ?? 'USD'),
                      user?.preferred_currency ?? 'USD'
                    )
                  })()}
                </p>
                {expense.paid_by === user?.id && (
                    <button className="text-red-400 text-xs hover:underline mt-1" onClick={() => deleteExpense(expense.id)}>
                        Delete
                    </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
    </div>
  )
}