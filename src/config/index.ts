import discover2026 from "./events/discover-2026.json";
import roadshowTemplate from "./events/roadshow-template.json";
import rushJson from "./content/rush.json";
import detectiveJson from "./content/detective.json";
import launchJson from "./content/launch.json";
import researchJson from "./content/research.json";
import {
  detectiveContentSchema,
  eventConfigSchema,
  launchContentSchema,
  researchContentSchema,
  rushContentSchema,
  type DetectiveContent,
  type EventConfig,
  type LaunchContent,
  type ResearchContent,
  type RushContent,
} from "./schema";

/**
 * Event registry. To reuse the game at another roadshow, add a JSON file in
 * ./events, register it here, and set NEXT_PUBLIC_EVENT_ID. No other code changes.
 */
const rawEvents: unknown[] = [discover2026, roadshowTemplate];

export const events: readonly EventConfig[] = rawEvents.map((e) => eventConfigSchema.parse(e));

export const DEFAULT_EVENT_ID = "discover-2026";

export function getEventConfig(id: string | undefined = process.env.NEXT_PUBLIC_EVENT_ID): EventConfig {
  const wanted = id && id.length > 0 ? id : DEFAULT_EVENT_ID;
  const found = events.find((e) => e.id === wanted);
  if (!found) {
    throw new Error(`Unknown event id "${wanted}". Known: ${events.map((e) => e.id).join(", ")}`);
  }
  return found;
}

export const knownEventIds: ReadonlySet<string> = new Set(events.map((e) => e.id));

export const rushContent: RushContent = rushContentSchema.parse(rushJson);
export const detectiveContent: DetectiveContent = detectiveContentSchema.parse(detectiveJson);
export const launchContent: LaunchContent = launchContentSchema.parse(launchJson);
export const researchContent: ResearchContent = researchContentSchema.parse(researchJson);

export type CollectionMode = "server" | "browser" | "off";

export function getCollectionMode(): CollectionMode {
  const v = process.env.NEXT_PUBLIC_COLLECTION_MODE;
  return v === "browser" || v === "off" ? v : "server";
}
