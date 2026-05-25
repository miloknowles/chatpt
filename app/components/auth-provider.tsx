"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { type Session, type User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

type AuthActionResult = Promise<{ error?: string }>

export interface AuthContextValue {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  requestOtp(email: string): AuthActionResult
  verifyEmailOtp(email: string, token: string): AuthActionResult
  resendOtp(email: string): AuthActionResult
  signOut(): Promise<void>
}

const RESEND_COOLDOWN_MS = 30_000

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function formatAuthError(error: { message: string } | null) {
  if (!error) {
    return undefined
  }

  return error.message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [resendAllowedAt, setResendAllowedAt] = useState<number>(0)

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      const { data } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      setSession(data.session ?? null)
      setUser(data.session?.user ?? null)
      setIsLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
      setUser(nextSession?.user ?? null)
      setIsLoading(false)
      router.refresh()
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const requestOtp = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) {
        return { error: formatAuthError(error) }
      }

      setResendAllowedAt(Date.now() + RESEND_COOLDOWN_MS)
      return {}
    },
    [supabase]
  )

  const verifyEmailOtp = useCallback(
    async (email: string, token: string) => {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      })

      if (error) {
        return { error: formatAuthError(error) }
      }

      setSession(data.session ?? null)
      setUser(data.user ?? null)
      router.refresh()
      return {}
    },
    [router, supabase]
  )

  const resendOtp = useCallback(
    async (email: string) => {
      const remainingMs = resendAllowedAt - Date.now()

      if (remainingMs > 0) {
        const seconds = Math.ceil(remainingMs / 1000)
        return { error: `Please wait ${seconds}s before resending.` }
      }

      return requestOtp(email)
    },
    [requestOtp, resendAllowedAt]
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }, [router, supabase])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoading,
      isAuthenticated: Boolean(user && session),
      requestOtp,
      verifyEmailOtp,
      resendOtp,
      signOut,
    }),
    [isLoading, requestOtp, resendOtp, session, signOut, user, verifyEmailOtp]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
