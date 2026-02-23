import { VIBE_MULTIPLIERS } from "../src/types";

describe("VIBE_MULTIPLIERS", () => {
  it("low vibe reduces sets and reps", () => {
    expect(VIBE_MULTIPLIERS.low.sets).toBeLessThan(1);
    expect(VIBE_MULTIPLIERS.low.reps).toBeLessThan(1);
  });

  it("normal vibe is baseline (1x)", () => {
    expect(VIBE_MULTIPLIERS.normal.sets).toBe(1);
    expect(VIBE_MULTIPLIERS.normal.reps).toBe(1);
  });

  it("crushing vibe increases sets and reps", () => {
    expect(VIBE_MULTIPLIERS.crushing.sets).toBeGreaterThan(1);
    expect(VIBE_MULTIPLIERS.crushing.reps).toBeGreaterThan(1);
  });
});
