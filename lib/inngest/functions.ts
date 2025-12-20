
import { inngest } from "./client";
import { createPromptEnhancer } from "@/lib/agents/prompt-enhancer";
import { createResearcher } from "@/lib/agents/researcher";
import { createReviewer } from "@/lib/agents/reviewer";
import { jobStore } from "@/lib/store";

export const researchFlow = inngest.createFunction(
    { id: "research-flow" },
    { event: "research/start" },
    async ({ event, step }) => {
        const { jobId, keywords, criteria, apiKeys, model } = event.data;
        const { groq: groqKey, tavily: tavilyKey } = apiKeys;

        if (!groqKey || !tavilyKey) {
            throw new Error("Missing API Keys");
        }

        // Ensure criteria is an array
        const criteriaList = Array.isArray(criteria) ? criteria : [criteria];
        const aggregatedResults: Record<string, any> = {};

        await step.run("init-job", async () => {
            await jobStore.update(jobId, { status: "processing", progress: 5, logs: [{ type: "INFO", message: "Job started", timestamp: Date.now() }] });
        });

        for (let i = 0; i < criteriaList.length; i++) {
            const criterion = criteriaList[i];

            // Determine progress based on iteration
            const progressBase = 5 + Math.floor((i / criteriaList.length) * 90);

            // Rate limiting
            if (i > 0) {
                await step.sleep(`rate - limit - ${i} `, "1s");
            }

            const iterationResult = await step.run(`process - criterion - ${i} `, async () => {
                const criterionName = typeof criterion === 'string' ? criterion.split(":")[0] : "General";

                // Log start of criterion
                await jobStore.addLog(jobId, { type: "STEP", message: `Analyzing: ${criterionName} ` });
                await jobStore.update(jobId, { progress: progressBase + 5 });

                // Step 1: Enhance Prompt
                const enhancer = createPromptEnhancer({ apiKey: groqKey, model });
                const prompt = await enhancer.invoke({ keywords, criteria: criterion });
                await jobStore.addLog(jobId, { type: "INFO", message: `Generated query for ${criterionName}` });

                // Step 2: Research
                const researcher = createResearcher({ apiKey: tavilyKey });
                const searchResults = await researcher.invoke(prompt);
                await jobStore.addLog(jobId, { type: "INFO", message: `Search complete for ${criterionName}` });

                // Step 3: Review
                const reviewer = createReviewer({ apiKey: groqKey, model });
                const searchResultsString = JSON.stringify(searchResults);
                const truncatedResults = searchResultsString.length > 25000
                    ? searchResultsString.slice(0, 25000) + "...(truncated)"
                    : searchResultsString;

                const extraction = await reviewer.invoke({
                    searchResults: truncatedResults,
                    criteria: criterion
                });
                await jobStore.addLog(jobId, { type: "SUCCESS", message: `Extracted data for ${criterionName}` });
                await jobStore.update(jobId, { progress: progressBase + (90 / criteriaList.length) });

                return extraction;
            });

            // Merge results
            Object.assign(aggregatedResults, iterationResult);
        }

        // Finalize
        await step.run("finalize-job", async () => {
            await jobStore.update(jobId, {
                status: "completed",
                progress: 100,
                result: aggregatedResults,
                logs: [] // Optional: clear logs or keep them. Keeping them is better for debugging, appending final success.
            });
            await jobStore.addLog(jobId, { type: "SUCCESS", message: "Research successfully completed" });
        });

        return aggregatedResults;
    }
);

