import * as rrulePkg from "rrule";

const { RRule } = rrulePkg.RRule ? rrulePkg : Reflect.get(rrulePkg, "default");

const WEEKDAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const WEEKDAY_RULES = {
  MO: RRule.MO,
  TU: RRule.TU,
  WE: RRule.WE,
  TH: RRule.TH,
  FR: RRule.FR,
  SA: RRule.SA,
  SU: RRule.SU,
};

const FREQUENCIES = {
  daily: RRule.DAILY,
  weekly: RRule.WEEKLY,
  monthly: RRule.MONTHLY,
  yearly: RRule.YEARLY,
};

export const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

export const getOrdinalLabel = (value) => {
  switch (value) {
    case 1:
      return "first";
    case 2:
      return "second";
    case 3:
      return "third";
    case 4:
      return "fourth";
    default:
      return "fifth";
  }
};

export const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const parseDateInput = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const toUtcMidnightISOString = (date) =>
  new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();

export const parseDateInputAsUtc = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const getDateContext = (date) => {
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return {
    startDate,
    monthIndex: startDate.getMonth(),
    dayOfMonth: startDate.getDate(),
    weekday: startDate.toLocaleDateString(undefined, { weekday: "long" }),
    monthName: startDate.toLocaleDateString(undefined, { month: "long" }),
    calendarDateLabel: startDate.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
    }),
    nth: Math.floor((startDate.getDate() - 1) / 7) + 1,
    dayabbr: WEEKDAY_CODES[startDate.getDay()],
  };
};

export const getSuggestionOptions = (dateContext) => [
  {
    value: "FREQ=DAILY",
    label: "Daily",
  },
  {
    value: `FREQ=WEEKLY;BYDAY=${dateContext.dayabbr}`,
    label: `Weekly on ${dateContext.weekday}`,
  },
  {
    value: `FREQ=MONTHLY;BYDAY=${dateContext.nth}${dateContext.dayabbr}`,
    label: `Monthly on the ${getOrdinalLabel(dateContext.nth)} ${dateContext.weekday}`,
  },
  {
    value: `FREQ=YEARLY;BYMONTH=${dateContext.monthIndex + 1};BYMONTHDAY=${dateContext.dayOfMonth}`,
    label: `Annually on ${dateContext.calendarDateLabel}`,
  },
  {
    value: "custom",
    label: "Custom…",
  },
];

export const getMonthlyOptions = (dateContext) => [
  {
    value: "byweekday",
    label: `Monthly on the ${getOrdinalLabel(dateContext.nth)} ${dateContext.weekday}`,
  },
  {
    value: "bymonthday",
    label: `Monthly on day ${dateContext.dayOfMonth}`,
  },
];

export const getYearlyOptions = (dateContext) => [
  {
    value: "bymonthdayYearly",
    label: `Annually on ${dateContext.calendarDateLabel}`,
  },
  {
    value: "byweekdayYearly",
    label: `Annually on the ${getOrdinalLabel(dateContext.nth)} ${dateContext.weekday} in ${dateContext.monthName}`,
  },
];

const getNthWeekdayRule = (dayCode, nth) => WEEKDAY_RULES[dayCode].nth(nth);

const getWeekdayRules = (dayCodes) => dayCodes.map((dayCode) => WEEKDAY_RULES[dayCode]);

const getRuleForState = (state) =>
  state.suggestionValue !== "custom"
    ? { rule: RRule.fromString(state.suggestionValue), untilISO: undefined }
    : buildCustomRule(state);

const serializeRRule = (rule, untilISO) => {
  let rrule = rule.toString().slice(6);

  if (untilISO) {
    rrule = rrule.replace(/UNTIL=\d{8}T\d{6}Z/, `UNTIL=${untilISO}`);
  }

  return rrule;
};

const serializeUpdateFrequencyTag = ({ description, dtstart, rrule }) =>
  `<podcast:updateFrequency dtstart="${dtstart}" rrule="${rrule}">${description}</podcast:updateFrequency>`;

const buildCustomRule = ({
  count,
  dateContext,
  endMode,
  endingDate,
  frequency,
  interval,
  monthlyMode,
  selectedWeekdays,
  yearlyMode,
}) => {
  const options = {
    freq: FREQUENCIES[frequency] ?? RRule.DAILY,
  };

  if (interval > 1) {
    options.interval = interval;
  }

  switch (frequency) {
    case "weekly":
      if (selectedWeekdays.length > 0) {
        options.byweekday = getWeekdayRules(selectedWeekdays);
      }
      break;
    case "monthly":
      if (monthlyMode === "bymonthday") {
        options.bymonthday = dateContext.dayOfMonth;
      } else {
        options.byweekday = getNthWeekdayRule(dateContext.dayabbr, dateContext.nth);
      }
      break;
    case "yearly":
      options.bymonth = dateContext.monthIndex + 1;
      if (yearlyMode === "byweekdayYearly") {
        options.byweekday = getNthWeekdayRule(dateContext.dayabbr, dateContext.nth);
      } else {
        options.bymonthday = dateContext.dayOfMonth;
      }
      break;
    default:
      break;
  }

  let untilISO;
  if (endMode === "until" && endingDate) {
    const untilDate = parseDateInputAsUtc(endingDate);
    untilISO = untilDate.toISOString();
    options.until = untilDate;
  }

  if (endMode === "after" && count) {
    options.count = count;
  }

  const rule = new RRule(options);

  return { rule, untilISO };
};

export const buildUpdateFrequencyOutput = (state) => {
  if (state.endMode === "complete") {
    return {
      description: "Complete",
      rrule: null,
      tag: '<podcast:updateFrequency complete="true">Complete</podcast:updateFrequency>',
    };
  }

  const { rule, untilISO } = getRuleForState(state);
  const description = capitalize(rule.toText());
  const rrule = serializeRRule(rule, untilISO);
  const dtstart = toUtcMidnightISOString(state.dateContext.startDate);

  return {
    description,
    rrule,
    tag: serializeUpdateFrequencyTag({ description, dtstart, rrule }),
  };
};
