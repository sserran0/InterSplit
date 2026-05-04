import {create} from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
    id: string
    name: string
    preferred_currency: string
}

interface AuthStore {
    token: string | null
    user: User | null
    setAuth: (token: string, user: User) => void
    logout: () => void
}
//stores user and token to keep user logged in after page refresh or close
export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            setAuth: (token, user) => set ({token, user}),
            logout: () => set({ token: null, user: null}),
        }),
        { name: 'intersplit-auth' }
    )
)