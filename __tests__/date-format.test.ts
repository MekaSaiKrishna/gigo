import { formatMonthLabel, formatWeekLabel } from "../src/utils/date-format";

describe("date-format utils", () => {
  it("formats week label to month + year", () => {
    expect(formatWeekLabel("2026-08")).toBe("Feb 2026");
  });

  it("formats month label to month + year", () => {
    expect(formatMonthLabel("2026-02")).toBe("Feb 2026");
  });

  it("returns original value for invalid labels", () => {
    expect(formatWeekLabel("bad-input")).toBe("bad-input");
    expect(formatMonthLabel("2026-99")).toBe("2026-99");
  });
});
