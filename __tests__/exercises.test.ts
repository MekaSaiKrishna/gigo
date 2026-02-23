import { EXERCISE_SEED } from "../src/data/exercises";

describe("Exercise Seed Data", () => {
  it("contains exactly 42 exercises", () => {
    expect(EXERCISE_SEED).toHaveLength(42);
  });

  it("every exercise has required fields", () => {
    for (const exercise of EXERCISE_SEED) {
      expect(exercise.name).toBeTruthy();
      expect(exercise.muscle_group).toBeTruthy();
      expect(exercise.category).toBeTruthy();
    }
  });

  it("covers all muscle groups", () => {
    const groups = new Set(EXERCISE_SEED.map((e) => e.muscle_group));
    expect(groups).toContain("chest");
    expect(groups).toContain("back");
    expect(groups).toContain("shoulders");
    expect(groups).toContain("biceps");
    expect(groups).toContain("triceps");
    expect(groups).toContain("legs");
    expect(groups).toContain("core");
    expect(groups).toContain("glutes");
    expect(groups).toContain("forearms");
    expect(groups).toContain("full_body");
  });

  it("has no duplicate exercise names", () => {
    const names = EXERCISE_SEED.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
