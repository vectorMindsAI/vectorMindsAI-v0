import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { jobStore } from "@/lib/store";
import { trackServerEvent } from "@/lib/analytics";
import { v4 as uuidv4 } from 'uuid';

export const POST = async (req: Request) => {
    try {
        const body = await req.json();
        const { city, apiKey, tavilyKey, model, fallbackModel, criteria, sourceUrl } = body;

        // Use existing jobId if provided (to append logs? no, treating as new job for simplicity shown in UI)
        // Actually the UI sets new jobId, so we should create a new one.
        // If we want to persist logs from previous run, we'd need to merge.
        // For now, let's create a new job but maybe we can link them later.
        const jobId = uuidv4();
        await jobStore.create(jobId);

        // Track analytics event
        await trackServerEvent('extended_research_started', {
          query: city,
          selectedIds: 1,
        }, process.env.NEXT_PUBLIC_POSTHOG_KEY);

        // Trigger the Inngest workflow
        await inngest.send({
            name: "research/extended",
            data: {
                jobId,
                keywords: [city],
                criteria, // Array of 1
                sourceUrl, // Passed to event
                apiKeys: {
                    groq: apiKey,
                    tavily: tavilyKey,
                },
                model: model || "groq/compound",
                fallbackModel: fallbackModel || "llama-3.3-70b-versatile",
            },
        });

        return NextResponse.json({ success: true, message: "Extended research started", jobId });
    } catch (error) {
        console.error("Error starting extended research:", error);
        
        // Track error event
        await trackServerEvent('api_error', {
          endpoint: '/api/research/extended',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          statusCode: 500,
        }, process.env.NEXT_PUBLIC_POSTHOG_KEY);
        
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
};
