import { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs"
import { createPlannerAgent } from "../../../lib/agents/planner";
import { standardLimiter } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {

    const rateLimitResponse = await standardLimiter(req)
    if (rateLimitResponse) return rateLimitResponse

    try {
        const { userInput, apiKey, model } = await req.json();

        if (!userInput) {
            return new Response("User Input is required", { status: 400 });
        }

        const planner = createPlannerAgent({ apiKey, model });
        const plan = await planner.generatePlan(userInput);

        return new Response(JSON.stringify({ success: true, plan }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        console.error("Planner Error:", error);
        Sentry.captureException(error, {
            tags: { endpoint: "planner", component: "planner-agent" },
            extra: { errorMessage: error.message }
        });
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
