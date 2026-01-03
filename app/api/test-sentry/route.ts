import { NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { logServerError } from "@/lib/logger"
import dbConnect from "@/lib/mongodb"

export async function GET(request: Request) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: "Test endpoints disabled in production" },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const testType = searchParams.get("type") || "basic"

  try {
    switch (testType) {
      case "basic":
        throw new Error("Basic test error - Sentry is working!")

      case "logger":
        logServerError("Test logger error", new Error("Error via logger"), {
          component: "test-sentry",
          testType: "logger",
        })
        return NextResponse.json({
          message: "Logger error sent to Sentry",
          testType: "logger",
        })

      case "mongodb":
        try {
          await dbConnect()
          const mongoose = require("mongoose")
          await mongoose.connection.db.collection("nonexistent").findOne({})
          return NextResponse.json({ message: "MongoDB test completed" })
        } catch (dbError) {
          logServerError("Test MongoDB error", dbError, {
            component: "test-sentry",
            testType: "mongodb",
          })
          throw dbError
        }

      case "unhandled":
        setTimeout(() => {
          throw new Error("Unhandled async error")
        }, 100)
        return NextResponse.json({
          message: "Unhandled error triggered (check console in 100ms)",
        })

      case "manual":
        Sentry.captureMessage("Manual test message to Sentry", {
          level: "info",
          tags: {
            testType: "manual",
            endpoint: "test-sentry",
          },
          extra: {
            timestamp: new Date().toISOString(),
          },
        })
        return NextResponse.json({
          message: "Manual message sent to Sentry",
          testType: "manual",
        })

      case "all":
        const results = []

        try {
          throw new Error("Test 1: Basic error")
        } catch (e) {
          Sentry.captureException(e, { tags: { test: "1-basic" } })
          results.push("Basic error captured")
        }
        logServerError("Test 2: Logger error", new Error("Logger test"), {
          component: "test-all",
        })
        results.push("Logger error captured")

        Sentry.captureMessage("Test 3: Manual message", {
          level: "warning",
          tags: { test: "3-manual" },
        })
        results.push("Manual message captured")

        Sentry.captureException(new Error("Test 4: Custom context"), {
          tags: { test: "4-custom", environment: "test" },
          extra: { customData: { foo: "bar", timestamp: Date.now() } },
          level: "error",
        })
        results.push("Custom context captured")

        return NextResponse.json({
          message: "All tests completed",
          results,
          checkSentry: "Check your Sentry dashboard for 4 events",
        })

      default:
        return NextResponse.json({
          message: "Available test types",
          types: {
            basic: "/api/test-sentry?type=basic - Basic error throw",
            logger: "/api/test-sentry?type=logger - Logger integration",
            mongodb: "/api/test-sentry?type=mongodb - MongoDB error",
            unhandled: "/api/test-sentry?type=unhandled - Unhandled async error",
            manual: "/api/test-sentry?type=manual - Manual Sentry capture",
            all: "/api/test-sentry?type=all - Run all tests",
          },
        })
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        test: true,
        endpoint: "test-sentry",
        testType,
      },
      extra: {
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json(
      {
        message: "Test error sent to Sentry",
        error: error instanceof Error ? error.message : "Unknown error",
        testType,
        sentryInitialized: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
      },
      { status: 500 }
    )
  }
}
