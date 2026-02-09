import type { Clawbot } from "./types";

const STORAGE_KEY = "alienclaw-fake-agents";
const SETUP_KEY = "alienclaw-agent-setup";

// ── Agent storage ──

export function getFakeAgents(): Clawbot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addFakeAgent(agent: Clawbot): void {
  const existing = getFakeAgents();
  existing.push(agent);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function clearFakeAgents(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Slug helpers ──

export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function findAgentBySlug(slug: string): Clawbot | undefined {
  return getFakeAgents().find((a) => nameToSlug(a.name) === slug);
}

// ── Agent setup config ──

export interface AgentSetup {
  telegramToken?: string;
  telegramBotUsername?: string;
  aiProvider?: "openai" | "anthropic";
  aiApiKey?: string;
  setupComplete?: boolean;
}

export function getAgentSetup(clawbotId: string): AgentSetup {
  if (typeof window === "undefined") return {};
  try {
    const all = JSON.parse(localStorage.getItem(SETUP_KEY) || "{}");
    return all[clawbotId] || {};
  } catch {
    return {};
  }
}

export function saveAgentSetup(clawbotId: string, setup: AgentSetup): void {
  try {
    const all = JSON.parse(localStorage.getItem(SETUP_KEY) || "{}");
    all[clawbotId] = { ...all[clawbotId], ...setup };
    localStorage.setItem(SETUP_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}
