import { NextResponse } from "next/server";
import { demoMemories } from "@/lib/demo/incidents";
import { hindsightConfigured } from "@/lib/hindsight/client";
import { seedDemoMemories } from "@/lib/hindsight/memory";

export const runtime = "nodejs";

export async function POST() {
  if (!hindsightConfigured()) {
    return NextResponse.json(
      {
        error:
          "Connect Hindsight to seed persistent demo memories. The built-in demo records are labeled Demo Memory.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await seedDemoMemories(demoMemories);

    return NextResponse.json({
      ...result,
      mode: "hindsight",
    });
  } catch (error) {
    console.error("HINDSIGHT SEED FAILED:", error);

    const details =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        error: `Hindsight could not load demo memories: ${details}`,
      },
      { status: 503 }
    );
  }
}