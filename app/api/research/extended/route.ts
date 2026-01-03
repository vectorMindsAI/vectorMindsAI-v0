import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { jobStore } from "@/lib/store";
import { trackServerEvent } from "@/lib/analytics";
import { auth } from "@/auth";
import { researchLimiter } from "@/lib/rate-limit";
import { v4 as uuidv4 } from 'uuid';

export const POST = async (req: NextRequest) => {
    const rateLimitResponse = await researchLimiter(req)
    if (rateLimitResponse) return rateLimitResponse

    try {
        const session = await auth();
        const body = await req.json();
        const { city, apiKey, tavilyKey, model, fallbackModel, criteria, sourceUrl } = body;

        const jobId = uuidv4();
        await jobStore.create(jobId, session?.user?.id, {
            type: 'extended_research',
            keywords: [city],
            criteria,
            sourceUrl,
            model: model || "groq/compound",
        });

        await trackServerEvent('extended_research_started', {
            query: city,
            selectedIds: 1,
        }, process.env.NEXT_PUBLIC_POSTHOG_KEY);

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
