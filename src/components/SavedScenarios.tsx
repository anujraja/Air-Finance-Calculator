"use client";

/**
 * Save / reopen named scenarios. Talks only to the {@link ScenarioStore}
 * interface, so swapping localStorage for a Postgres-backed store requires no
 * change here. Manages its own list state and empty/feedback states.
 */

import { useEffect, useMemo, useState } from "react";
import { LocalStorageStore } from "@/lib/persistence/localStorageStore";
import type { SavedScenario } from "@/lib/persistence/types";
import type { CalculatorInput } from "@/lib/engine/schema";

interface SavedScenariosProps {
  scenarioA: CalculatorInput;
  scenarioB: CalculatorInput;
  onLoad: (saved: SavedScenario) => void;
}

export function SavedScenarios({ scenarioA, scenarioB, onLoad }: SavedScenariosProps) {
  const store = useMemo(() => new LocalStorageStore(), []);
  const [items, setItems] = useState<SavedScenario[]>([]);
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);

  async function refresh() {
    setItems(await store.list());
  }

  useEffect(() => {
    let active = true;
    store.list().then((list) => {
      if (!active) return;
      setItems(list);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [store]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await store.save({ name: trimmed, scenarioA, scenarioB });
    setName("");
    await refresh();
  }

  async function handleRemove(id: string) {
    await store.remove(id);
    await refresh();
  }

  return (
    <section aria-labelledby="saved-heading" className="flex flex-col gap-4">
      <div>
        <h3 id="saved-heading" className="font-display text-lg text-ink">
          Saved scenarios
        </h3>
        <p className="text-sm text-ink-soft">
          Stored in your browser. Reopen a comparison anytime.
        </p>
      </div>

      <form onSubmit={handleSave} className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this comparison…"
          aria-label="Scenario name"
          maxLength={60}
          className="min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          data-testid="save-scenario"
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save
        </button>
      </form>

      {ready && items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong bg-surface-2 px-4 py-6 text-center text-sm text-ink-faint">
          No saved scenarios yet. Save a comparison to reopen it later.
        </p>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="saved-list">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3.5 py-2.5"
            >
              <button
                type="button"
                onClick={() => onLoad(item)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate text-sm font-medium text-ink group-hover:text-accent">
                  {item.name}
                </span>
                <span className="block font-mono text-xs tabular-nums text-ink-faint">
                  {new Date(item.savedAt).toLocaleDateString("en-CA")}
                </span>
              </button>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onLoad(item)}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent-soft"
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  aria-label={`Delete ${item.name}`}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-ink-faint hover:bg-danger-soft hover:text-danger"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
