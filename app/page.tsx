"use client"

import { useState, useEffect } from "react"
import { ArrowRight, Sparkles, Lock, Zap, Database, Settings, ChevronRight, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setTheme(isDark ? "dark" : "light")
    document.documentElement.classList.toggle("dark", isDark)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base lg:text-lg font-semibold text-foreground">AI Research Agent</span>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Link href="/auth/signin" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="default" size="sm" className="gap-2">
                <span className="hidden sm:inline">Launch Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 lg:px-6 pt-24 lg:pt-32 pb-12 lg:pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 lg:mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 lg:px-4 py-1.5 text-xs lg:text-sm text-muted-foreground">
            <Sparkles className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
            <span>Bring Your Own Key (BYOK) Model</span>
          </div>

          <h1 className="mb-4 lg:mb-6 text-balance text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight text-foreground">
            Intelligent City Research
            <span className="text-primary"> Powered by AI</span>
          </h1>

          <p className="mb-6 lg:mb-10 text-balance text-base lg:text-lg xl:text-xl leading-relaxed text-muted-foreground px-4">
            Multi-step enrichment engine for comprehensive city research. Automatically detect gaps, fill missing data,
            and generate insights with your own API keys.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 lg:gap-4 sm:flex-row px-4">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="gap-2 text-base w-full sm:w-auto">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="gap-2 text-base bg-transparent w-full sm:w-auto">
              View Documentation
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 lg:px-6 py-12 lg:py-20">
        <div className="mb-8 lg:mb-12 text-center">
          <h2 className="mb-3 lg:mb-4 text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground">
            Why Choose AI Research Agent?
          </h2>
          <p className="text-balance text-base lg:text-lg text-muted-foreground px-4">
            Built for researchers who value privacy, control, and flexibility
          </p>
        </div>

        <div className="grid gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-card-foreground">Bring Your Own Keys</h3>
            <p className="leading-relaxed text-muted-foreground">
              Use your own API keys from OpenAI, Anthropic, Google, or any provider. Full control over costs and data
              privacy.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-card-foreground">Multi-Step Enrichment</h3>
            <p className="leading-relaxed text-muted-foreground">
              Automatically detect missing fields and enrich data through intelligent multi-step processing workflows.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-card-foreground">MongoDB Integration</h3>
            <p className="leading-relaxed text-muted-foreground">
              Connect your MongoDB database to fetch documents and automatically detect fields for targeted research.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Settings className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-card-foreground">Custom Criteria</h3>
            <p className="leading-relaxed text-muted-foreground">
              Define custom research criteria and let the AI agent automatically fulfill your specific requirements.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-card-foreground">Real-Time Analytics</h3>
            <p className="leading-relaxed text-muted-foreground">
              Track research progress, monitor API usage, and review comprehensive logs in real-time.
            </p>
          </div>


          {/* Feature 6 - Replaced with HITL Deep Research */}
          <div className="group rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent p-6 transition-all hover:border-purple-500/50 hover:shadow-lg lg:col-span-3 lg:flex lg:items-center lg:gap-6">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shrink-0 lg:mb-0">
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-foreground">HITL Deep Research Agent</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-500 border border-purple-500/20">
                        New
                    </span>
                </div>
                <p className="leading-relaxed text-muted-foreground mb-4">
                  Describe your complex research goal in plain English. Our <strong>Agent Architect</strong> will design a custom execution plan (flowchart) for you. You can review, edit, and approve the steps before the AI executes the pipeline.
                </p>
                <div className="flex gap-2">
                    <Link href="/dashboard?tab=agent">
                        <Button variant="outline" className="border-purple-500/20 hover:bg-purple-500/10 text-purple-500">
                            Try Agent Mode <ArrowRight className="ml-2 h-4 w-4"/>
                        </Button>
                    </Link>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 lg:px-6 py-12 lg:py-20">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-background p-8 lg:p-12 text-center">
          <h2 className="mb-3 lg:mb-4 text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground">
            Ready to Start Researching?
          </h2>
          <p className="mb-6 lg:mb-8 text-balance text-base lg:text-lg text-muted-foreground">
            Launch the dashboard and start enriching your city research data with AI
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="gap-2 text-base">
              Launch Dashboard
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 lg:px-6 py-6 lg:py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">AI Research Agent</span>
            </div>
            <p className="text-sm text-muted-foreground">Built with privacy and control in mind</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
