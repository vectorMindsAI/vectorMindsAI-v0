import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

export const POST = async (req: Request) => {
    try {
        const body = await req.json();
        const { jobId, selectedLinks } = body;

        if (!jobId || !selectedLinks) {
            return NextResponse.json({ error: "Missing jobId or selectedLinks" }, { status: 400 });
        }

        // Trigger the selection event to resume the workflow
        await inngest.send({
            name: "research/extended-selection",
            data: {
                jobId,
                selectedLinks
            },
        });

        return NextResponse.json({ success: true, message: "Selection submitted" });
    } catch (error) {
        console.error("Error submitting selection:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
};
