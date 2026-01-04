import { NextRequest } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { jobStore } from "@/lib/store";
import { auth } from "@/auth";
import { agentLimiter } from "@/lib/rate-limit";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
    const rateLimitResponse = await agentLimiter(req)
    if (rateLimitResponse) return rateLimitResponse

    try {
        const session = await auth();
        const { plan, apiKeys } = await req.json();

        if (!plan || !Array.isArray(plan)) {
            return new Response("Invalid Plan", { status: 400 });
        }

        const jobId = `agent-${Date.now()}`;

        await jobStore.create(jobId, session?.user?.id, plan);
        await jobStore.update(jobId, { status: "queued", progress: 0, logs: [] });

        await inngest.send({
            name: "agent/execute-plan",
            data: {
                parentJobId: jobId,
                plan,
                apiKey: apiKeys.groq,
                apiKeys
            }
        });

        return new Response(JSON.stringify({ success: true, jobId }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        console.error("Agent Execution Error:", error);
        Sentry.captureException(error, {
            tags: { endpoint: "agent-execute", component: "agent" },
            extra: { errorMessage: error?.message }
        });
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
