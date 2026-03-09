// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import { initializeUpdateFrequencyForm } from "./script.js";

const render = () => {
  document.body.innerHTML = `
    <form class="w-full max-w-lg flex flex-col gap-4">
      <fieldset class="flex-1">
        <input type="date" name="dtstart" id="dtstart">
      </fieldset>
      <fieldset id="recurring-simple" class="flex-1 opacity-50 pointer-events-none">
        <select id="suggestions" name="suggestions"></select>
      </fieldset>
      <fieldset id="interval-frequency" class="hidden">
        <input type="number" min="1" name="interval" id="interval" value="1">
        <select id="frequency" name="frequency">
          <option value="daily">day</option>
          <option value="weekly">week</option>
          <option value="monthly">month</option>
          <option value="yearly">year</option>
        </select>
      </fieldset>
      <fieldset id="freq-weekly" class="hidden">
        <input type="checkbox" name="byweekday" value="SU">
        <input type="checkbox" name="byweekday" value="MO">
        <input type="checkbox" name="byweekday" value="TU">
        <input type="checkbox" name="byweekday" value="WE">
        <input type="checkbox" name="byweekday" value="TH">
        <input type="checkbox" name="byweekday" value="FR">
        <input type="checkbox" name="byweekday" value="SA">
      </fieldset>
      <fieldset id="freq-monthly" class="hidden">
        <select id="monthly" name="monthly"></select>
      </fieldset>
      <fieldset id="freq-yearly" class="hidden">
        <select id="yearly" name="yearly"></select>
      </fieldset>
      <fieldset id="ending" class="hidden">
        <input id="never" name="ends" type="radio" checked>
        <input id="until" name="ends" type="radio">
        <input type="date" name="ending-date" id="ending-date">
        <input id="after" name="ends" type="radio">
        <input type="number" min="1" name="count" id="count" placeholder="1">
        <span id="episodes">episode</span>
        <input id="complete" name="ends" type="radio">
      </fieldset>
      <pre><code></code></pre>
    </form>
  `;
};

describe("initializeUpdateFrequencyForm", () => {
  beforeEach(() => {
    render();
  });

  it("sets the initial date and generated tag", () => {
    initializeUpdateFrequencyForm({ today: new Date("2026-03-26T12:00:00.000Z") });

    expect(document.querySelector("#dtstart").value).toBe("2026-03-26");
    expect(document.querySelector("#suggestions").options).toHaveLength(5);
    expect(document.querySelector("pre code").textContent).toContain("<podcast:updateFrequency");
  });

  it("updates derived labels and custom output when the start date changes", () => {
    initializeUpdateFrequencyForm({ today: new Date("2026-03-26T12:00:00.000Z") });

    const suggestions = document.querySelector("#suggestions");
    const dtstart = document.querySelector("#dtstart");
    const frequency = document.querySelector("#frequency");
    const interval = document.querySelector("#interval");
    const code = document.querySelector("pre code");

    suggestions.value = "custom";
    suggestions.dispatchEvent(new Event("change"));

    frequency.value = "monthly";
    frequency.dispatchEvent(new Event("change"));

    interval.value = "2";
    interval.dispatchEvent(new Event("change"));

    dtstart.value = "2026-03-05";
    dtstart.dispatchEvent(new Event("change"));

    expect(Array.from(suggestions.options)[2].textContent).toBe("Monthly on the first Thursday");
    expect(Array.from(frequency.options)[0].textContent).toBe("days");
    expect(code.textContent).toContain("FREQ=MONTHLY");
    expect(code.textContent).toContain("INTERVAL=2");
  });

  it("uses the after radio path when the count changes", () => {
    initializeUpdateFrequencyForm({ today: new Date("2026-03-26T12:00:00.000Z") });

    const suggestions = document.querySelector("#suggestions");
    const frequency = document.querySelector("#frequency");
    const count = document.querySelector("#count");
    const code = document.querySelector("pre code");

    suggestions.value = "custom";
    suggestions.dispatchEvent(new Event("change"));

    frequency.value = "weekly";
    frequency.dispatchEvent(new Event("change"));

    count.value = "4";
    count.dispatchEvent(new Event("change"));

    expect(document.querySelector("#after").checked).toBe(true);
    expect(document.querySelector("#episodes").textContent).toBe("episodes");
    expect(code.textContent).toContain("COUNT=4");
  });
});
