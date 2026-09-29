export type Severity = "Critical" | "High" | "Medium" | "Low";
export type IncidentStatus = "Investigating" | "Resolved";

export type Incident = {
  id: string;
  title: string;
  service: string;
  severity: Severity;
  errorCode: string;
  description: string;
  symptoms: string[];
  recentChanges: string;
  affectedUsers: string;
  timestamp: string;
  status: IncidentStatus;
  rootCause?: string;
  resolution?: string;
  createdAt: string;
};

export type Resolution = {
  rootCause: string;
  resolutionApplied: string;
  whatWorked: string;
  whatDidNotWork: string;
  impact: string;
  lessonsLearned: string;
};

export type RetrievedMemory = {
  id: string;
  text: string;
  source: "hindsight" | "demo";
  date?: string;
  service?: string;
  title?: string;
  rootCause?: string;
  resolution?: string;
  outcome?: string;
};

export type IncidentAnalysis = {
  summary: string;
  pattern: string;
  likelyRootCause: string;
  recommendation: string[];
  investigationSteps: string[];
  whyRelevant: string;
  confidence: "Low" | "Moderate" | "High";
  supportingIncidents: string[];
  llmConnected: boolean;
};