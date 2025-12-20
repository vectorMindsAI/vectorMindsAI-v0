import { tavily } from "@tavily/core";
import { RunnableLambda } from "@langchain/core/runnables";

export const createResearcher = ({ apiKey }: { apiKey: string }) => {
    const client = tavily({ apiKey });

    return new RunnableLambda({
        func: async (input: string) => {
            try {
                const truncatedQuery = input.slice(0, 300);
                const response = await client.search(truncatedQuery, {
                    search_depth: "advanced",
                    max_results: 10,
                });
                return response.results;
            } catch (error) {
                console.error("Tavily search error:", error);
                throw error;
            }
        }
    });
};
