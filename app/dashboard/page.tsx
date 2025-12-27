"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Settings,
  FileText,
  Database,
  BarChart3,
  BookOpen,
  Moon,
  Sun,
  Sparkles,
  LogOut,
  Menu,
  X,
  User,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ResearchPanel } from "@/components/research-panel"
import { CriteriaBuilder } from "@/components/criteria-builder"
import { ModelSettings } from "@/components/model-settings"
import { AnalyticsLogs } from "@/components/analytics-logs"
import { Documentation } from "@/components/documentation"
import { VectorStorePanel } from "@/components/vector-store-panel"
import { DeepResearchPanel } from "@/components/deep-research-panel"
import { SearchHistoryPanel } from "@/components/search-history"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "@/lib/toast"
import { useSession, signOut } from "next-auth/react"

export default function Dashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [tavilyKey, setTavilyKey] = useState("")
  const [selectedModel, setSelectedModel] = useState("groq/compound")
  const [selectedFallbackModel, setSelectedFallbackModel] = useState("llama-3.3-70b-versatile")
  const [criteria, setCriteria] = useState<any[]>([
    { id: "1", name: "Average Temperature", description: "Annual average temperature in Celsius", outputSchema: [] },
  ])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    toast.success("Logged out successfully")
    router.push("/")
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary mx-auto mb-4">
            <Sparkles className="h-5 w-5 text-primary-foreground animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-background ${theme === "dark" ? "dark" : ""}`}>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 border-r border-border bg-card transition-transform lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col gap-4 p-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <Link href="/" className="block" onClick={() => setMobileMenuOpen(false)}>
              <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">AI Research</h2>

                </div>
              </div>
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <Separator />

          {session?.user && (
            <>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-foreground truncate">{session.user.name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                </div>
              </div>
              <Separator />
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="api-key-primary" className="text-xs font-medium text-foreground">
              Primary Model API Key
            </Label>
            <Input
              id="api-key-primary"
              type="password"
              placeholder="Enter Groq API key"
              className="h-9 bg-background text-sm"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-primary" className="text-xs font-medium text-foreground">
              Primary Model
            </Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger id="model-primary" className="h-9 bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemma-7b-it">Gemma 7B IT</SelectItem>
                <SelectItem value="groq/compound">Groq Compound (Default)</SelectItem>
                <SelectItem value="groq/compound-mini">Groq Compound Mini</SelectItem>
                <SelectItem value="llama-3.1-8b-instant">Llama 3.1 8B Instant</SelectItem>
                <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</SelectItem>
                <SelectItem value="llama3-70b-8192">Llama 3 70B</SelectItem>
                <SelectItem value="llama3-8b-8192">Llama 3 8B</SelectItem>
                <SelectItem value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout 17B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="my-1" />

          <Separator className="my-1" />

          <div className="space-y-2">
            <Label htmlFor="model-fallback" className="text-xs font-medium text-foreground">
              Fallback Model
            </Label>
            <Select value={selectedFallbackModel} onValueChange={setSelectedFallbackModel}>
              <SelectTrigger id="model-fallback" className="h-9 bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemma-7b-it">Gemma 7B IT</SelectItem>
                <SelectItem value="groq/compound">Groq Compound</SelectItem>
                <SelectItem value="groq/compound-mini">Groq Compound Mini</SelectItem>
                <SelectItem value="llama-3.1-8b-instant">Llama 3.1 8B Instant</SelectItem>
                <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</SelectItem>
                <SelectItem value="llama3-70b-8192">Llama 3 70B</SelectItem>
                <SelectItem value="llama3-8b-8192">Llama 3 8B</SelectItem>
                <SelectItem value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout 17B</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">Used if primary model hits rate limits.</p>
          </div>

          <Separator className="my-1" />

          <div className="space-y-2">
            <Label htmlFor="tavily-key" className="text-xs font-medium text-foreground">
              Tavily API Key (Search)
            </Label>
            <Input
              id="tavily-key"
              type="password"
              placeholder="Enter Tavily API key"
              className="h-9 bg-background text-sm"
              value={tavilyKey}
              onChange={(e) => setTavilyKey(e.target.value)}
            />
          </div>

          {/* Theme Toggle */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">Theme</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="w-full justify-start gap-2 bg-background text-sm"
            >
              {theme === "light" ? (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4" />
                  <span>Light Mode</span>
                </>
              )}
            </Button>
          </div>

          <Separator />

          {session?.user && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2 bg-background text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          )}

          {/* About Section */}
          <div className="flex-1">
            <h3 className="mb-2 text-xs font-medium text-foreground">About</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Multi-step enrichment engine for comprehensive city research. Automatically detects gaps and fills missing
              data.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="flex h-16 items-center justify-between px-4 lg:px-8">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1 lg:flex-initial">
              <h1 className="text-base lg:text-lg font-semibold text-foreground">AI City Research Agent</h1>
              <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">Multi-Step Enrichment Engine</p>
            </div>

            {!session?.user && (
              <div className="flex items-center gap-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 lg:p-8">
          <Tabs defaultValue="research" className="w-full">
            <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
              <TabsList className="grid w-full grid-cols-7 bg-muted/50 min-w-max lg:min-w-0">
                <TabsTrigger value="research" className="gap-2 text-xs lg:text-sm">
                  <Search className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                  <span className="hidden sm:inline">Research</span>
                </TabsTrigger>
                <TabsTrigger value="criteria" className="gap-2 text-xs lg:text-sm">
                  <FileText className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                  <span className="hidden sm:inline">Criteria</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2 text-xs lg:text-sm">
                  <History className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>
                <TabsTrigger value="mongodb" className="gap-2 text-xs lg:text-sm">
                  <Database className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                  <span className="hidden sm:inline">Vector Store</span>
                </TabsTrigger>
                <TabsTrigger value="agent" className="gap-2 text-xs lg:text-sm">
                   <Sparkles className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-purple-500" />
                   <span className="hidden sm:inline font-semibold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Agent</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2 text-xs lg:text-sm">
                  <Settings className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
                {/* <TabsTrigger value="analytics" className="gap-2 text-xs lg:text-sm">
                  <BarChart3 className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger> */}
                <TabsTrigger value="docs" className="gap-2 text-xs lg:text-sm">
                  <BookOpen className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                  <span className="hidden sm:inline">Docs</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="mt-4 lg:mt-6">
              <TabsContent value="research" className="mt-0">
                <ResearchPanel apiKey={apiKey} tavilyKey={tavilyKey} model={selectedModel} fallbackModel={selectedFallbackModel} criteria={criteria} />
              </TabsContent>

              <TabsContent value="criteria" className="mt-0">
                <CriteriaBuilder criteria={criteria} setCriteria={setCriteria} />
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <SearchHistoryPanel />
              </TabsContent>

              <TabsContent value="mongodb" className="mt-0">
                <VectorStorePanel />
              </TabsContent>

              <TabsContent value="agent" className="mt-0">
                <DeepResearchPanel apiKey={apiKey} />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <ModelSettings />
              </TabsContent>

              {/* <TabsContent value="analytics" className="mt-0">
                <AnalyticsLogs />
              </TabsContent> */}

              <TabsContent value="docs" className="mt-0">
                <Documentation />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
