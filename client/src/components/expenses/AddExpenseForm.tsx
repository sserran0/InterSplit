import { useState } from 'react'
import { useCurrency } from '../../hooks/useCurrency'
import { formatCurrency, CURRENCIES } from '../../lib/formatCurrency'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCurrencyFlag } from '../../lib/currencyConfig'
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
    <div className="flex flex-col gap-3 p-4 border rounded-lg ">
      <p className="font-medium text-sm text-white">Add an expense</p>

      <Input
        type="text"
        placeholder="Description e.g. Dinner"
        className="placeholder: text-white-500"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="flex gap-2">
        <Input
          placeholder="0.00"
          className="placeholder: text-white-500 text: text-white"
          min="0"
          inputMode='decimal'
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select
        className="cursor-pointer [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {shareAmount > 0 && members.length > 0 && (
        <div className=" border rounded p-3">
          <p className="text-xs font-medium mb-2">
            Each person pays:
          </p>
          {members.map((m) => (
            <div key={m.id} className="flex justify-between items-center text-sm py-1">
              <span>{m.name}</span>
              <span className="flex items-center gap-1.5">
                <span>{getCurrencyFlag(m.preferred_currency)}</span>
                {/* <span>{m.name}</span> */}
                {formatCurrency(
                  convert(shareAmount, currency, m.preferred_currency),
                  m.preferred_currency
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      <Button onClick={handleSubmit} className="cursor-pointer transition-colors duration-200 hover:bg-blue-500">Add Expense</Button>
    </div>
  )
}

