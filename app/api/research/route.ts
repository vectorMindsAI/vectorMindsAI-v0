import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { jobStore } from "@/lib/store";
import { trackServerEvent } from "@/lib/analytics";
import { v4 as uuidv4 } from 'uuid';

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { city, apiKey, tavilyKey, model, fallbackModel, criteria } = body;

    if (!city || !apiKey || !tavilyKey) {
      return NextResponse.json(
        { error: "Missing required fields: city, apiKey, or tavilyKey" },
        { status: 400 }
      );
    }

    const jobId = uuidv4();
    await jobStore.create(jobId);

    // Track analytics event
    await trackServerEvent('research_initiated', {
      query: city,
      model: model || "groq/compound",
      criteriaCount: criteria ? (Array.isArray(criteria) ? criteria.length : 1) : 0,
    }, process.env.NEXT_PUBLIC_POSTHOG_KEY);

    // Trigger the Inngest workflow
    await inngest.send({
      name: "research/start",
      data: {
        jobId,
        keywords: [city],
        criteria: criteria || "General city overview including population, weather, and key facts.",
        apiKeys: {
          groq: apiKey,
          tavily: tavilyKey,
        },
        model: model || "groq/compound",
        fallbackModel: fallbackModel || "llama-3.3-70b-versatile",
      },
    });

    return NextResponse.json({ success: true, message: "Research started", jobId });
  } catch (error) {
    console.error("Error starting research:", error);
    
    // Track error event
    await trackServerEvent('api_error', {
      endpoint: '/api/research',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    }, process.env.NEXT_PUBLIC_POSTHOG_KEY);
    
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
