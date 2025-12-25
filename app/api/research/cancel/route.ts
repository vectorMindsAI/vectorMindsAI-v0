
import { inngest } from "@/lib/inngest/client";
import { jobStore } from "@/lib/store";

export async function POST(req: Request) {
    try {
        const { jobId } = await req.json();

        if (!jobId) {
            return new Response("Missing Job ID", { status: 400 });
        }

        // 1. Send cancellation event to Inngest
        await inngest.send({
            name: "research/cancel",
            data: {
                jobId
            }
        });

        // 2. Mark job as cancelled in store immediately
        await jobStore.update(jobId, {
            status: "failed", // or "cancelled" if we supported it specifically, but failed stops the UI 
            logs: [...(await jobStore.get(jobId) || { logs: [] }).logs, { type: "INFO", message: "Job cancelled by user", timestamp: Date.now() }]
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error cancelling job:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
