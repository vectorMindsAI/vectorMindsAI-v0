import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import CacheDashboard from "@/components/cache-dashboard"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"

export const metadata = {
  title: "Cache Dashboard - AI Research Agent",
  description: "Monitor and manage application cache performance",
}

function LoadingState() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading cache dashboard...</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function CachePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Restrict to admin users only
  if (session.user.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<LoadingState />}>
        <CacheDashboard />
      </Suspense>
    </div>
  )
}
