
import { processEmbeddings } from "@/lib/inngest/functions";

export async function POST(req: Request) {
    try {
        const { text, mixedbreadKey, pineconeKey, pineconeIndex } = await req.json();

        // Basic validation
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
        return new Response("Internal Server Error", { status: 500 });
    }
}
