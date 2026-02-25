import {
  computeStrengthStat,
  computeAgilityStat,
  computeEnduranceStat,
  computeFocusCount,
  computeFuryCount,
  getAllStats,
} from "../src/lib/gamification";

const mockGetDatabase = jest.fn();

jest.mock("../src/lib/database", () => ({
  getDatabase: () => mockGetDatabase(),
}));

// ── Helpers ──────────────────────────────────────────────────

function dbWith(overrides: { getFirstAsync?: jest.Mock; getAllAsync?: jest.Mock }) {
  return {
    getFirstAsync: overrides.getFirstAsync ?? jest.fn().mockResolvedValue(null),
    getAllAsync: overrides.getAllAsync ?? jest.fn().mockResolvedValue([]),
  };
}

// ── STRENGTH ─────────────────────────────────────────────────

describe("computeStrengthStat", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns Iron Fist at 0 total volume", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getFirstAsync: jest.fn().mockResolvedValue({ total_volume: 0 }) })
    );
    const result = await computeStrengthStat();
    expect(result.tier).toBe("Iron Fist");
    expect(result.tierIndex).toBe(0);
    expect(result.value).toBe(0);
  });

  it("returns Iron Fist just below Steel Grip threshold (9,999 kg)", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getFirstAsync: jest.fn().mockResolvedValue({ total_volume: 9_999 }) })
    );
    const result = await computeStrengthStat();
    expect(result.tier).toBe("Iron Fist");
  });

  it("returns Steel Grip at exactly 10,000 kg", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getFirstAsync: jest.fn().mockResolvedValue({ total_volume: 10_000 }) })
    );
    const result = await computeStrengthStat();
    expect(result.tier).toBe("Steel Grip");
    expect(result.tierIndex).toBe(1);
  });

  it("returns Mountain Hands at exactly 50,000 kg", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getFirstAsync: jest.fn().mockResolvedValue({ total_volume: 50_000 }) })
    );
    const result = await computeStrengthStat();
    expect(result.tier).toBe("Mountain Hands");
    expect(result.tierIndex).toBe(2);
  });

  it("returns Titan at exactly 150,000 kg", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getFirstAsync: jest.fn().mockResolvedValue({ total_volume: 150_000 }) })
    );
    const result = await computeStrengthStat();
    expect(result.tier).toBe("Titan");
    expect(result.tierIndex).toBe(3);
  });

  it("returns Titan well above 150,000 kg", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getFirstAsync: jest.fn().mockResolvedValue({ total_volume: 999_999 }) })
    );
    const result = await computeStrengthStat();
    expect(result.tier).toBe("Titan");
    expect(result.tierIndex).toBe(3);
  });

  it("handles null database row (fresh install)", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getFirstAsync: jest.fn().mockResolvedValue(null) })
    );
    const result = await computeStrengthStat();
    expect(result.value).toBe(0);
    expect(result.tier).toBe("Iron Fist");
  });

  it("queries only completed sessions (end_time IS NOT NULL)", async () => {
    const getFirstAsync = jest.fn().mockResolvedValue({ total_volume: 5_000 });
    mockGetDatabase.mockResolvedValue(dbWith({ getFirstAsync }));
    await computeStrengthStat();
    expect(getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining("end_time IS NOT NULL")
    );
  });
});

// ── AGILITY ──────────────────────────────────────────────────

describe("computeAgilityStat", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns Crawler at 0 when no sessions in window", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getAllAsync: jest.fn().mockResolvedValue([]) })
    );
    const result = await computeAgilityStat();
    expect(result.tier).toBe("Crawler");
    expect(result.value).toBe(0);
    expect(result.tierIndex).toBe(0);
  });

  it("returns Crawler at 1 session/week average", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({
        getAllAsync: jest.fn().mockResolvedValue([
          { week: "2026-08", session_count: 1 },
          { week: "2026-07", session_count: 1 },
        ]),
      })
    );
    const result = await computeAgilityStat();
    expect(result.tier).toBe("Crawler");
    expect(result.value).toBe(1);
  });

  it("returns Strider at exactly 2 sessions/week average", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({
        getAllAsync: jest.fn().mockResolvedValue([
          { week: "2026-08", session_count: 2 },
          { week: "2026-09", session_count: 2 },
        ]),
      })
    );
    const result = await computeAgilityStat();
    expect(result.tier).toBe("Strider");
    expect(result.tierIndex).toBe(1);
  });

  it("returns Sprinter at exactly 4 sessions/week average", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({
        getAllAsync: jest.fn().mockResolvedValue([
          { week: "2026-08", session_count: 4 },
          { week: "2026-09", session_count: 4 },
        ]),
      })
    );
    const result = await computeAgilityStat();
    expect(result.tier).toBe("Sprinter");
    expect(result.tierIndex).toBe(2);
  });

  it("returns Ghost at 6+ sessions/week average", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({
        getAllAsync: jest.fn().mockResolvedValue([
          { week: "2026-07", session_count: 6 },
          { week: "2026-08", session_count: 7 },
          { week: "2026-09", session_count: 6 },
        ]),
      })
    );
    const result = await computeAgilityStat();
    expect(result.tier).toBe("Ghost");
    expect(result.tierIndex).toBe(3);
    expect(result.value).toBeCloseTo(19 / 3, 5);
  });

  it("averages only active weeks, not the full 8-week window", async () => {
    // 1 week with 5 sessions — avg should be 5, not 5/8
    mockGetDatabase.mockResolvedValue(
      dbWith({
        getAllAsync: jest.fn().mockResolvedValue([
          { week: "2026-09", session_count: 5 },
        ]),
      })
    );
    const result = await computeAgilityStat();
    expect(result.value).toBe(5);
    expect(result.tier).toBe("Sprinter");
  });

  it("passes start_time bound to query for 8-week window", async () => {
    const getAllAsync = jest.fn().mockResolvedValue([]);
    mockGetDatabase.mockResolvedValue(dbWith({ getAllAsync }));
    const before = Date.now() - 8 * 7 * 24 * 60 * 60 * 1000;
    await computeAgilityStat();
    const [, params] = getAllAsync.mock.calls[0] as [string, number[]];
    expect(params[0]).toBeGreaterThanOrEqual(before - 1000);
    expect(params[0]).toBeLessThanOrEqual(Date.now());
  });
});

// ── ENDURANCE ────────────────────────────────────────────────

describe("computeEnduranceStat", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns Spark for avg session < 30 min", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getFirstAsync: jest.fn().mockResolvedValue({ avg_minutes: 25 }) })
    );
    const result = await computeEnduranceStat();
    expect(result.tier).toBe("Spark");
    expect(result.tierIndex).toBe(0);
  });

  it("returns Ember at exactly 30 min", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getFirstAsync: jest.fn().mockResolvedValue({ avg_minutes: 30 }) })
    );
    const result = await computeEnduranceStat();
    expect(result.tier).toBe("Ember");
    expect(result.tierIndex).toBe(1);
  });

  it("returns Blaze at exactly 45 min", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getFirstAsync: jest.fn().mockResolvedValue({ avg_minutes: 45 }) })
    );
    const result = await computeEnduranceStat();
    expect(result.tier).toBe("Blaze");
    expect(result.tierIndex).toBe(2);
  });

  it("returns Blaze between 45 and 74 min", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getFirstAsync: jest.fn().mockResolvedValue({ avg_minutes: 60 }) })
    );
    const result = await computeEnduranceStat();
    expect(result.tier).toBe("Blaze");
  });

  it("returns Inferno at exactly 75 min", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getFirstAsync: jest.fn().mockResolvedValue({ avg_minutes: 75 }) })
    );
    const result = await computeEnduranceStat();
    expect(result.tier).toBe("Inferno");
    expect(result.tierIndex).toBe(3);
  });

  it("returns Inferno well above 75 min", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getFirstAsync: jest.fn().mockResolvedValue({ avg_minutes: 120 }) })
    );
    const result = await computeEnduranceStat();
    expect(result.tier).toBe("Inferno");
  });

  it("returns Spark with value 0 when no sessions have elapsed_time", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getFirstAsync: jest.fn().mockResolvedValue({ avg_minutes: null }) })
    );
    const result = await computeEnduranceStat();
    expect(result.value).toBe(0);
    expect(result.tier).toBe("Spark");
  });

  it("handles null row gracefully", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getFirstAsync: jest.fn().mockResolvedValue(null) })
    );
    const result = await computeEnduranceStat();
    expect(result.value).toBe(0);
    expect(result.tier).toBe("Spark");
  });
});

// ── FOCUS ────────────────────────────────────────────────────

describe("computeFocusCount", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 0 when no sessions exist", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getAllAsync: jest.fn().mockResolvedValue([]) })
    );
    const count = await computeFocusCount();
    expect(count).toBe(0);
  });

  it("returns 0 with only one session (no prior to compare)", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({
        getAllAsync: jest.fn().mockResolvedValue([
          { id: 1, vibe: 0, volume: 1000 },
        ]),
      })
    );
    const count = await computeFocusCount();
    expect(count).toBe(0);
  });

  it("counts a low-energy session at exactly 90% of previous volume", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({
        getAllAsync: jest.fn().mockResolvedValue([
          { id: 1, vibe: 1, volume: 1000 },
          { id: 2, vibe: 0, volume: 900 }, // exactly 90%
        ]),
      })
    );
    const count = await computeFocusCount();
    expect(count).toBe(1);
  });

  it("counts a low-energy session above 90% threshold", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({
        getAllAsync: jest.fn().mockResolvedValue([
          { id: 1, vibe: 1, volume: 1000 },
          { id: 2, vibe: 0, volume: 950 }, // 95%
        ]),
      })
    );
    const count = await computeFocusCount();
    expect(count).toBe(1);
  });

  it("does not count a low-energy session below 90% threshold", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({
        getAllAsync: jest.fn().mockResolvedValue([
          { id: 1, vibe: 1, volume: 1000 },
          { id: 2, vibe: 0, volume: 889 }, // 88.9%
        ]),
      })
    );
    const count = await computeFocusCount();
    expect(count).toBe(0);
  });

  it("does not count a normal-vibe session even above 90%", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({
        getAllAsync: jest.fn().mockResolvedValue([
          { id: 1, vibe: 1, volume: 1000 },
          { id: 2, vibe: 1, volume: 950 }, // normal vibe, not low
        ]),
      })
    );
    const count = await computeFocusCount();
    expect(count).toBe(0);
  });

  it("does not count when previous session had 0 volume", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({
        getAllAsync: jest.fn().mockResolvedValue([
          { id: 1, vibe: 1, volume: 0 },
          { id: 2, vibe: 0, volume: 500 },
        ]),
      })
    );
    const count = await computeFocusCount();
    expect(count).toBe(0);
  });

  it("counts multiple valid focus sessions across many sessions", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({
        getAllAsync: jest.fn().mockResolvedValue([
          { id: 1, vibe: 1, volume: 1000 },
          { id: 2, vibe: 0, volume: 950 }, // focus ✓
          { id: 3, vibe: 2, volume: 1200 },
          { id: 4, vibe: 0, volume: 1100 }, // focus ✓ (91.6% of 1200)
          { id: 5, vibe: 0, volume: 800 },  // no ✗ (66.6% of 1200)
        ]),
      })
    );
    const count = await computeFocusCount();
    expect(count).toBe(2);
  });
});

// ── FURY ─────────────────────────────────────────────────────

describe("computeFuryCount", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 0 when no crushing-it sessions exist", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getFirstAsync: jest.fn().mockResolvedValue({ count: 0 }) })
    );
    const count = await computeFuryCount();
    expect(count).toBe(0);
  });

  it("returns the correct count of crushing-it sessions", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getFirstAsync: jest.fn().mockResolvedValue({ count: 7 }) })
    );
    const count = await computeFuryCount();
    expect(count).toBe(7);
  });

  it("handles null row gracefully", async () => {
    mockGetDatabase.mockResolvedValue(
      dbWith({ getFirstAsync: jest.fn().mockResolvedValue(null) })
    );
    const count = await computeFuryCount();
    expect(count).toBe(0);
  });

  it("queries with vibe = 2 (crushing) and end_time IS NOT NULL", async () => {
    const getFirstAsync = jest.fn().mockResolvedValue({ count: 3 });
    mockGetDatabase.mockResolvedValue(dbWith({ getFirstAsync }));
    await computeFuryCount();
    expect(getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining("vibe = 2")
    );
    expect(getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining("end_time IS NOT NULL")
    );
  });
});

// ── getAllStats ───────────────────────────────────────────────

describe("getAllStats", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns all five stat values in a single call", async () => {
    const getFirstAsync = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes("SUM(sets.weight")) return Promise.resolve({ total_volume: 5_000 });
      if (sql.includes("AVG(elapsed_time")) return Promise.resolve({ avg_minutes: 40 });
      if (sql.includes("vibe = 2")) return Promise.resolve({ count: 3 });
      return Promise.resolve(null);
    });
    const getAllAsync = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes("session_count")) {
        return Promise.resolve([{ week: "2026-09", session_count: 3 }]);
      }
      // focus query
      return Promise.resolve([
        { id: 1, vibe: 1, volume: 1000 },
        { id: 2, vibe: 0, volume: 950 },
      ]);
    });

    mockGetDatabase.mockResolvedValue({ getFirstAsync, getAllAsync });

    const stats = await getAllStats();

    expect(stats.strength.tier).toBe("Iron Fist");
    expect(stats.agility.tier).toBe("Strider");
    expect(stats.endurance.tier).toBe("Ember");
    expect(stats.focusCount).toBe(1);
    expect(stats.furyCount).toBe(3);
  });

  it("returns the correct tierIndex for each stat", async () => {
    const getFirstAsync = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes("SUM(sets.weight")) return Promise.resolve({ total_volume: 75_000 }); // Mountain Hands [2]
      if (sql.includes("AVG(elapsed_time")) return Promise.resolve({ avg_minutes: 80 }); // Inferno [3]
      if (sql.includes("vibe = 2")) return Promise.resolve({ count: 0 });
      return Promise.resolve(null);
    });
    const getAllAsync = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes("session_count")) {
        return Promise.resolve([
          { week: "2026-08", session_count: 6 }, // Ghost [3]
        ]);
      }
      return Promise.resolve([]);
    });

    mockGetDatabase.mockResolvedValue({ getFirstAsync, getAllAsync });

    const stats = await getAllStats();

    expect(stats.strength.tierIndex).toBe(2); // Mountain Hands
    expect(stats.agility.tierIndex).toBe(3);  // Ghost
    expect(stats.endurance.tierIndex).toBe(3); // Inferno
  });
});
