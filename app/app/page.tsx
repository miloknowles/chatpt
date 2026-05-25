import Link from "next/link"

import { MarketingLayout } from "@/components/marketing-layout"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function HomePage() {
  return (
    <MarketingLayout>
      <Card className="border border-border/70 bg-card/90 shadow-2xl shadow-foreground/10 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Try it out for yourself
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Get onboarded in less than 5 minutes
          </p>
          <Link
            href="/auth"
            className={cn(
              buttonVariants({ size: "lg" }),
              "flex w-full",
            )}
          >
            Login or sign up
          </Link>
        </CardContent>
      </Card>
    </MarketingLayout>
  )
}
