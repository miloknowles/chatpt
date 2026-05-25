"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { useAuth } from "@/components/auth-provider"
import { MarketingLayout } from "@/components/marketing-layout"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const OTP_LENGTH = 8
const RESEND_COOLDOWN_SECONDS = 30

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

type Step = "email" | "otp"

export function AuthPanel() {
  const { requestOtp, verifyEmailOtp, resendOtp } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [resendCountdownSeconds, setResendCountdownSeconds] = useState(0)

  const redirectTo = searchParams.get("next") ?? "/training"
  const remainingResendSeconds = resendCountdownSeconds
  const canResend = resendCountdownSeconds <= 0

  useEffect(() => {
    if (canResend) {
      return
    }

    const timer = window.setInterval(() => {
      setResendCountdownSeconds((seconds) => Math.max(0, seconds - 1))
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [canResend])

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()

    if (!isValidEmail(normalizedEmail)) {
      setError("Enter a valid email address.")
      setInfo(null)
      return
    }

    setIsSendingOtp(true)
    setError(null)
    setInfo(null)

    const result = await requestOtp(normalizedEmail)

    setIsSendingOtp(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setEmail(normalizedEmail)
    setStep("otp")
    setToken("")
    setResendCountdownSeconds(RESEND_COOLDOWN_SECONDS)
    setInfo(`Code sent to ${normalizedEmail}.`)
  }

  async function handleOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const isValidToken = token.length === OTP_LENGTH && /^\d+$/.test(token)

    if (!isValidToken) {
      setError(`Enter the ${OTP_LENGTH}-digit code.`)
      setInfo(null)
      return
    }

    setIsVerifyingOtp(true)
    setError(null)
    setInfo(null)

    const result = await verifyEmailOtp(email, token)

    setIsVerifyingOtp(false)

    if (result.error) {
      setError(result.error)
      return
    }

    router.push(redirectTo)
  }

  async function handleResend() {
    if (!canResend) {
      return
    }

    setError(null)
    setInfo(null)

    const result = await resendOtp(email)

    if (result.error) {
      setError(result.error)
      return
    }

    setResendCountdownSeconds(RESEND_COOLDOWN_SECONDS)
    setInfo(`A new code was sent to ${email}.`)
  }

  function handleTokenChange(value: string) {
    const numericOnly = value.replace(/\D/g, "").slice(0, OTP_LENGTH)
    setToken(numericOnly)
  }

  return (
    <MarketingLayout>
      <Card className="border border-border/70 bg-card/90 shadow-2xl shadow-foreground/10 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold">
            {step === "email" ? "Login or sign up" : "Enter your code"}
          </CardTitle>
          <CardDescription>
            {step === "email"
              ? "Enter your email to receive a magic code."
              : `We sent an ${OTP_LENGTH}-digit passcode to ${email}.`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === "email" ? (
            <form className="space-y-4" onSubmit={handleEmailSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 bg-background/70"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSendingOtp}
                className="w-full"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  "Send code"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By continuing, you agree to the Terms and Privacy Policy.
              </p>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleOtpSubmit}>
              <div className="space-y-2">
                <Label htmlFor="otp">{OTP_LENGTH}-digit code</Label>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  placeholder="12345678"
                  maxLength={OTP_LENGTH}
                  required
                  value={token}
                  onChange={(event) => handleTokenChange(event.target.value)}
                  className="h-11 bg-background/70 text-center text-lg tracking-[0.4em]"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isVerifyingOtp}
                className="w-full"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify code"
                )}
              </Button>

              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <button
                  type="button"
                  className="underline underline-offset-4 hover:text-foreground disabled:no-underline disabled:opacity-60"
                  onClick={handleResend}
                  disabled={!canResend}
                >
                  {canResend
                    ? "Resend code"
                    : `Resend available in ${remainingResendSeconds}s`}
                </button>

                <button
                  type="button"
                  className="underline underline-offset-4 hover:text-foreground"
                  onClick={() => {
                    setStep("email")
                    setToken("")
                    setError(null)
                    setInfo(null)
                  }}
                >
                  Change email
                </button>
              </div>
            </form>
          )}

          {info ? <p className="mt-4 text-sm text-primary">{info}</p> : null}
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        </CardContent>
      </Card>
    </MarketingLayout>
  )
}
