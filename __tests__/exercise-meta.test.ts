import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ORDER, EXERCISE_DEMO_GIFS } from "../src/data/exercise-meta";
import { EXERCISE_SEED } from "../src/data/exercises";

describe("Exercise Meta", () => {
  it("has labels for every muscle group in the order list", () => {
    for (const mg of MUSCLE_GROUP_ORDER) {
      expect(MUSCLE_GROUP_LABELS[mg]).toBeTruthy();
    }
  });

  it("covers all 10 muscle groups", () => {
    expect(MUSCLE_GROUP_ORDER).toHaveLength(10);
  });

  it("has a demo GIF URL for every seeded exercise", () => {
    for (const exercise of EXERCISE_SEED) {
      expect(EXERCISE_DEMO_GIFS[exercise.name]).toBeTruthy();
    }
  });

  it("all GIF URLs are valid https URLs", () => {
    for (const [name, url] of Object.entries(EXERCISE_DEMO_GIFS)) {
      expect(url).toMatch(/^https:\/\//);
    }
  });
});
