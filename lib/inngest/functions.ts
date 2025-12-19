import { inngest } from "./client";
import { createPromptEnhancer } from "@/lib/agents/prompt-enhancer";
import { createResearcher } from "@/lib/agents/researcher";
import { createReviewer } from "@/lib/agents/reviewer";

export const researchFlow = inngest.createFunction(
    { id: "research-flow" },
    { event: "research/start" },
    async ({ event, step }) => {
        const { keywords, criteria, apiKeys, model } = event.data;
        const { groq: groqKey, tavily: tavilyKey } = apiKeys;

        if (!groqKey || !tavilyKey) {
            throw new Error("Missing API Keys");
        }

        // Step 1: Enhance Prompt
        const searchPrompt = await step.run("enhance-prompt", async () => {
            const enhancer = createPromptEnhancer({ apiKey: groqKey, model });
            const prompt = await enhancer.invoke({ keywords, criteria });
            return prompt;
        });

        // Step 2: Perform Research
        const searchResults = await step.run("perform-research", async () => {
            const researcher = createResearcher({ apiKey: tavilyKey });
            const results = await researcher.invoke(searchPrompt);
            return results;
        });

        // Step 3: Review and Fill
        const finalResult = await step.run("review-and-fill", async () => {
            const reviewer = createReviewer({ apiKey: groqKey, model });
            const result = await reviewer.invoke({
                searchResults: JSON.stringify(searchResults),
                criteria
            });
            return result;
        });

        return finalResult;
    }
);
