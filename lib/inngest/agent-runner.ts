

import { inngest } from "./client";
import { jobStore } from "@/lib/store";
import { researchFlow, processEmbeddings } from "./functions";

export const agentPlanExecutor = inngest.createFunction(
    { id: "agent-plan-executor", cancelOn: [{ event: "research/cancel", match: "data.jobId" }] },
    { event: "agent/execute-plan" },
    async ({ event, step }) => {
        const { plan, apiKeys, parentJobId } = event.data;

        if (!plan || !apiKeys || !parentJobId) {
            throw new Error("Missing required data (plan, apiKeys, parentJobId)");
        }

        const { groq, tavily, mixedbread, pinecone } = apiKeys;

        let previousStepOutput = "";

        await step.run("init-agent-job", async () => {
            await jobStore.update(parentJobId, {
                status: "processing",
                progress: 0,
                logs: [{ type: "INFO", message: "Agent Plan Execution Started", timestamp: Date.now() }]
            });
        });

        for (let i = 0; i < plan.length; i++) {
            const planStep = plan[i];

            await step.run(`log-step-${i}`, async () => {
                await jobStore.addLog(parentJobId, {
                    type: "STEP",
                    message: `Starting Step ${i + 1}: ${planStep.label}`
                });
            });

            if (planStep.type === "research") {
                const subJobId = `${parentJobId}-step-${i}`;

                const result = await step.invoke(`call-research-${i}`, {
                    function: researchFlow,
                    data: {
                        jobId: subJobId,
                        keywords: planStep.params.keywords,
                        criteria: planStep.params.criteria,
                        apiKeys: { groq, tavily },
                        model: "llama-3.3-70b-versatile"
                    }
                });

                previousStepOutput = JSON.stringify(result);

                await step.run(`log-success-${i}`, async () => {
                    await jobStore.addLog(parentJobId, {
                        type: "SUCCESS",
                        message: `Step ${i + 1} Completed.`
                    });
                });

            } else if (planStep.type === "vector_embed") {
                // Resolve dynamic text
                let textToEmbed = planStep.params.text;
                if (!textToEmbed || textToEmbed.toLowerCase().includes("output") || textToEmbed.toLowerCase().includes("previous")) {
                    textToEmbed = previousStepOutput;
                }

                if (!textToEmbed) {
                    textToEmbed = "No output from previous steps.";
                }

                await step.invoke(`call-embeddings-${i}`, {
                    function: processEmbeddings,
                    data: {
                        text: textToEmbed,
                        mixedbreadKey: mixedbread,
                        pineconeKey: pinecone,
                        pineconeIndex: planStep.params.pineconeIndex || "research-data"
                    }
                });

                await step.run(`log-success-${i}`, async () => {
                    await jobStore.addLog(parentJobId, {
                        type: "SUCCESS",
                        message: `Step ${i + 1} Embeddings Created.`
                    });
                });
            }
        }

        await step.run("finalize-agent-job", async () => {
            await jobStore.update(parentJobId, {
                status: "completed",
                progress: 100,
                logs: [],
                result: { finalOutput: previousStepOutput }
            });
            await jobStore.addLog(parentJobId, { type: "SUCCESS", message: "Plan Execution Finished Successfully" });
        });

        return { success: true };
    }
);
