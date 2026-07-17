import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageStore } from "./localStorageStore";
import { DEFAULT_INPUT } from "@/lib/engine/schema";
import type { NewSavedScenario } from "./types";

const sample: NewSavedScenario = {
  name: "My first home",
  scenarioA: DEFAULT_INPUT,
  scenarioB: { ...DEFAULT_INPUT, homePrice: 700_000 },
};

describe("LocalStorageStore", () => {
  let store: LocalStorageStore;

  beforeEach(() => {
    window.localStorage.clear();
    store = new LocalStorageStore(window.localStorage);
  });

  it("starts empty", async () => {
    expect(await store.list()).toEqual([]);
  });

  it("saves and lists a scenario", async () => {
    const saved = await store.save(sample);
    expect(saved.id).toBeTruthy();
    expect(saved.savedAt).toBeTruthy();
    const list = await store.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe("My first home");
  });

  it("retrieves a scenario by id", async () => {
    const saved = await store.save(sample);
    const fetched = await store.get(saved.id);
    expect(fetched?.scenarioB.homePrice).toBe(700_000);
  });

  it("removes a scenario", async () => {
    const saved = await store.save(sample);
    await store.remove(saved.id);
    expect(await store.list()).toHaveLength(0);
  });

  it("replaces a same-named scenario instead of duplicating", async () => {
    await store.save(sample);
    await store.save({ ...sample, scenarioA: { ...DEFAULT_INPUT, homePrice: 999_000 } });
    const list = await store.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.scenarioA.homePrice).toBe(999_000);
  });

  it("returns an empty list when localStorage holds corrupt data", async () => {
    window.localStorage.setItem("homecost-canada.scenarios.v1", "{not valid json");
    expect(await store.list()).toEqual([]);
  });
});
