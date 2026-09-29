import { describe, expect, it } from "vitest";
import { fallbackAnalysis, parseModelAnalysis } from "@/lib/ai/analyze";
import { demoMemories, demoIncidents } from "@/lib/demo/incidents";
import { incidentInputSchema } from "@/lib/incidents/schema";
import { extractField, formatIncidentMemory } from "@/lib/hindsight/memory";

const validIncident = {
  title: "Payments API 503 errors", service: "Payments", severity: "Critical" as const,
  errorCode: "HTTP 503", description: "Payment requests fail during a traffic increase.",
  symptoms: ["Database connection timeout"], recentChanges: "Traffic +35%", affectedUsers: "18% of requests",
  timestamp: "2026-09-29T09:18:00.000Z",
};

describe("incident intake", () => {
  it("accepts a complete, bounded incident", () => {
    expect(incidentInputSchema.safeParse(validIncident).success).toBe(true);
  });

  it("rejects a short title and missing symptoms", () => {
    expect(incidentInputSchema.safeParse({ ...validIncident, title: "API", symptoms: [] }).success).toBe(false);
  });
});

describe("Hindsight memory formatting", () => {
  it("retains the incident outcome, evidence, lesson, and relationship", () => {
    const text = formatIncidentMemory(demoIncidents[0], {
      rootCause: "Pool exhaustion", resolutionApplied: "Raised pool capacity", whatWorked: "Capacity increase",
      whatDidNotWork: "Restart alone", impact: "Error rate under 1%", lessonsLearned: "Check pool first",
    }, "INC-102");
    expect(text).toContain("Incident ID: INC-104");
    expect(text).toContain("What did not work: Restart alone");
    expect(text).toContain("Relevant previous incident: INC-102");
    expect(text).toContain("Outcome: Resolved");
  });

  it("extracts fields from the returned source text", () => {
    expect(extractField(demoMemories[0].text, "Service")).toBe("Payments");
    expect(extractField(demoMemories[0].text, "Root cause")).toContain("PostgreSQL");
  });
});

describe("analysis fallback", () => {
  it("uses only retrieved incident IDs as historical evidence", () => {
    const result = fallbackAnalysis(demoIncidents[0], [demoMemories[0]]);
    expect(result.supportingIncidents).toEqual(["INC-102"]);
    expect(result.whyRelevant).toContain("Hindsight returned INC-102");
    expect(result.recommendation.join(" ")).toContain("INC-102");
  });

  it("does not invent historical support when recall returns no memories", () => {
    const result = fallbackAnalysis(demoIncidents[0], []);
    expect(result.supportingIncidents).toEqual([]);
    expect(result.confidence).toBe("Low");
    expect(result.pattern).toContain("No relevant historical memories");
    expect(result.whyRelevant).toContain("No historical incident");
  });

  it("removes incident IDs that do not exist in retrieved records", () => {
    const modelResponse = JSON.stringify({
      summary: "INC-102 matches INC-999", pattern: "INC-999 looks similar", likelyRootCause: "See INC-888",
      recommendation: ["Compare with INC-102 and INC-777"], investigationSteps: ["Review INC-999"],
      whyRelevant: "INC-102 supports this, not INC-555", confidence: "Moderate",
      supportingIncidents: ["INC-102", "INC-999"],
    });
    const result = parseModelAnalysis(modelResponse, [demoMemories[0]]);
    expect(result?.summary).toContain("an unverified incident");
    expect(result?.recommendation[0]).toContain("INC-102");
    expect(result?.supportingIncidents).toEqual(["INC-102"]);
  });

  it("returns null for malformed structured model output", () => {
    expect(parseModelAnalysis("not json", [])).toBeNull();
    expect(parseModelAnalysis(JSON.stringify({ summary: "missing required fields" }), [])).toBeNull();
  });
});