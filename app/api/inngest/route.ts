import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { researchFlow } from "@/lib/inngest/functions"; // This will be created next

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        researchFlow,
    ],
});
