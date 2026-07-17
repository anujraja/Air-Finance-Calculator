/**
 * localStorage-backed {@link ScenarioStore}. Fully functional with no backend.
 *
 * Reads are defensive: a corrupt or foreign payload yields an empty list rather
 * than throwing, so a bad localStorage value can never break the app. All
 * methods are async to match the interface a network-backed store would use,
 * which keeps calling code identical when swapping to Postgres.
 */

import type { ScenarioStore, SavedScenario, NewSavedScenario } from "./types";
import { calculatorInputSchema } from "@/lib/engine/schema";

const STORAGE_KEY = "homecost-canada.scenarios.v1";

function makeId(): string {
  // crypto.randomUUID is available in all supported browsers; fall back defensively.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

export class LocalStorageStore implements ScenarioStore {
  private readonly storage: Storage | null;

  constructor(storage?: Storage) {
    this.storage = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
  }

  private readAll(): SavedScenario[] {
    if (!this.storage) return [];
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Validate structure *and* both scenario payloads, so a corrupt or foreign
      // record can never feed invalid values into the controlled form inputs.
      return parsed.filter((item): item is SavedScenario => {
        if (!item || typeof item !== "object") return false;
        const record = item as Partial<SavedScenario>;
        if (typeof record.id !== "string" || typeof record.name !== "string") return false;
        return (
          calculatorInputSchema.safeParse(record.scenarioA).success &&
          calculatorInputSchema.safeParse(record.scenarioB).success
        );
      });
    } catch {
      return [];
    }
  }

  private writeAll(scenarios: SavedScenario[]): void {
    if (!this.storage) return;
    this.storage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  }

  async list(): Promise<SavedScenario[]> {
    return this.readAll().sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  }

  async save(scenario: NewSavedScenario): Promise<SavedScenario> {
    const all = this.readAll();
    const record: SavedScenario = {
      ...scenario,
      id: makeId(),
      savedAt: new Date().toISOString(),
    };
    // Replace an existing record with the same (case-insensitive) name.
    const withoutDup = all.filter(
      (s) => s.name.trim().toLowerCase() !== scenario.name.trim().toLowerCase(),
    );
    this.writeAll([record, ...withoutDup]);
    return record;
  }

  async get(id: string): Promise<SavedScenario | null> {
    return this.readAll().find((s) => s.id === id) ?? null;
  }

  async remove(id: string): Promise<void> {
    this.writeAll(this.readAll().filter((s) => s.id !== id));
  }
}
