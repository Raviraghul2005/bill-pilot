import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { HOME_SUBSCRIPTIONS } from '@/constants/data'

type SubscriptionsContextValue = {
  subscriptions: Subscription[];
  addSubscription: (subscription: Subscription) => void;
}

const SubscriptionsContext = createContext<SubscriptionsContextValue | null>(null)

// The single source of truth for subscriptions across the app. Seeded from the
// mock data in constants/data.ts; swap that seed for a fetch once there is a
// backend and every consumer keeps working unchanged.
export const SubscriptionsProvider = ({ children }: { children: ReactNode }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(HOME_SUBSCRIPTIONS)

  const addSubscription = useCallback((subscription: Subscription) => {
    setSubscriptions((prev) => [subscription, ...prev])
  }, [])

  const value = useMemo(
    () => ({ subscriptions, addSubscription }),
    [subscriptions, addSubscription]
  )

  return <SubscriptionsContext.Provider value={value}>{children}</SubscriptionsContext.Provider>
}

// Throws instead of falling back to an empty list: a screen reading
// subscriptions outside the provider is a wiring bug, not an empty state.
export const useSubscriptions = (): SubscriptionsContextValue => {
  const context = useContext(SubscriptionsContext)
  if (!context) {
    throw new Error('useSubscriptions must be used inside a SubscriptionsProvider')
  }
  return context
}
