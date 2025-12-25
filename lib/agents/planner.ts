
import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

interface PlannerInput {
    apiKey: string;
    model?: string;
}

export type PlanStep = {
    id: string;
    type: "research" | "vector_embed";
    label: string;
    description: string;
    params: Record<string, any>;
}

export const createPlannerAgent = (input: PlannerInput) => {
    const { apiKey, model = "llama-3.3-70b-versatile" } = input;

    if (!apiKey) throw new Error("Groq API Key is required for the Planner Agent");

    const llm = new ChatGroq({
        apiKey,
        model,
        temperature: 0.2, // Low temp for structured JSON
        maxRetries: 2,
    });

    const generatePlan = async (userObjective: string): Promise<PlanStep[]> => {
        const systemPrompt = `You are an expert Research Architect AI. 
        Your goal is to break down a user's high-level research objective into a sequence of executable pipeline steps.
        
        AVAILABLE PIPELINES (Tools):
        1. RESEARCH (id: 'research')
           - Use for: Finding information, answering questions, city analysis, topic research.
           - Params: 
             - keywords: string (Main research query)
             - criteria: string[] (Specific aspects to analyze, e.g., ["Market Size", "Competitors"])
        
        2. VECTOR_EMBED (id: 'vector_embed')
           - Use for: Storing text data for long-term memory/RAG. ONLY use if user explicitly mentions storing, remembering, or saving to database/memory.
           - Params:
             - text: string (Description of what to embed - usually "output from previous step")
             - pineconeIndex: string (Default: "research-data")

        OUTPUT FORMAT:
        Return ONLY a raw JSON array of objects. Do not include markdown formatting like \`\`\`json.
        Example:
        [
            {
                "id": "step-1",
                "type": "research",
                "label": "Initial Market Scan",
                "description": "Research the general market landscape for AI in Healthcare",
                "params": { "keywords": "AI in Healthcare market size", "criteria": ["Market Size", "Key Players"] }
            },
            {
                "id": "step-2",
                "type": "vector_embed",
                "label": "Save to Memory",
                "description": "Store the research findings into the vector database",
                "params": { "text": "Research output", "pineconeIndex": "research-data" }
            }
        ]
        
        RULES:
        - Keep steps atomic.
        - If the request is complex, break it into multiple RESEARCH steps.
        - Only use VECTOR_EMBED if asked.
        `;

        const response = await llm.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userObjective)
        ]);

        try {
            // Clean response content to ensure valid JSON
            let cleanContent = response.content.toString();
            // Remove markdown code blocks if present
            cleanContent = cleanContent.replace(/```json/g, "").replace(/```/g, "").trim();

            const plan = JSON.parse(cleanContent);
            return plan;
        } catch (e) {
            console.error("Failed to parse Planner Agent output:", response.content);
            throw new Error("Failed to generate a valid plan. Please try again.");
        }
    };

    return { generatePlan };
};
