import { NextResponse } from "next/server";
import { getHindsightClient, hindsightBankId, hindsightConfigured } from "@/lib/hindsight/client";

export const runtime = "nodejs";

export async function GET() {
  let hindsight = { configured: hindsightConfigured(), connected: false };
  if (hindsight.configured) {
    try {
      await getHindsightClient().getVersion({ signal: AbortSignal.timeout(5000) });
      hindsight = { ...hindsight, connected: true };
    } catch {
      hindsight.connected = false;
    }
  }
  return NextResponse.json({ hindsight, llm: { configured: Boolean(process.env.GROQ_API_KEY) }, bankId: hindsightBankId(), lastMemorySync: null });
}