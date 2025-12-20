import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

export const createReviewer = ({ apiKey, model }: { apiKey: string; model?: string }) => {
    const llm = new ChatGroq({
        apiKey,
        model: model || "groq/compound",
        temperature: 0,
    });

    const template = `You are a strict data reviewer.
  Your task is to extract relevant information from the search results based on the initial criteria and format it as a valid JSON object.
  
  Search Results: {searchResults}
  Criteria: {criteria}
  
  Ensure the JSON matches the requirements implied by the criteria. 
  If data is missing, mark the field as "MISSING".
  
  Return ONLY the JSON object.`;

    const prompt = PromptTemplate.fromTemplate(template);

    return RunnableSequence.from([
        prompt,
        llm,
        new JsonOutputParser(),
    ]);
};
