import { NextResponse } from "next/server";
import { jobStore } from "@/lib/store";

export const GET = async (req: Request) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Missing job ID" }, { status: 400 });
    }

    const job = await jobStore.get(id);

    if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
};
