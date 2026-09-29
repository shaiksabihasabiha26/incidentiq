import { HindsightClient } from "@vectorize-io/hindsight-client";

let client: HindsightClient | undefined;

export function hindsightConfigured() {
  return Boolean(process.env.HINDSIGHT_BASE_URL && process.env.HINDSIGHT_BANK_ID);
}

export function getHindsightClient() {
  const baseUrl = process.env.HINDSIGHT_BASE_URL;
  if (!baseUrl || !process.env.HINDSIGHT_BANK_ID) {
    throw new Error("Hindsight is not configured. Set HINDSIGHT_BASE_URL and HINDSIGHT_BANK_ID.");
  }
  client ??= new HindsightClient({
    baseUrl,
    apiKey: process.env.HINDSIGHT_API_KEY || undefined,
    userAgent: "incidentiq/1.0.0",
    maxAttempts: 2,
  });
  return client;
}

export function hindsightBankId() {
  return process.env.HINDSIGHT_BANK_ID || "not configured";
}