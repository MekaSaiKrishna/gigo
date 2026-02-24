import {
  detectNewPR,
  getCoachingComparisonToPreviousSession,
  getExerciseWeeklyEstimated1RM,
  getExerciseWeeklyMax,
  getMonthlyPRSummary,
  getMonthlyVolume,
  getWeeklyVolume,
} from "../src/lib/analytics";

const mockGetDatabase = jest.fn();

jest.mock("../src/lib/database", () => ({
  getDatabase: () => mockGetDatabase(),
}));

describe("analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns weekly volume in chronological order", async () => {
    const getAllAsync = jest.fn().mockResolvedValue([
      { week: "2026-09", total_volume: 4500 },
      { week: "2026-08", total_volume: 3000 },
    ]);

    mockGetDatabase.mockResolvedValue({ getAllAsync });

    const result = await getWeeklyVolume(2);

    expect(getAllAsync).toHaveBeenCalledWith(expect.stringContaining("GROUP BY week"), [2]);
    expect(result).toEqual([
      { week: "2026-08", total_volume: 3000 },
      { week: "2026-09", total_volume: 4500 },
    ]);
  });

  it("returns monthly volume in chronological order", async () => {
    const getAllAsync = jest.fn().mockResolvedValue([
      { month: "2026-03", total_volume: 9000 },
      { month: "2026-02", total_volume: 7000 },
    ]);

    mockGetDatabase.mockResolvedValue({ getAllAsync });

    const result = await getMonthlyVolume(2);

    expect(getAllAsync).toHaveBeenCalledWith(expect.stringContaining("GROUP BY month"), [2]);
    expect(result).toEqual([
      { month: "2026-02", total_volume: 7000 },
      { month: "2026-03", total_volume: 9000 },
    ]);
  });

  it("queries weekly max for a specific exercise", async () => {
    const rows = [
      { week: "2026-08", max_weight: 80 },
      { week: "2026-09", max_weight: 85 },
    ];
    const getAllAsync = jest.fn().mockResolvedValue(rows);

    mockGetDatabase.mockResolvedValue({ getAllAsync });

    const result = await getExerciseWeeklyMax(12);

    expect(getAllAsync).toHaveBeenCalledWith(expect.stringContaining("MAX(sets.weight)"), [12]);
    expect(result).toEqual(rows);
  });

  it("uses Epley formula for weekly estimated 1RM", async () => {
    const rows = [{ week: "2026-09", max_estimated_1rm: 120 }];
    const getAllAsync = jest.fn().mockResolvedValue(rows);

    mockGetDatabase.mockResolvedValue({ getAllAsync });

    const result = await getExerciseWeeklyEstimated1RM(5);

    expect(getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("MAX(sets.weight * (1 + sets.reps / 30.0))"),
      [5]
    );
    expect(result).toEqual(rows);
  });

  it("detects all PR types for a session set", async () => {
    const getAllAsync = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes("WHERE session_id = ?")) {
        return Promise.resolve([
          { exercise_id: 3, weight: 100, reps: 6, set_volume: 600, estimated_1rm: 120 },
        ]);
      }
      return Promise.resolve([{ exercise_id: 3, max_weight: 95, max_volume: 550, max_1rm: 118 }]);
    });

    mockGetDatabase.mockResolvedValue({ getAllAsync });

    const prs = await detectNewPR(10);

    expect(prs).toEqual([
      { exerciseId: 3, type: "1rm", value: 120 },
      { exerciseId: 3, type: "volume", value: 600 },
      { exerciseId: 3, type: "weight", value: 100 },
    ]);
  });

  it("deduplicates PR events to highest value per exercise and type", async () => {
    const getAllAsync = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes("WHERE session_id = ?")) {
        return Promise.resolve([
          { exercise_id: 1, weight: 80, reps: 8, set_volume: 640, estimated_1rm: 101.3333 },
          { exercise_id: 1, weight: 85, reps: 6, set_volume: 510, estimated_1rm: 102 },
        ]);
      }
      return Promise.resolve([{ exercise_id: 1, max_weight: 70, max_volume: 500, max_1rm: 99 }]);
    });

    mockGetDatabase.mockResolvedValue({ getAllAsync });

    const prs = await detectNewPR(22);

    const weightPR = prs.find((entry) => entry.type === "weight");
    const volumePR = prs.find((entry) => entry.type === "volume");
    const oneRmPR = prs.find((entry) => entry.type === "1rm");

    expect(weightPR?.value).toBe(85);
    expect(volumePR?.value).toBe(640);
    expect(oneRmPR?.value).toBeCloseTo(102, 5);
  });

  it("returns empty PR list when session has no sets", async () => {
    const getAllAsync = jest.fn().mockResolvedValue([]);
    mockGetDatabase.mockResolvedValue({ getAllAsync });

    const prs = await detectNewPR(99);

    expect(prs).toEqual([]);
    expect(getAllAsync).toHaveBeenCalledTimes(1);
  });

  it("does not flag PR when value matches historical max", async () => {
    const getAllAsync = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes("WHERE session_id = ?")) {
        return Promise.resolve([
          { exercise_id: 4, weight: 90, reps: 5, set_volume: 450, estimated_1rm: 105 },
        ]);
      }
      return Promise.resolve([{ exercise_id: 4, max_weight: 90, max_volume: 450, max_1rm: 105 }]);
    });

    mockGetDatabase.mockResolvedValue({ getAllAsync });

    const prs = await detectNewPR(8);

    expect(prs).toEqual([]);
  });

  it("returns legendary_start when there is no previous completed session", async () => {
    const getFirstAsync = jest.fn().mockResolvedValue(null);
    mockGetDatabase.mockResolvedValue({ getFirstAsync });

    const result = await getCoachingComparisonToPreviousSession(1000, "normal");

    expect(result).toEqual({
      category: "legendary_start",
      affirmation: "Legendary start. The mountain just met you. 🏔️",
      previousVolume: null,
      isOutdone: false,
    });
  });

  it("returns outdone when current volume is over previous volume by 5%", async () => {
    const getFirstAsync = jest.fn().mockResolvedValue({ total_volume: 1000 });
    mockGetDatabase.mockResolvedValue({ getFirstAsync });

    const result = await getCoachingComparisonToPreviousSession(1051, "normal");

    expect(result.category).toBe("outdone");
    expect(result.isOutdone).toBe(true);
    expect(result.previousVolume).toBe(1000);
    expect(result.affirmation).toContain("You outdid yourself");
  });

  it("returns consistent for >= 90% of previous volume", async () => {
    const getFirstAsync = jest.fn().mockResolvedValue({ total_volume: 1000 });
    mockGetDatabase.mockResolvedValue({ getFirstAsync });

    const result = await getCoachingComparisonToPreviousSession(920, "normal");

    expect(result.category).toBe("consistent");
    expect(result.isOutdone).toBe(false);
    expect(result.affirmation).toContain("staying consistent");
  });

  it("returns encouragement below 90% of previous volume", async () => {
    const getFirstAsync = jest.fn().mockResolvedValue({ total_volume: 1000 });
    mockGetDatabase.mockResolvedValue({ getFirstAsync });

    const result = await getCoachingComparisonToPreviousSession(899, "normal");

    expect(result.category).toBe("encouragement");
    expect(result.isOutdone).toBe(false);
    expect(result.affirmation).toContain("Every rep counts");
  });

  it("adds low-energy discipline message when low vibe stays within 90%", async () => {
    const getFirstAsync = jest.fn().mockResolvedValue({ total_volume: 1000 });
    mockGetDatabase.mockResolvedValue({ getFirstAsync });

    const result = await getCoachingComparisonToPreviousSession(950, "low");

    expect(result.category).toBe("consistent");
    expect(result.affirmation).toContain("Elite discipline today.");
  });
});

describe("getMonthlyPRSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty array when no sessions exist in the month", async () => {
      const getAllAsync = jest.fn().mockResolvedValue([]);
      mockGetDatabase.mockResolvedValue({ getAllAsync });

      const result = await getMonthlyPRSummary(new Date("2026-02-01").getTime());

      expect(result).toEqual([]);
      expect(getAllAsync).toHaveBeenCalledTimes(1);
    });

    it("attaches sessionId to each PR event", async () => {
      const getAllAsync = jest.fn().mockImplementation((sql: string) => {
        if (sql.includes("FROM sessions")) {
          return Promise.resolve([{ id: 42 }]);
        }
        if (sql.includes("WHERE session_id = ?")) {
          return Promise.resolve([
            { exercise_id: 7, weight: 100, reps: 5, set_volume: 500, estimated_1rm: 116.67 },
          ]);
        }
        return Promise.resolve([{ exercise_id: 7, max_weight: 90, max_volume: 450, max_1rm: 110 }]);
      });

      mockGetDatabase.mockResolvedValue({ getAllAsync });

      const result = await getMonthlyPRSummary(new Date("2026-02-15").getTime());

      expect(result.length).toBeGreaterThan(0);
      for (const pr of result) {
        expect(pr.sessionId).toBe(42);
        expect(["weight", "volume", "1rm"]).toContain(pr.type);
      }
    });

    it("collects PRs across multiple sessions in the month", async () => {
      const getAllAsync = jest.fn().mockImplementation((sql: string) => {
        if (sql.includes("FROM sessions")) {
          return Promise.resolve([{ id: 10 }, { id: 11 }]);
        }
        if (sql.includes("WHERE session_id = ?")) {
          return Promise.resolve([
            { exercise_id: 1, weight: 80, reps: 5, set_volume: 400, estimated_1rm: 93.33 },
          ]);
        }
        return Promise.resolve([{ exercise_id: 1, max_weight: 70, max_volume: 350, max_1rm: 82 }]);
      });

      mockGetDatabase.mockResolvedValue({ getAllAsync });

      const result = await getMonthlyPRSummary(new Date("2026-02-20").getTime());

      const sessionIds = result.map((pr) => pr.sessionId);
      expect(sessionIds).toContain(10);
      expect(sessionIds).toContain(11);
    });

    it("queries only sessions within the current calendar month", async () => {
      const getAllAsync = jest.fn().mockResolvedValue([]);
      mockGetDatabase.mockResolvedValue({ getAllAsync });

      const refTime = new Date("2026-02-15").getTime();
      await getMonthlyPRSummary(refTime);

      const call = getAllAsync.mock.calls[0];
      const [, params] = call as [string, number[]];
      const monthStart = new Date(params[0]);
      const monthEnd = new Date(params[1]);
      expect(monthStart.getMonth()).toBe(1);
      expect(monthStart.getDate()).toBe(1);
      expect(monthEnd.getMonth()).toBe(2);
    });
  });
