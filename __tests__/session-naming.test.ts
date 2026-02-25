import fs from "fs";
import path from "path";
import { buildDefaultWorkoutName } from "../src/lib/database";

describe("session naming defaults", () => {
  it("builds Workout - 1 for first workout", () => {
    expect(buildDefaultWorkoutName(1)).toBe("Workout - 1");
  });

  it("floors decimals and keeps positive integers", () => {
    expect(buildDefaultWorkoutName(4.8)).toBe("Workout - 4");
  });

  it("clamps non-positive numbers to Workout - 1", () => {
    expect(buildDefaultWorkoutName(0)).toBe("Workout - 1");
    expect(buildDefaultWorkoutName(-10)).toBe("Workout - 1");
  });
});

describe("database naming query guards", () => {
  const databaseFile = path.join(process.cwd(), "src/lib/database.ts");
  const source = fs.readFileSync(databaseFile, "utf8");

  it("uses Workout - format in SQL fallback display names", () => {
    expect(source).toContain("'Workout - ' || r.workout_number");
  });

  it("counts only completed sessions that have sets for workout numbering", () => {
    expect(source).toContain("EXISTS (SELECT 1 FROM sets st2 WHERE st2.session_id = s2.id)");
    expect(source).toContain("EXISTS (SELECT 1 FROM sets st WHERE st.session_id = s.id)");
  });
});

