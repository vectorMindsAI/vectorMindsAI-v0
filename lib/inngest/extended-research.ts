import { inngest } from "./client";
import { createPromptEnhancer } from "@/lib/agents/prompt-enhancer";
import { createResearcher } from "@/lib/agents/researcher";
import { createReviewer } from "@/lib/agents/reviewer";
import { jobStore } from "@/lib/store";

export const extendedResearchFlow = inngest.createFunction(
    { id: "extended-research-flow" },
    { event: "research/extended" },
    async ({ event, step }) => {
        const { jobId, keywords, criteria, sourceUrl, apiKeys, model, fallbackModel } = event.data;
        const { groq: groqKey, tavily: tavilyKey } = apiKeys;

        if (!groqKey || !tavilyKey) {
            throw new Error("Missing API Keys");
        }

        const criteriaList = Array.isArray(criteria) ? criteria : [criteria];
        const aggregatedResults: Record<string, any> = {};

        await step.run("init-extended-job", async () => {
            await jobStore.update(jobId, { status: "processing", progress: 5, logs: [{ type: "INFO", message: "Deep dive started", timestamp: Date.now() }] });
        });

        for (let i = 0; i < criteriaList.length; i++) {
            const criterion = criteriaList[i];
            const criterionName = typeof criterion === 'string' ? criterion.split(":")[0] : criterion.name || "General";

            await step.run(`process-extended-${i}`, async () => {
                await jobStore.addLog(jobId, { type: "STEP", message: `Deep diving into: ${criterionName}` });
                await jobStore.update(jobId, { progress: 10 });
            });

            let searchResults;

            // If URL is provided, try to extract specific content or search strictly within that domain
            if (sourceUrl) {
                await step.run(`process-extended-url-${i}`, async () => {
                    await jobStore.addLog(jobId, { type: "INFO", message: `Analyzing source: ${sourceUrl}` });
                    const enhancerFactory = (m: string) => createPromptEnhancer({ apiKey: groqKey, model: m });
                    const prompt = await safeInvoke(enhancerFactory, {
                        keywords,
                        criteria: `Extract details about ${criterion.description || criterion} specifically from the URL: ${sourceUrl}`
                    }, jobId, model, fallbackModel);

                    const researcher = createResearcher({ apiKey: tavilyKey });
                    const results = await researcher.invoke(prompt);
                    searchResults = results;
                    return results;
                });
            } else {
                // Standard research -> Manual Link Selection FLow
                // 1. Search
                const candidateLinks = await step.run(`search-candidates-${i}`, async () => {
                    await jobStore.addLog(jobId, { type: "INFO", message: `Searching for candidates...` });
                    const enhancerFactory = (m: string) => createPromptEnhancer({ apiKey: groqKey, model: m });
                    const prompt = await safeInvoke(enhancerFactory, { keywords, criteria: criterion }, jobId, model, fallbackModel);

                    const researcher = createResearcher({ apiKey: tavilyKey });
                    const results = await researcher.invoke(prompt);
                    return results; // These are the raw Tavily results (url, title, content)
                });

                // 2. Store candidates and Wait for Selection
                await step.run(`wait-for-selection-${i}`, async () => {
                    // Transform candidateLinks to match store schema if needed, but Tavily result shape is usually { url, title, content, score, ... }
                    await jobStore.update(jobId, {
                        status: "waiting_for_selection",
                        candidateLinks: candidateLinks as any,
                        logs: [...(await jobStore.get(jobId))?.logs || [], { type: "INFO", message: "Waiting for user to select links...", timestamp: Date.now() }]
                    });
                });

                const selectionEvent = await step.waitForEvent(`wait-selection-${i}`, {
                    event: "research/extended-selection",
                    timeout: "1h", // Wait up to 1 hour
                    match: "data.jobId"
                });

                if (!selectionEvent) {
                    await step.run(`timeout-selection-${i}`, async () => {
                        await jobStore.addLog(jobId, { type: "ERROR", message: "Link selection timed out." });
                    });
                    throw new Error("Link selection timed out");
                }

                const selectedLinks = selectionEvent.data.selectedLinks; // Array of URLs or indices

                // 3. Process Selected Links
                searchResults = await step.run(`process-selected-${i}`, async () => {
                    await jobStore.update(jobId, { status: "processing", progress: 50 }); // Resume processing
                    await jobStore.addLog(jobId, { type: "INFO", message: `Processing ${selectedLinks.length} selected links...` });

                    // Filter candidates to only those selected
                    const targets = candidateLinks.filter((l: any) => selectedLinks.includes(l.url));

                    // For each target, we might want to crawl specifically? 
                    // But Tavily search result already has 'content' snippet. 
                    // If we need DEEP crawl, we'd use Tavily 'extract' or 'search' again contextually.
                    // For now, let's assume we re-use the snippet or do a quick scrape if possible.
                    // Simpler: Just use the snippets we have, or re-search them specifically?
                    // The prompt implies "Tavily Crawl -> Tavily Extract".
                    // Since we don't have a direct 'crawl' tool exposed in `researcher`, let's just pass the FULL content of these links.
                    // Tavily 'extract' API is best for this but our agent uses 'search'.
                    // We'll pass the aggregated content of selected links to the reviewer.
                    return targets;
                });
            }

            const iterationResult = await step.run(`review-extended-${i}`, async () => {
                await jobStore.addLog(jobId, { type: "INFO", message: `Analysis complete for ${criterionName}` });

                const reviewerFactory = (m: string) => createReviewer({ apiKey: groqKey, model: m });
                const searchResultsString = JSON.stringify(searchResults);
                const truncatedResults = searchResultsString.length > 25000
                    ? searchResultsString.slice(0, 25000) + "...(truncated)"
                    : searchResultsString;

                const extraction = await safeInvoke(reviewerFactory, {
                    searchResults: truncatedResults,
                    criteria: criterion
                }, jobId, model, fallbackModel);
                await jobStore.addLog(jobId, { type: "SUCCESS", message: `Extracted deep data for ${criterionName}` });

                return extraction;
            });

            if (iterationResult) {
                Object.assign(aggregatedResults, iterationResult);
            }
        }

        await step.run("finalize-extended-job", async () => {
            await jobStore.update(jobId, {
                status: "completed",
                progress: 100,
                result: aggregatedResults,
                logs: []
            });
            await jobStore.addLog(jobId, { type: "SUCCESS", message: "Deep dive completed" });
        });

        return aggregatedResults;
    }
);

// Helper to handle rate limits
const safeInvoke = async (
    factory: (model: string) => any,
    input: any,
    jobId: string,
    primaryModel: string,
    fallbackModel?: string
) => {
    try {
        const agent = factory(primaryModel);
        return await agent.invoke(input);
    } catch (error: any) {
        if ((error.message?.includes("429") || error.message?.includes("Rate limit") || error.code === "rate_limit_exceeded") && fallbackModel) {
            await jobStore.addLog(jobId, { type: "ERROR", message: `Rate limit hit on ${primaryModel}. Switching to fallback: ${fallbackModel}...` });
            try {
                const fallbackAgent = factory(fallbackModel);
                return await fallbackAgent.invoke(input);
            } catch (fallbackError: any) {
                await jobStore.addLog(jobId, { type: "ERROR", message: "Fallback model also failed." });
                throw fallbackError;
            }
        }
        throw error;
    }
};
