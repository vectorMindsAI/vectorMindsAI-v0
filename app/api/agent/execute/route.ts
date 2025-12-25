
import { inngest } from "@/lib/inngest/client";
import { jobStore } from "@/lib/store";

export async function POST(req: Request) {
    try {
        const { plan, apiKeys } = await req.json();

        if (!plan || !Array.isArray(plan)) {
            return new Response("Invalid Plan", { status: 400 });
        }

        const jobId = `agent-${Date.now()}`;

        // Initialize Job in Store
        await jobStore.create(jobId);
        await jobStore.update(jobId, { status: "queued", progress: 0, logs: [] });

        // Trigger Inngest Function
        await inngest.send({
            name: "agent/execute-plan",
            data: {
                parentJobId: jobId,
                plan,
                apiKey: apiKeys.groq, // Pass main key separately? 
                // We need all keys in the event data to pass to sub-functions
                apiKeys
            }
        });

        return new Response(JSON.stringify({ success: true, jobId }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        console.error("Agent Execution Error:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
