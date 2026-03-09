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

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const highlightXmlTag = (tag) => {
  const isClosing = tag.startsWith("</");
  const isSelfClosing = tag.endsWith("/>");
  const body = tag.slice(isClosing ? 2 : 1, isSelfClosing ? -2 : -1).trim();

  if (!body) {
    return `<span class="xml-punct">${escapeHtml(tag)}</span>`;
  }

  const [tagName, ...attributeParts] = body.split(/\s+/);
  const attributes = attributeParts
    .map((attributePart) => {
      const match = attributePart.match(/^([\w:-]+)=(".*")$/);
      if (!match) {
        return escapeHtml(attributePart);
      }

      const [, attributeName, attributeValue] = match;
      return ` <span class="xml-attr">${escapeHtml(attributeName)}</span><span class="xml-punct">=</span><span class="xml-value">${escapeHtml(attributeValue)}</span>`;
    })
    .join("");
  const opening = `<span class="xml-punct">&lt;${isClosing ? "/" : ""}</span>`;
  const closing = `<span class="xml-punct">${isSelfClosing ? "/&gt;" : "&gt;"}</span>`;

  return `${opening}<span class="xml-tag">${escapeHtml(tagName)}</span>${attributes}${closing}`;
};

const highlightXml = (value) => {
  const tokens = value.match(/<[^>]+>|[^<]+/g) ?? [];

  return tokens
    .map((token) =>
      token.startsWith("<")
        ? highlightXmlTag(token)
        : `<span class="xml-text">${escapeHtml(token)}</span>`,
    )
    .join("");
};

const getElements = (doc) => ({
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
});

const updateMin = (elements) => {
  elements.endingDate.min = elements.dtstart.value;
};

const updateEpisodeLabel = (elements) => {
  elements.episodes.textContent = Number(elements.count.value) === 1 ? "episode" : "episodes";
};

const updateIntervalLabels = (elements) => {
  const isSingular = Number(elements.interval.value) === 1;

  Array.from(elements.frequency.options).forEach((option) => {
    const label = FREQUENCY_LABELS[option.value];
    option.textContent = isSingular ? label : `${label}s`;
  });
};

const updateWeekday = (elements, doc, dateContext) => {
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

const updateMonthly = (elements, dateContext) => {
  setSelectOptions(elements.monthly, getMonthlyOptions(dateContext), elements.monthly.value);
};

const updateYearly = (elements, dateContext) => {
  setSelectOptions(elements.yearly, getYearlyOptions(dateContext), elements.yearly.value);
};

const updateFrequencyFieldsets = (elements, doc, dateContext) => {
  makeEachInvisible(elements.fieldsets);

  switch (elements.frequency.value) {
    case "weekly":
      updateWeekday(elements, doc, dateContext);
      makeVisible(elements.weeklyFieldset);
      break;
    case "monthly":
      updateMonthly(elements, dateContext);
      makeVisible(elements.monthlyFieldset);
      break;
    case "yearly":
      updateYearly(elements, dateContext);
      makeVisible(elements.yearlyFieldset);
      break;
    default:
      break;
  }
};

const updateSuggestions = (elements, dateContext) => {
  const options = getSuggestionOptions(dateContext);
  const selectedValue = getMatchingSuggestionValue(elements.suggestions.value, options);

  setSelectOptions(elements.suggestions, options, selectedValue);
  elements.recurringSimple.classList.remove("opacity-50", "pointer-events-none");
};

const updateCustomVisibility = (elements, doc, dateContext) => {
  if (elements.suggestions.value === "custom") {
    makeVisible(elements.intervalFrequency);
    makeVisible(elements.ending);
    updateFrequencyFieldsets(elements, doc, dateContext);
    return;
  }

  makeInvisible(elements.intervalFrequency);
  makeInvisible(elements.ending);
  makeEachInvisible(elements.fieldsets);
};

const getEndMode = (elements) => {
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

const getSelectedWeekdays = (elements) =>
  Array.from(elements.weekdays)
    .filter((weekdayInput) => weekdayInput.checked)
    .map((weekdayInput) => weekdayInput.value);

const getFormState = (elements, dateContext) => ({
  count: Number(elements.count.value) || undefined,
  dateContext,
  endMode: getEndMode(elements),
  endingDate: elements.endingDate.value,
  frequency: elements.frequency.value,
  interval: Number(elements.interval.value) || 1,
  monthlyMode: elements.monthly.value,
  selectedWeekdays: getSelectedWeekdays(elements),
  suggestionValue: elements.suggestions.value,
  yearlyMode: elements.yearly.value,
});

const updateCode = (elements, dateContext) => {
  const output = buildUpdateFrequencyOutput(getFormState(elements, dateContext));
  elements.code.innerHTML = highlightXml(output.tag);
};

export const initializeUpdateFrequencyForm = ({ doc = document, today = new Date() } = {}) => {
  const form = doc.querySelector("form");
  if (!form) {
    return null;
  }

  const elements = getElements(doc);

  if (!elements.dtstart.value) {
    elements.dtstart.value = toDateInputValue(today);
  }

  let dateContext = getDateContext(parseDateInput(elements.dtstart.value));

  const syncDateContext = () => {
    dateContext = getDateContext(parseDateInput(elements.dtstart.value));
  };

  const refreshForm = () => {
    updateSuggestions(elements, dateContext);
    updateCustomVisibility(elements, doc, dateContext);
    updateMin(elements);
    updateCode(elements, dateContext);
  };

  elements.dtstart.addEventListener("change", () => {
    syncDateContext();
    refreshForm();
  });

  elements.suggestions.addEventListener("change", () => {
    updateCustomVisibility(elements, doc, dateContext);
    updateCode(elements, dateContext);
  });

  elements.interval.addEventListener("change", () => {
    updateIntervalLabels(elements);
    updateCode(elements, dateContext);
  });

  elements.frequency.addEventListener("change", () => {
    updateFrequencyFieldsets(elements, doc, dateContext);
    updateCode(elements, dateContext);
  });

  elements.weekdays.forEach((weekdayInput) => {
    weekdayInput.addEventListener("change", () => {
      updateCode(elements, dateContext);
    });
  });

  elements.monthly.addEventListener("change", () => {
    updateCode(elements, dateContext);
  });

  elements.yearly.addEventListener("change", () => {
    updateCode(elements, dateContext);
  });

  elements.endingNever.addEventListener("change", () => {
    elements.endingDate.value = "";
    elements.count.value = "";
    updateEpisodeLabel(elements);
    updateCode(elements, dateContext);
  });

  elements.endingDate.addEventListener("change", () => {
    elements.until.checked = true;
    elements.count.value = "";
    updateEpisodeLabel(elements);
    updateCode(elements, dateContext);
  });

  elements.count.addEventListener("change", () => {
    elements.after.checked = true;
    elements.endingDate.value = "";
    updateEpisodeLabel(elements);
    updateCode(elements, dateContext);
  });

  elements.complete.addEventListener("change", () => {
    elements.endingDate.value = "";
    elements.count.value = "";
    updateEpisodeLabel(elements);
    updateCode(elements, dateContext);
  });

  refreshForm();
  updateIntervalLabels(elements);
  updateEpisodeLabel(elements);

  return {
    elements,
    getDateContext: () => dateContext,
    updateCode: () => updateCode(elements, dateContext),
  };
};

if (typeof document !== "undefined" && document.querySelector("form")) {
  initializeUpdateFrequencyForm();
}
