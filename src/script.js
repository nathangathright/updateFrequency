import {
  buildUpdateFrequencyOutput,
  getDateContext,
  getMonthlyOptions,
  getSuggestionOptions,
  getYearlyOptions,
  parseDateInput,
  toDateInputValue,
} from "./lib/update-frequency.js";

const FREQUENCY_LABELS = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

const makeVisible = (element) => {
  element.classList.remove("hidden");
};

const makeInvisible = (element) => {
  element.classList.add("hidden");
};

const makeEachInvisible = (elements) => {
  elements.forEach((element) => {
    makeInvisible(element);
  });
};

const setSelectOptions = (select, options, selectedValue) => {
  select.replaceChildren(
    ...options.map(({ label, value }) => {
      const option = select.ownerDocument.createElement("option");
      option.value = value;
      option.textContent = label;
      return option;
    }),
  );

  const nextValue = options.some((option) => option.value === selectedValue)
    ? selectedValue
    : options[0]?.value;

  if (nextValue) {
    select.value = nextValue;
  }
};

const getMatchingSuggestionValue = (currentValue, options) => {
  if (!currentValue) {
    return options[0]?.value;
  }

  if (currentValue === "custom") {
    return "custom";
  }

  if (options.some((option) => option.value === currentValue)) {
    return currentValue;
  }

  const prefix = currentValue.split(";")[0];

  return (
    options.find((option) => option.value === prefix || option.value.startsWith(`${prefix};`))?.value ??
    options[0]?.value
  );
};

export const initializeUpdateFrequencyForm = ({ doc = document, today = new Date() } = {}) => {
  const form = doc.querySelector("form");
  if (!form) {
    return null;
  }

  const elements = {
    code: doc.querySelector("pre code"),
    complete: doc.querySelector("#complete"),
    count: doc.querySelector("#count"),
    dtstart: doc.querySelector("#dtstart"),
    ending: doc.querySelector("#ending"),
    endingDate: doc.querySelector("#ending-date"),
    endingNever: doc.querySelector("#never"),
    fieldsets: doc.querySelectorAll("fieldset[id*=freq-]"),
    frequency: doc.querySelector("#frequency"),
    interval: doc.querySelector("#interval"),
    intervalFrequency: doc.querySelector("#interval-frequency"),
    monthly: doc.querySelector("#monthly"),
    recurringSimple: doc.querySelector("#recurring-simple"),
    suggestions: doc.querySelector("#suggestions"),
    until: doc.querySelector("#until"),
    after: doc.querySelector("#after"),
    yearly: doc.querySelector("#yearly"),
    weekdays: doc.querySelectorAll("#freq-weekly input"),
    weeklyFieldset: doc.querySelector("#freq-weekly"),
    monthlyFieldset: doc.querySelector("#freq-monthly"),
    yearlyFieldset: doc.querySelector("#freq-yearly"),
    episodes: doc.querySelector("#episodes"),
  };

  if (!elements.dtstart.value) {
    elements.dtstart.value = toDateInputValue(today);
  }

  let dateContext = getDateContext(parseDateInput(elements.dtstart.value));

  const syncDateContext = () => {
    dateContext = getDateContext(parseDateInput(elements.dtstart.value));
  };

  const updateMin = () => {
    elements.endingDate.min = elements.dtstart.value;
  };

  const updateEpisodeLabel = () => {
    elements.episodes.textContent = Number(elements.count.value) === 1 ? "episode" : "episodes";
  };

  const updateIntervalLabels = () => {
    const isSingular = Number(elements.interval.value) === 1;

    Array.from(elements.frequency.options).forEach((option) => {
      const label = FREQUENCY_LABELS[option.value];
      option.textContent = isSingular ? label : `${label}s`;
    });
  };

  const updateWeekday = () => {
    elements.weekdays.forEach((weekdayInput) => {
      weekdayInput.checked = false;
      weekdayInput.disabled = false;
    });

    const startingWeekday = doc.querySelector(`#freq-weekly input[value="${dateContext.dayabbr}"]`);
    if (startingWeekday) {
      startingWeekday.checked = true;
      startingWeekday.disabled = true;
    }
  };

  const updateMonthly = () => {
    const options = getMonthlyOptions(dateContext);
    setSelectOptions(elements.monthly, options, elements.monthly.value);
  };

  const updateYearly = () => {
    const options = getYearlyOptions(dateContext);
    setSelectOptions(elements.yearly, options, elements.yearly.value);
  };

  const updateFrequency = () => {
    makeEachInvisible(elements.fieldsets);

    switch (elements.frequency.value) {
      case "weekly":
        updateWeekday();
        makeVisible(elements.weeklyFieldset);
        break;
      case "monthly":
        updateMonthly();
        makeVisible(elements.monthlyFieldset);
        break;
      case "yearly":
        updateYearly();
        makeVisible(elements.yearlyFieldset);
        break;
      default:
        break;
    }
  };

  const updateSuggestions = () => {
    const options = getSuggestionOptions(dateContext);
    const selectedValue = getMatchingSuggestionValue(elements.suggestions.value, options);

    setSelectOptions(elements.suggestions, options, selectedValue);
    elements.recurringSimple.classList.remove("opacity-50", "pointer-events-none");
  };

  const updateCustomVisibility = () => {
    const isCustom = elements.suggestions.value === "custom";

    if (isCustom) {
      makeVisible(elements.intervalFrequency);
      makeVisible(elements.ending);
      updateFrequency();
      return;
    }

    makeInvisible(elements.intervalFrequency);
    makeInvisible(elements.ending);
    makeEachInvisible(elements.fieldsets);
  };

  const getEndMode = () => {
    if (elements.complete.checked) {
      return "complete";
    }

    if (elements.until.checked && elements.endingDate.value) {
      return "until";
    }

    if (elements.after.checked && elements.count.value) {
      return "after";
    }

    return "never";
  };

  const getSelectedWeekdays = () =>
    Array.from(elements.weekdays)
      .filter((weekdayInput) => weekdayInput.checked)
      .map((weekdayInput) => weekdayInput.value);

  const updateCode = () => {
    const output = buildUpdateFrequencyOutput({
      count: Number(elements.count.value) || undefined,
      dateContext,
      endMode: getEndMode(),
      endingDate: elements.endingDate.value,
      frequency: elements.frequency.value,
      interval: Number(elements.interval.value) || 1,
      monthlyMode: elements.monthly.value,
      selectedWeekdays: getSelectedWeekdays(),
      suggestionValue: elements.suggestions.value,
      yearlyMode: elements.yearly.value,
    });

    elements.code.textContent = output.tag;
  };

  elements.dtstart.addEventListener("change", () => {
    syncDateContext();
    updateSuggestions();
    updateCustomVisibility();
    updateMin();
    updateCode();
  });

  elements.suggestions.addEventListener("change", () => {
    updateCustomVisibility();
    updateCode();
  });

  elements.interval.addEventListener("change", () => {
    updateIntervalLabels();
    updateCode();
  });

  elements.frequency.addEventListener("change", () => {
    updateFrequency();
    updateCode();
  });

  elements.weekdays.forEach((weekdayInput) => {
    weekdayInput.addEventListener("change", updateCode);
  });

  elements.monthly.addEventListener("change", updateCode);
  elements.yearly.addEventListener("change", updateCode);

  elements.endingNever.addEventListener("change", () => {
    elements.endingDate.value = "";
    elements.count.value = "";
    updateEpisodeLabel();
    updateCode();
  });

  elements.endingDate.addEventListener("change", () => {
    elements.until.checked = true;
    elements.count.value = "";
    updateEpisodeLabel();
    updateCode();
  });

  elements.count.addEventListener("change", () => {
    elements.after.checked = true;
    elements.endingDate.value = "";
    updateEpisodeLabel();
    updateCode();
  });

  elements.complete.addEventListener("change", () => {
    elements.endingDate.value = "";
    elements.count.value = "";
    updateEpisodeLabel();
    updateCode();
  });

  updateSuggestions();
  updateCustomVisibility();
  updateIntervalLabels();
  updateMin();
  updateEpisodeLabel();
  updateCode();

  return {
    elements,
    getDateContext: () => dateContext,
    updateCode,
  };
};

if (typeof document !== "undefined" && document.querySelector("form")) {
  initializeUpdateFrequencyForm();
}
