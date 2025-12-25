
import { createPlannerAgent } from "@/lib/agents/planner";

export async function POST(req: Request) {
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
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
