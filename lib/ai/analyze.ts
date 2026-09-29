import Groq from "groq-sdk";
import { z } from "zod";
import type { Incident, IncidentAnalysis, RetrievedMemory } from "@/types";

const analysisSchema = z.object({
  summary: z.string(), pattern: z.string(), likelyRootCause: z.string(),
  recommendation: z.array(z.string()).min(1).max(8),
  investigationSteps: z.array(z.string()).min(1).max(8), whyRelevant: z.string(),
  confidence: z.enum(["Low", "Moderate", "High"]), supportingIncidents: z.array(z.string()).max(8),
});

export async function analyzeIncident(incident: Incident, memories: RetrievedMemory[]): Promise<IncidentAnalysis> {
  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b", temperature: 0.2, response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are an SRE incident analyst. Return only JSON matching the requested fields. Historical facts and incident IDs may only be cited from the supplied memories; if there are none, explicitly say no historical match and give safe generic investigation steps. Never claim an action was performed. Keep recommendations conditional on evidence and include rollback/verification where relevant." },
          { role: "user", content: JSON.stringify({
            requestedFields: { summary: "string", pattern: "string", likelyRootCause: "string", recommendation: ["string"], investigationSteps: ["string"], whyRelevant: "string", confidence: "Low|Moderate|High", supportingIncidents: ["string"] },
            currentIncident: incident,
            retrievedHistoricalMemories: memories.map(({ id, text }) => ({ id, text })),
          }) },
        ],
      });
      const raw = response.choices[0]?.message?.content || "";
      const parsed = parseModelAnalysis(raw, memories);
      if (parsed) return { ...parsed, llmConnected: true };
    } catch {
      return fallbackAnalysis(incident, memories, false);
    }
  }
  return fallbackAnalysis(incident, memories, false);
}

export function parseModelAnalysis(raw: string, memories: RetrievedMemory[]) {
  try {
    const parsed = analysisSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const knownIds = new Set(memories.map((memory) => memory.id.toUpperCase()));
    const removeUnknownIncidentIds = (text: string) => text.replace(/\bINC-[A-Z0-9-]+\b/gi, (id) => knownIds.has(id.toUpperCase()) ? id : "an unverified incident");
    return {
      ...parsed.data,
      summary: removeUnknownIncidentIds(parsed.data.summary),
      pattern: removeUnknownIncidentIds(parsed.data.pattern),
      likelyRootCause: removeUnknownIncidentIds(parsed.data.likelyRootCause),
      recommendation: parsed.data.recommendation.map(removeUnknownIncidentIds),
      investigationSteps: parsed.data.investigationSteps.map(removeUnknownIncidentIds),
      whyRelevant: removeUnknownIncidentIds(parsed.data.whyRelevant),
      supportingIncidents: parsed.data.supportingIncidents.filter((id) => knownIds.has(id.toUpperCase())),
    };
  } catch {
    return null;
  }
}

export function fallbackAnalysis(incident: Incident, memories: RetrievedMemory[], llmConnected = false): IncidentAnalysis {
  const match = memories[0];
  if (!match) return {
    summary: `${incident.title} is affecting ${incident.service}. Start with the highest-signal symptoms and recent changes.`,
    pattern: "No relevant historical memories were retrieved for this incident.",
    likelyRootCause: "Undetermined. Validate telemetry before changing production configuration.",
    recommendation: ["Check the service error rate and request traces.", "Inspect database, cache, and dependency health.", "Compare the incident start time with deployments and traffic changes.", "Apply a reversible mitigation only after confirming the failing dependency."],
    investigationSteps: ["Inspect service logs and traces", "Check dependency health", "Compare traffic with baseline", "Review recent deployments"],
    whyRelevant: "No historical incident was available to support a targeted recommendation; these are general investigation steps.",
    confidence: "Low", supportingIncidents: [], llmConnected,
  };
  return {
    summary: `${incident.title} shares symptoms with ${match.id}${match.service ? ` in ${match.service}` : ""}.`,
    pattern: `${match.id} is the closest retrieved historical record. Compare its symptoms and root cause with current telemetry before applying its resolution.`,
    likelyRootCause: match.rootCause || "A related historical root cause was found; verify it against current metrics before acting.",
    recommendation: [
      `Compare current telemetry with ${match.id}: ${match.rootCause || match.title || "review the prior incident record"}.`,
      `Inspect ${incident.service} dependency and connection-pool saturation before restarting workers.`,
      `If the same constraint is confirmed, consider the prior mitigation: ${match.resolution || "use the recorded resolution as a hypothesis"}.`,
      "Monitor error rate and latency after any change; revert if service health worsens.",
    ],
    investigationSteps: ["Inspect active connections and pool wait time", "Compare traffic and concurrency with the historical incident", "Check recent deployment and configuration changes", `Review ${match.id} resolution and verify its preconditions`],
    whyRelevant: `Hindsight returned ${match.id} as relevant historical context. ${match.resolution ? `Its recorded resolution was: ${match.resolution}` : "Use its source text to validate the operational details."}`,
    confidence: "Moderate", supportingIncidents: [match.id], llmConnected,
  };
}