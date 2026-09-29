import { getHindsightClient, hindsightBankId } from "@/lib/hindsight/client";
import type {
  Incident,
  Resolution,
  RetrievedMemory,
} from "@/types";

type RecallResult = {
  id?: string;
  text: string;
};

function extractField(text: string, field: string) {
  const regex = new RegExp(
    `${field}:\\s*(.+?)(?:\\n|$)`,
    "i"
  );

  return text.match(regex)?.[1]?.trim();
}

function extractIncidentId(text: string) {
  return text.match(/Incident ID:\s*(INC-\d+)/i)?.[1];
}

function formatIncidentMemory(
  incident: Incident,
  resolution: Resolution,
  relevantIncident?: string
) {
  return [
    `Incident ID: ${incident.id}`,
    `Incident title: ${incident.title}`,
    `Service: ${incident.service}`,
    `Severity: ${incident.severity}`,
    `Error code: ${incident.errorCode}`,
    `Date: ${incident.timestamp || new Date().toISOString()}`,
    `Description: ${incident.description}`,
    `Symptoms: ${incident.symptoms.join("; ")}`,
    `Recent changes: ${incident.recentChanges}`,
    `Affected users: ${incident.affectedUsers}`,
    `Root cause: ${resolution.rootCause}`,
    `Resolution: ${resolution.resolution}`,
    `Outcome: ${resolution.outcome}`,
    relevantIncident
      ? `Related incident: ${relevantIncident}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function retainIncident(
  incident: Incident,
  resolution: Resolution,
  relevantIncident?: string
) {
  const serviceTag = incident.service
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");

  return getHindsightClient().retain(
    hindsightBankId(),
    formatIncidentMemory(
      incident,
      resolution,
      relevantIncident
    ),
    {
      timestamp:
        incident.timestamp ||
        new Date().toISOString(),
      context:
        "Resolved production incident and operator-authored post-incident learning.",
      documentId: incident.id.toLowerCase(),
      metadata: {
        incident_id: incident.id,
        service: incident.service,
        status: "resolved",
      },
      tags: [
        "incident",
        "incidentiq",
        `service:${serviceTag}`,
        `severity:${incident.severity.toLowerCase()}`,
      ],
      updateMode: "replace",
    }
  );
}

export async function recallRelevantIncidents(
  query: string,
  limit = 8
): Promise<RetrievedMemory[]> {
  const hindsight = getHindsightClient();

  const response = await hindsight.recall(
    hindsightBankId(),
    query,
    {
      budget: "mid",
      maxTokens: 5000,
      includeEntities: false,
    }
  );

  return response.results
    .slice(0, limit)
    .map(
      (
        result: RecallResult,
        index: number
      ) => ({
        id:
          extractIncidentId(result.text) ||
          result.id ||
          `memory-${index + 1}`,
        text: result.text,
        source: "hindsight" as const,
        title: extractField(
          result.text,
          "Incident title"
        ),
        service: extractField(
          result.text,
          "Service"
        ),
        date: extractField(
          result.text,
          "Date"
        ),
        rootCause: extractField(
          result.text,
          "Root cause"
        ),
        resolution: extractField(
          result.text,
          "Resolution"
        ),
        outcome: extractField(
          result.text,
          "Outcome"
        ),
      })
    );
}

export async function reflectOnIncidents(
  query: string,
  memories: RetrievedMemory[]
) {
  if (memories.length === 0) {
    return null;
  }

  const incidentIds = memories.map(
    (memory) => memory.id
  );

  const response = await getHindsightClient().reflect(
    hindsightBankId(),
    query,
    {
      budget: "low",
      context: `Use the following recall results as the only evidence. Do not introduce incident IDs or operational facts not present here.

${memories
  .map((memory) => memory.text)
  .join("\n\n---\n\n")}`,
      responseSchema: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description:
              "A brief comparison of the current incident query with the supplied records.",
          },
          supporting_incidents: {
            type: "array",
            items: {
              type: "string",
              enum: incidentIds,
            },
          },
        },
        required: [
          "summary",
          "supporting_incidents",
        ],
        additionalProperties: false,
      },
    }
  );

  return {
    summary:
      response.structured_output?.summary ||
      response.text ||
      "",
    supportingIncidents:
      Array.isArray(
        response.structured_output
          ?.supporting_incidents
      )
        ? response.structured_output
            .supporting_incidents
        : [],
  };
}

export async function seedDemoMemories(
  memories: RetrievedMemory[]
) {
  const hindsight = getHindsightClient();

  const missing: RetrievedMemory[] = [];

  for (const memory of memories) {
    const existing = await hindsight.recall(
      hindsightBankId(),
      `Incident ID: ${memory.id}`,
      {
        budget: "low",
        maxTokens: 1200,
        includeEntities: false,
      }
    );

    if (
      existing.results.some((result) =>
        result.text.includes(
          `Incident ID: ${memory.id}`
        )
      )
    ) {
      continue;
    }

    missing.push(memory);

    await hindsight.retain(
      hindsightBankId(),
      memory.text,
      {
        timestamp: memory.date,
        context:
          "Synthetic IncidentIQ demo incident; not customer or company data.",
        documentId: memory.id.toLowerCase(),
        metadata: {
          incident_id: memory.id,
          service:
            memory.service || "unknown",
          status: "resolved",
        },
        tags: [
          "incident",
          "incidentiq",
          "incidentiq-demo",
          `service:${(
            memory.service || "unknown"
          )
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")}`,
        ],
        updateMode: "replace",
      }
    );
  }

  return {
    added: missing.length,
    existing:
      memories.length - missing.length,
    total: memories.length,
  };
}