import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";

export const PromptEnhancerSchema = z.object({
    keywords: z.array(z.string()),
    criteria: z.string(),
});

type PromptEnhancerInput = z.infer<typeof PromptEnhancerSchema>;

export const createPromptEnhancer = ({ apiKey, model }: { apiKey: string; model?: string }) => {
    const llm = new ChatGroq({
        apiKey,
        model: model || "groq/compound",
        temperature: 0.7,
    });

    const template = `You are a research expert. Create a single, concise search query based on the following keywords and criteria.
  
  Keywords: {keywords}
  Criteria: {criteria}
  
  Instructions:
  1. Construct a ONE-SENTENCE query.
  2. focus MAINLY on the keywords.
  3. The query MUST be under 300 characters.
  
  Return ONLY the search query string, nothing else.`;

    const prompt = PromptTemplate.fromTemplate(template);

    return RunnableSequence.from([
        prompt,
        llm,
        new StringOutputParser(),
    ]);
};
