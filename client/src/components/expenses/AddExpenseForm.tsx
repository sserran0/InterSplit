import { useState } from 'react'
import { useCurrency } from '../../hooks/useCurrency'
import { formatCurrency, CURRENCIES } from '../../lib/formatCurrency'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import api from '../../lib/api'


interface Member {
    id: string
    name: string
    preferred_currency: string
}

interface Props {
    groupId: string
    members: Member[]
    onAdded: () => void
}


export default function AddExpenseForm({groupId, members, onAdded}: Props){
    const [amount, setAmount] = useState('')
    const [currency, setCurrency] = useState('USD')
    const [description, setDescription] = useState('')
    const { convert } = useCurrency()

    const shareAmount = parseFloat(amount) / Math.max(members.length, 1) || 0

    const handleSubmit = async() => {
            if (!amount || !description) return
    await api.post('/expenses', {
      group_id: groupId,
      amount: parseFloat(amount),
      currency,
      description,
      member_ids: members.map((m) => m.id),
    })
    setAmount('')
    setDescription('')
    onAdded()
  }

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/30">
      <p className="font-medium text-sm">Add an expense</p>

      <Input
        placeholder="Description e.g. Dinner"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="flex gap-2">
        <Input
          placeholder="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2 text-sm"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {shareAmount > 0 && members.length > 0 && (
        <div className="bg-background border rounded p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Each person pays:
          </p>
          {members.map((m) => (
            <div key={m.id} className="flex justify-between text-sm py-1">
              <span>{m.name}</span>
              <span className="font-medium">
                {formatCurrency(
                  convert(shareAmount, currency, m.preferred_currency),
                  m.preferred_currency
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      <Button onClick={handleSubmit}>Add expense</Button>
    </div>
  )
}

