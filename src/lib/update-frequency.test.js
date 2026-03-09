import { describe, expect, it } from "vitest";

import {
  buildUpdateFrequencyOutput,
  getDateContext,
  getMonthlyOptions,
  getOrdinalLabel,
  getSuggestionOptions,
  getYearlyOptions,
  parseDateInput,
  parseDateInputAsUtc,
  toUtcMidnightISOString,
} from "./update-frequency.js";

const getState = (overrides = {}) => ({
  count: undefined,
  dateContext: getDateContext(parseDateInput("2026-03-26")),
  endMode: "never",
  endingDate: "",
  frequency: "daily",
  interval: 1,
  monthlyMode: "byweekday",
  selectedWeekdays: ["TH"],
  suggestionValue: "FREQ=DAILY",
  yearlyMode: "bymonthdayYearly",
  ...overrides,
});

describe("update-frequency helpers", () => {
  it("renders the fourth ordinal correctly", () => {
    expect(getOrdinalLabel(4)).toBe("fourth");
  });

  it("builds suggestion labels from the selected start date", () => {
    const options = getSuggestionOptions(getDateContext(parseDateInput("2026-03-26")));

    expect(options.map((option) => option.label)).toEqual([
      "Daily",
      "Weekly on Thursday",
      "Monthly on the fourth Thursday",
      "Annually on March 26",
      "Custom…",
    ]);
  });

  it("builds monthly options with the corrected ordinal text", () => {
    const options = getMonthlyOptions(getDateContext(parseDateInput("2026-03-26")));

    expect(options[0]).toEqual({
      label: "Monthly on the fourth Thursday",
      value: "byweekday",
    });
  });

  it("builds yearly options with the corrected ordinal text", () => {
    const options = getYearlyOptions(getDateContext(parseDateInput("2026-03-26")));

    expect(options[1]).toEqual({
      label: "Annually on the fourth Thursday in March",
      value: "byweekdayYearly",
    });
  });

  it("keeps simple suggestion output contract-compatible", () => {
    const state = getState();
    const output = buildUpdateFrequencyOutput(state);

    expect(output.tag).toContain(
      `<podcast:updateFrequency dtstart="${toUtcMidnightISOString(state.dateContext.startDate)}"`,
    );
    expect(output.rrule).toBe("FREQ=DAILY");
    expect(output.description).toBe("Every day");
  });

  it("builds custom weekly schedules with BYDAY", () => {
    const output = buildUpdateFrequencyOutput(
      getState({
        frequency: "weekly",
        selectedWeekdays: ["MO", "TH"],
        suggestionValue: "custom",
      }),
    );

    expect(output.rrule).toContain("FREQ=WEEKLY");
    expect(output.rrule).toContain("BYDAY=MO,TH");
  });

  it("builds custom monthly schedules without leaking yearly parts", () => {
    const output = buildUpdateFrequencyOutput(
      getState({
        frequency: "monthly",
        monthlyMode: "bymonthday",
        suggestionValue: "custom",
      }),
    );

    expect(output.rrule).toContain("FREQ=MONTHLY");
    expect(output.rrule).toContain("BYMONTHDAY=26");
    expect(output.rrule).not.toContain("BYMONTH=");
  });

  it("builds custom yearly schedules with month and month-day", () => {
    const output = buildUpdateFrequencyOutput(
      getState({
        frequency: "yearly",
        suggestionValue: "custom",
        yearlyMode: "bymonthdayYearly",
      }),
    );

    expect(output.rrule).toContain("FREQ=YEARLY");
    expect(output.rrule).toContain("BYMONTH=3");
    expect(output.rrule).toContain("BYMONTHDAY=26");
  });

  it("uses the after radio state for COUNT", () => {
    const output = buildUpdateFrequencyOutput(
      getState({
        count: 3,
        endMode: "after",
        frequency: "weekly",
        selectedWeekdays: ["TH"],
        suggestionValue: "custom",
      }),
    );

    expect(output.rrule).toContain("COUNT=3");
  });

  it("uses UNTIL for custom end dates", () => {
    const state = getState({
      endMode: "until",
      endingDate: "2026-04-30",
      frequency: "weekly",
      suggestionValue: "custom",
    });
    const output = buildUpdateFrequencyOutput(state);

    expect(output.tag).toContain(`UNTIL=${parseDateInputAsUtc(state.endingDate).toISOString()}`);
  });

  it("serializes selected dates as UTC midnight without shifting the calendar day", () => {
    const output = buildUpdateFrequencyOutput(
      getState({
        suggestionValue: "custom",
      }),
    );

    expect(output.tag).toContain('dtstart="2026-03-26T00:00:00.000Z"');
  });

  it("supports complete mode without an rrule", () => {
    const output = buildUpdateFrequencyOutput(
      getState({
        endMode: "complete",
      }),
    );

    expect(output).toEqual({
      description: "Complete",
      rrule: null,
      tag: '<podcast:updateFrequency complete="true">Complete</podcast:updateFrequency>',
    });
  });
});
