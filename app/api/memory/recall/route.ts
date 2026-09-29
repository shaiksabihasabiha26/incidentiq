import { NextResponse } from "next/server";
import { z } from "zod";
import { demoMemories } from "@/lib/demo/incidents";
import { hindsightConfigured } from "@/lib/hindsight/client";
import { recallRelevantIncidents } from "@/lib/hindsight/memory";
import type { RetrievedMemory } from "@/types";

export const runtime = "nodejs";

const demoMemorySchema = z.object({
  id: z.string(),
  text: z.string(),
  source: z.literal("demo"),
  date: z.string().optional(),
  service: z.string().optional(),
  title: z.string().optional(),
  rootCause: z.string().optional(),
  resolution: z.string().optional(),
  outcome: z.string().optional(),
});

const requestSchema = z.object({
  query: z.string().trim().min(2).max(500),
  demoMemories: z.array(demoMemorySchema).max(30).optional(),
});

export async function POST(request: Request) {
  let parsed: ReturnType<typeof requestSchema.safeParse>;

  try {
    parsed = requestSchema.safeParse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter at least two characters to search." },
      { status: 400 }
    );
  }

  try {
    if (hindsightConfigured()) {
      return NextResponse.json({
        memories: await recallRelevantIncidents(parsed.data.query, 20),
        mode: "hindsight",
      });
    }

    const terms = parsed.data.query
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((term) => term.length > 2);

    const candidates: RetrievedMemory[] = [
      ...(parsed.data.demoMemories || []),
      ...demoMemories,
    ].map((memory) => ({
      ...memory,
      source: "demo" as const,
    }));

    const memories = candidates
      .map((memory) => ({
        ...memory,
        source: "demo" as const,
        score: terms.reduce(
          (score, term) =>
            score + (memory.text.toLowerCase().includes(term) ? 1 : 0),
          0
        ),
      }))
      .filter((memory) => memory.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 20)
      .map(
        ({
          id,
          text,
          source,
          date,
          service,
          title,
          rootCause,
          resolution,
          outcome,
        }) => ({
          id,
          text,
          source,
          date,
          service,
          title,
          rootCause,
          resolution,
          outcome,
        })
      );

    return NextResponse.json({
      memories,
      mode: "demo",
    });
  } catch (error) {
    console.error("HINDSIGHT RECALL FAILED:", error);

    return NextResponse.json(
      {
        error: "Hindsight recall failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}