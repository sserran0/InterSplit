export const CURRENCY_CONFIG: Record<string, {flag: string; label: string}> = {
    USD: { flag: '🇺🇸', label: 'US Dollar' },
    EUR: { flag: '🇪🇺', label: 'Euro' },
    GBP: { flag: '🇬🇧', label: 'British Pound' },
    KRW: { flag: '🇰🇷', label: 'Korean Won' },
    JPY: { flag: '🇯🇵', label: 'Japanese Yen' },
    MXN: { flag: '🇲🇽', label: 'Mexican Peso' },
    CNY: { flag: '🇨🇳', label: 'Chinese Yuan' },
    AUD: { flag: '🇦🇺', label: 'Australian Dollar' },
    CAD: { flag: '🇨🇦', label: 'Canadian Dollar' },
    BRL: { flag: '🇧🇷', label: 'Brazilian Real' },
    INR: { flag: '🇮🇳', label: 'Indian Rupee' },
    THB: { flag: '🇹🇭', label: 'Thai Baht' },
    VND: { flag: '🇻🇳', label: 'Vietnamese Dong' },
    SGD: { flag: '🇸🇬', label: 'Singapore Dollar' },
}

export function getCurrencyFlag(currency: string): string {
    return CURRENCY_CONFIG[currency]?.flag ?? '🏳️'
}

export function getCurrencyLabel(currency: string): string {
    return CURRENCY_CONFIG[currency]?.label ?? currency
}