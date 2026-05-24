import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
      </div>

      <section className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.2fr_1fr] lg:px-10">
        <div className="space-y-8">
          <div className="space-y-5">
            <h1 className="max-w-xl text-4xl leading-tight font-semibold text-white sm:text-5xl lg:text-5xl">
              You only get one body. Make the most of it with systematic
              training.
            </h1>
            <p className="max-w-lg text-base text-slate-300 sm:text-lg">
              Most fitness apps track exercises. This one tracks qualities - the
              trainable dimensions of your body that impact performance and well-being.
              Build the ones you&apos;re working on. Maintain the ones you&apos;ve earned.
              Catch the gaps before they become injuries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <Badge variant="secondary" className="bg-slate-900/70 text-slate-100">
              Easy exercise tracking
            </Badge>
            <Badge variant="secondary" className="bg-slate-900/70 text-slate-100">
              Manage PT in one place
            </Badge>
            <Badge variant="secondary" className="bg-slate-900/70 text-slate-100">
              Stay on track with AI guidance
            </Badge>
          </div>
        </div>

        <Card className="border border-slate-700/80 bg-slate-900/85 shadow-2xl shadow-black/40 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-semibold text-white">
              Login or sign up
            </CardTitle>
            <CardDescription className="text-slate-300">
              Enter your email to continue.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" action="#" method="post">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-100">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  required
                  className="h-11 border-slate-600 bg-slate-950 text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-300 focus-visible:ring-cyan-300/40"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              >
                Continue with email
              </Button>

              <p className="text-center text-xs text-slate-400">
                By continuing, you agree to the Terms and Privacy Policy.
              </p>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
