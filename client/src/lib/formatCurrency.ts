//Currency Formatter through Intl.NumberFormat() for all browsers
export function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: ['JPY', 'KRW', 'VND'].includes(currency) ? 0 : 2,
        maximumFractionDigits: ['JPY', 'KRW', 'VND'].includes(currency) ? 0 : 2,
    }).format(amount)
}

export const CURRENCIES = [
    'USD', 'EUR', 'GBP', 'KRW', 'JPY', 'MXN', 'CNY',
    'AUD', 'CAD', 'BRL', 'INR', 'THB', 'VND', 'SGD'
]
