import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { researchFlow, processEmbeddings } from "@/lib/inngest/functions";
import { extendedResearchFlow } from "@/lib/inngest/extended-research";
import { agentPlanExecutor } from "@/lib/inngest/agent-runner";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        researchFlow,
        extendedResearchFlow,
        processEmbeddings,
        agentPlanExecutor
    ],
});
