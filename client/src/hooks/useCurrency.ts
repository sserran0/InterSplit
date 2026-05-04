import { useEffect } from "react"
import { create } from 'zustand'
import api from '../lib/api'

interface RatesStore {
    rates: Record<string, number>
    getRates: () => Promise<void>
    convert: (amount: number, from: string, to: string) => number
}


export const useRatesStore = create<RatesStore>((set, get) => ({
    rates: {},
    getRates: async () => {
        const { data } = await api.get<Record<string, number>>('/rates')
        set({ rates: data })
    },
    convert: (amount, from, to) => {
        const { rates } = get()
        //return if no conversion needed
        if (from === to) return amount
        //Rates stored relative to USD
        const toUSD = from === 'USD' ? amount : amount / rates[from]
        return to === 'USD' ? toUSD : toUSD * rates[to]
    },
}))

export function useCurrency() {
    const { rates, getRates, convert } = useRatesStore()
    useEffect(() => {
        if (!Object.keys(rates).length) getRates()
    }, [])
    return {convert, rates}
}