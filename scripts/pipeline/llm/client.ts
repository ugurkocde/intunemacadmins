import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function getClient(): Anthropic {
  if (!client) client = new Anthropic({ maxRetries: 3 });
  return client;
}
