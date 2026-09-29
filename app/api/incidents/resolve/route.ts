import { NextResponse } from "next/server";
import { resolutionSchema } from "@/lib/incidents/schema";
import { hindsightConfigured } from "@/lib/hindsight/client";
import { retainIncident } from "@/lib/hindsight/memory";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const parsed = resolutionSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Add the root cause, resolution, impact, and lesson before saving." }, { status: 400 });
    if (!hindsightConfigured()) return NextResponse.json({ saved: false, mode: "demo", message: "Hindsight is not connected. This learning can be kept in this browser's demo memory only." });
    const incident = { ...parsed.data.incident, createdAt: parsed.data.incident.createdAt || new Date().toISOString() };
    await retainIncident(incident, parsed.data.resolution, parsed.data.relevantIncident);
    return NextResponse.json({ saved: true, mode: "hindsight", message: "Incident learning retained in Hindsight." });
  } catch {
    return NextResponse.json({ saved: false, mode: "demo", message: "Hindsight could not be reached. This learning was not retained there; it can be kept as browser-only Demo Memory." });
  }
}