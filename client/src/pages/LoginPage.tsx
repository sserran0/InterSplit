import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import api from '../lib/api'

export default function LoginPage() {
    const [isRegister, setIsRegister] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [currency, setCurrency] = useState('USD')
    const [error, setError] = useState('')
    const setAuth = useAuthStore((s) => s.setAuth)
    const navigate = useNavigate()

    const handleSubmit = async () => {
        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login'
            const payload = isRegister
            ? {email, password, name, preferred_currency: currency}
            : {email,password}

            const { data } = await api.post(endpoint, payload)
            setAuth(data.token, {
                id: data.user_id,
                name: name || email,
                preferred_currency: currency
            })
            navigate('/dashboard')
        }catch (err: any) {
            setError(err.response?.data || 'Something went wrong. Please try again later...')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>
                        {isRegister ? 'Create Account': 'Sign In'} - InterSplit
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    {isRegister && (
                        <>
                        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)}/>
                        </>)}
                        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}/>
                        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}/>
                        
                        {isRegister && (
                            <select 
                            className="border rounded px-3 py-2 text-sm"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            >
                            {['USD','EUR','GBP','KRW','JPY','MXN','CNY','AUD','BRL'].map(c => (
                            <option key={c} value={c}>{c}</option>
                            ))}
                            </select>
                        )}
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button onClick={handleSubmit}>
                            {isRegister ? 'Create an Account' : 'Sign in'}
                        </Button>
                        <button
                        className="text-sm text-muted-foreground"
                        onClick={() => setIsRegister(!isRegister)}
                        >
                            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create One"}
                        </button>
                </CardContent>
            </Card>
        </div>
    )
}
