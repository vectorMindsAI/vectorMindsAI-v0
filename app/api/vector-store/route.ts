import { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs"
import { processEmbeddings } from "@/lib/inngest/functions";
import { standardLimiter } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {

    const rateLimitResponse = await standardLimiter(req)
    if (rateLimitResponse) return rateLimitResponse

    try {
        const { text, mixedbreadKey, pineconeKey, pineconeIndex } = await req.json();

        if (!text || !mixedbreadKey || !pineconeKey || !pineconeIndex) {
            return new Response("Missing required fields", { status: 400 });
        }

        // Send event to Inngest
        const { inngest } = await import("@/lib/inngest/client");
        await inngest.send({
            name: "vector/start-embedding",
            data: {
                text,
                mixedbreadKey,
                pineconeKey,
                pineconeIndex
            }
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error triggering embedding job:", error);
        Sentry.captureException(error, {
            tags: { endpoint: "vector-store", action: "embedding" }
        });
        return new Response("Internal Server Error", { status: 500 });
    }
}
