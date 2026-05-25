import { type ReactNode } from "react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"

interface MarketingLayoutProps {
  children: ReactNode
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-linear-to-br from-cyan-100/60 via-background to-indigo-100/50 dark:from-slate-950 dark:via-background dark:to-indigo-950/40" />
        <div className="bg-crosshatch absolute inset-0 opacity-45 dark:opacity-35" />
        <div className="absolute -top-28 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/25 blur-3xl dark:bg-cyan-400/20" />
        <div className="absolute top-20 -left-16 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/15" />
        <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl dark:bg-indigo-500/30" />
        <div className="absolute bottom-6 left-1/4 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-500/10" />
      </div>

      <section className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 lg:px-10">
        <header className="mb-8 flex items-center justify-between">
          <p className="font-heading text-lg font-semibold text-muted-foreground">
            🏔️ ChatPT
          </p>
          <ThemeToggle />
        </header>

        <div className="grid flex-1 items-center gap-12 pb-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-8">
            <div className="space-y-5">
              <h1 className="max-w-xl text-3xl leading-tight font-bold sm:text-5xl lg:text-5xl">
                You only get one body. Make the most of it with systematic training.
              </h1>
              <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
                Most fitness apps are just a checklist. This one tracks <i>qualities </i> —
                trainable dimensions of your body that impact performance
                and well-being. Build the ones you&apos;re working on. Maintain
                the ones you&apos;ve earned. Catch the gaps before they become
                injuries.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge
                variant="secondary"
                className="p-3"
              >
                Connects to ChatGPT or Claude
              </Badge>
              <Badge
                variant="secondary"
                className="p-3"
              >
                Manage PT in one place
              </Badge>
              <Badge
                variant="secondary"
                className="p-3"
              >
                Mobile-friendly for the gym
              </Badge>
            </div>
          </div>

          {children}
        </div>
      </section>
    </main>
  )
}
