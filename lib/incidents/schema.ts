import { z } from "zod";

export const incidentInputSchema = z.object({
  title: z.string().trim().min(5).max(140),
  service: z.string().trim().min(2).max(80),
  severity: z.enum(["Critical", "High", "Medium", "Low"]),
  errorCode: z.string().trim().max(100).default(""),
  description: z.string().trim().min(10).max(2000),
  symptoms: z.array(z.string().trim().min(1).max(180)).min(1).max(12),
  recentChanges: z.string().trim().max(1000).default(""),
  affectedUsers: z.string().trim().max(200).default(""),
  timestamp: z.string().datetime().or(z.literal("")),
});

export const resolutionSchema = z.object({
  incident: incidentInputSchema.extend({
    id: z.string().min(3).max(32),
    status: z.enum(["Investigating", "Resolved"]).default("Investigating"),
    createdAt: z.string().datetime().optional(),
  }),
  resolution: z.object({
    rootCause: z.string().trim().min(8).max(1200),
    resolutionApplied: z.string().trim().min(8).max(1200),
    whatWorked: z.string().trim().min(3).max(1200),
    whatDidNotWork: z.string().trim().max(1200),
    impact: z.string().trim().min(3).max(500),
    lessonsLearned: z.string().trim().min(8).max(1200),
  }),
  relevantIncident: z.string().max(32).optional(),
});