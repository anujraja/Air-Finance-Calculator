/**
 * Persistence contract for named scenarios.
 *
 * The app depends only on the {@link ScenarioStore} interface, never on a
 * concrete backend. The shipped implementation is {@link LocalStorageStore}
 * (browser localStorage, zero infra). Swapping to Postgres means writing one
 * new class that implements this same interface plus a thin API route — no UI
 * changes. See README "Persistence" for the Postgres schema and swap steps.
 */

import type { CalculatorInput } from "@/lib/engine/schema";

/** A user-named, saved pair of scenarios. */
export interface SavedScenario {
  /** Stable unique id. */
  id: string;
  /** User-provided name. */
  name: string;
  /** Scenario A raw input. */
  scenarioA: CalculatorInput;
  /** Scenario B raw input. */
  scenarioB: CalculatorInput;
  /** ISO timestamp of when the record was saved. */
  savedAt: string;
}

/** Data required to create a saved scenario (id + timestamp are assigned by the store). */
export type NewSavedScenario = Omit<SavedScenario, "id" | "savedAt">;

/** Backend-agnostic CRUD for saved scenarios. */
export interface ScenarioStore {
  list(): Promise<SavedScenario[]>;
  save(scenario: NewSavedScenario): Promise<SavedScenario>;
  get(id: string): Promise<SavedScenario | null>;
  remove(id: string): Promise<void>;
}
