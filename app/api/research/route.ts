import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { jobStore } from "@/lib/store";
import { v4 as uuidv4 } from 'uuid';

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { city, apiKey, tavilyKey, model, criteria } = body;

    if (!city || !apiKey || !tavilyKey) {
      return NextResponse.json(
        { error: "Missing required fields: city, apiKey, or tavilyKey" },
        { status: 400 }
      );
    }

    const jobId = uuidv4();
    await jobStore.create(jobId);

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
      },
    });

    return NextResponse.json({ success: true, message: "Research started", jobId });
  } catch (error) {
    console.error("Error starting research:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
