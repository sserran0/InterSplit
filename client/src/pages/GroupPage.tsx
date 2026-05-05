import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useCurrency } from '../hooks/useCurrency'
import { formatCurrency } from '../lib/formatCurrency'
import { Badge } from '@/components/ui/badge'
import AddExpenseForm from '../components/expenses/AddExpenseForm'
import api from '../lib/api'

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
  const [members, setMembers] = useState<any[]>([])
  const user = useAuthStore((s) => s.user)
  const { convert } = useCurrency()

  const fetchExpenses = () => {
    api.get(`/groups/${id}/expenses`).then(({ data }) => setExpenses(data ?? []))
    api.get(`/groups/${id}/members`).then(({ data }) => setMembers(data ?? []))
  }

  useEffect(() => {
    fetchExpenses()
  }, [id])

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
    <div className="max-w-lg mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-medium">Group expenses</h1>
          <Badge variant={myBalance >= 0 ? 'default' : 'destructive'}>
            {myBalance >= 0 ? '+' : ''}{formatCurrency(myBalance, user?.preferred_currency ?? 'USD')}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {myBalance >= 0 ? 'You are owed' : 'You owe'} in total
        </p>
      </div>

      <AddExpenseForm
        groupId={id!}
        members={members}
        onAdded={fetchExpenses}
      />

      <div className="flex flex-col gap-3 mt-6">
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}