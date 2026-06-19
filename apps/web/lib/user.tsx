"use client"
import type { User } from '@/types/user'
import { createContext, useContext, useState } from 'react'
import { createStore, useStore } from 'zustand'
import { getMe } from './me'

interface UserProps {
  user: User | null
}

interface UserState extends UserProps {
  setUser: (user: User | null) => void
  refresh: () => Promise<void>
}

type UserStore = ReturnType<typeof createUserStore>

const createUserStore = (initProps?: Partial<UserProps>) => {
  const DEFAULT_PROPS: UserProps = {
    user: null,
  }
  return createStore<UserState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    setUser: (user) => set(() => ({ user })),
    refresh: async () => {
      const user = await getMe()
      return set({ user: user || null })
    },
  }))
}

export const UserContext = createContext<UserStore | null>(null)

type UserProviderProps = React.PropsWithChildren<Partial<UserProps>>

export function UserProvider({ children, ...props }: UserProviderProps) {
  const [store] = useState(() => createUserStore(props))

  return <UserContext.Provider value={store}>{children}</UserContext.Provider>
}

export function useUser<T>(selector: (state: UserState) => T): T {
  const store = useContext(UserContext)
  if (!store) throw new Error('Missing UserContext.Provider in the tree')
  return useStore(store, selector)
}
