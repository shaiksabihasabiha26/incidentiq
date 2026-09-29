import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeIncident } from "@/lib/ai/analyze";
import { demoMemories } from "@/lib/demo/incidents";
import { incidentInputSchema } from "@/lib/incidents/schema";
import { hindsightConfigured } from "@/lib/hindsight/client";
import {
  recallRelevantIncidents,
  reflectOnIncidents,
} from "@/lib/hindsight/memory";
import type { Incident, RetrievedMemory } from "@/types";

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
  incident: incidentInputSchema,
  demoMemories: z.array(demoMemorySchema).max(30).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Check the incident fields and try again." },
        { status: 400 }
      );
    }

    const incident = {
      ...parsed.data.incident,
      id: `INC-${Date.now().toString().slice(-6)}`,
      status: "Investigating" as const,
      createdAt: new Date().toISOString(),
    } as Incident;

    let memories: RetrievedMemory[];
    let memoryMode: "hindsight" | "demo";
    let memoryNotice: string | undefined;

    let reflection: Awaited<
      ReturnType<typeof reflectOnIncidents>
    > = null;

    if (hindsightConfigured()) {
      try {
        const query = `${incident.title}. Service: ${incident.service}. Error: ${incident.errorCode}. Symptoms: ${incident.symptoms.join("; ")}. Recent changes: ${incident.recentChanges}`;

        memories = await recallRelevantIncidents(query);

        memoryMode = "hindsight";

        if (memories.length) {
          try {
            reflection = await reflectOnIncidents(query, memories);
          } catch (error) {
            console.error("HINDSIGHT REFLECTION FAILED:", error);
            reflection = null;
          }
        }
      } catch (error) {
        console.error("HINDSIGHT INCIDENT RECALL FAILED:", error);

        const details =
          error instanceof Error
            ? error.message
            : String(error);

        return NextResponse.json(
          {
            error: `Hindsight incident recall failed: ${details}`,
          },
          { status: 500 }
        );
      }
    } else {
      const local = parsed.data.demoMemories || [];

      const candidates = [
        ...local.map((item) => ({
          ...item,
          source: "demo" as const,
        })),
        ...demoMemories,
      ];

      const terms = `${incident.title} ${incident.service} ${incident.description} ${incident.symptoms.join(" ")} ${incident.errorCode}`
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 3);

      memories = candidates
        .map((memory) => ({
          memory,
          score: terms.reduce(
            (score, term) =>
              score +
              (memory.text.toLowerCase().includes(term) ? 1 : 0),
            0
          ),
        }))
        .filter(({ score }) => score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, 5)
        .map(({ memory }) => memory);

      memoryMode = "demo";
    }

    const analysis = await analyzeIncident(
      incident,
      memories
    );

    return NextResponse.json({
      incident,
      memories,
      analysis,
      memoryMode,
      memoryNotice,
      reflection,
    });
  } catch (error) {
    console.error("INCIDENT ANALYSIS FAILED:", error);

    const details =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        error: `Incident analysis failed: ${details}`,
      },
      { status: 500 }
    );
  }
}