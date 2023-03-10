import { RRule } from 'rrule'

const dtstart = document.querySelector("#dtstart")
const suggestions = document.querySelector("#suggestions")
const interval = document.querySelector("#interval")
const frequency = document.querySelector("#frequency")
const endingNever = document.querySelector("#never")
const endingDate = document.querySelector("#ending-date")
const count = document.querySelector("#count")
const fieldsets = document.querySelectorAll("fieldset[id*=freq-]")

const makeVisible = (element) => {
  element.classList.remove("hidden")
}

const makeInvisible = (element) => {
  element.classList.add("hidden")
}

const makeEachInvisible = (elements) => {
  elements.forEach((element) => {
    makeInvisible(element)
  })
}

const updateMin = () => {
  document.querySelector("#ending-date").min = document.querySelector("#dtstart").value
}

const FREQ_constant = (string) => {
  switch (string) {
    case "daily":
      return RRule.DAILY
    case "weekly":
      return RRule.WEEKLY
    case "monthly":
      return RRule.MONTHLY
    case "yearly":
      return RRule.YEARLY
    default:
      return RRule.DAILY
  }
}

const weekday_constants = (array) => {
  let weekdays = []
  array.forEach((day) => {
    switch (day) {
      case "MO":
        weekdays.push(RRule.MO)
        break;
      case "TU":
        weekdays.push(RRule.TU)
        break;
      case "WE":
        weekdays.push(RRule.WE)
        break;
      case "TH":
        weekdays.push(RRule.TH)
        break;
      case "FR":
        weekdays.push(RRule.FR)
        break;
      case "SA":
        weekdays.push(RRule.SA)
        break;
      case "SU":
        weekdays.push(RRule.SU)
        break;
      default:
        break;
    }
  })
  return weekdays
}

const nth_weekday_constant = (string, integer) => {
  switch (string) {
    case "MO":
      return RRule.MO.nth(integer)
    case "TU":
      return RRule.TU.nth(integer)
    case "WE":
      return RRule.WE.nth(integer)
    case "TH":
      return RRule.TH.nth(integer)
    case "FR":
      return RRule.FR.nth(integer)
    case "SA":
      return RRule.SA.nth(integer)
    case "SU":
      return RRule.SU.nth(integer)
    default:
      return RRule.MO.nth(integer)
  }
}

dtstart.value = new Date().toISOString().split('T')[0]

let year = dtstart.value.slice(0,4)
let month = dtstart.value.slice(5,7)-1
let day = dtstart.value.slice(8,10)
let startDate = new Date(year, month, day)
let weekday = startDate.toLocaleDateString(undefined, { weekday: "long" })
let nth = Math.floor((startDate.getDate() - 1) / 7) + 1
let dayOfMonth = startDate.toLocaleDateString(undefined, { day: "numeric" })
let dayabbr = weekday.slice(0, 2).toUpperCase()

const updateSuggestions = () => {
  const dailyOption = document.createElement("option")
  dailyOption.value = "FREQ=DAILY"
  dailyOption.innerText = "Daily"
  dailyOption.selected = true

  const weeklyOption = document.createElement("option")
  weeklyOption.value = `FREQ=WEEKLY;BYDAY=${dayabbr}`
  weeklyOption.innerText = `Weekly on ${weekday}`

  const monthlyOption = document.createElement("option")
  monthlyOption.value = `FREQ=MONTHLY;BYDAY=${nth}${dayabbr}`
  monthlyOption.innerText = `Monthly on the ${nth === 1 ? "first" : nth === 2 ? "second" : nth === 3 ? "third" : nth === 3 ? "fourth" : "fifth"} ${weekday}`

  const yearlyOption = document.createElement("option")
  yearlyOption.value = `FREQ=YEARLY;BYMONTH=${month+1};BYMONTHDAY=${day}`
  yearlyOption.innerText = `Annually on ${startDate.toLocaleDateString(undefined, { month: "long", day: "numeric" })}`

  const customOption = document.createElement("option")
  customOption.value = "custom"
  customOption.innerText = "Custom…"

  suggestions.innerHTML = ""
  suggestions.append(dailyOption, weeklyOption, monthlyOption, yearlyOption, customOption)
  document.querySelector("#recurring-simple").classList.remove("opacity-50","pointer-events-none")
}

dtstart.addEventListener("change", () => {
  makeInvisible(document.querySelector("#interval-frequency"))
  makeInvisible(document.querySelector("#ending"))
  
  year = dtstart.value.slice(0,4)
  month = dtstart.value.slice(5,7)-1
  day = dtstart.value.slice(8,10)
  startDate = new Date(year, month, day)
  weekday = startDate.toLocaleDateString(undefined, { weekday: "long" })
  nth = Math.floor((startDate.getDate() - 1) / 7) + 1
  dayOfMonth = startDate.toLocaleDateString(undefined, { day: "numeric" })
  dayabbr = weekday.slice(0, 2).toUpperCase()

  updateSuggestions()
  updateMin()
})

suggestions.addEventListener("change", () => {
  if (suggestions.value === "custom") {
    makeVisible(document.querySelector("#interval-frequency"))
    makeVisible(document.querySelector("#ending"))
  } else {
    makeInvisible(document.querySelector("#interval-frequency"))
    makeInvisible(document.querySelector("#ending"))
    makeEachInvisible(fieldsets)
  }
})

interval.addEventListener("change", () => {
  const isSingular = (interval.value == 1) ? true : false
  const isPlural = document.querySelector("#frequency").options[frequency.selectedIndex].innerText.endsWith("s")
  const options = document.querySelectorAll("#frequency option")

  if (isSingular && isPlural) {
    options.forEach(option => {
      option.innerText = option.innerText.slice(0, -1)
    })
  } else if (!isSingular && !isPlural) {
    options.forEach(option => {
      option.innerText = option.innerText + "s"
    })
  }
})

frequency.addEventListener("change", () => {
  const startingWeekday = document.querySelector(`#freq-weekly input[value='${dayabbr}']`);
  makeEachInvisible(fieldsets)

  switch (frequency.value) {
    case "weekly":
      makeVisible(document.querySelector("#freq-weekly"))
      startingWeekday.checked = true
      startingWeekday.disabled = true
      break;
    case "monthly":
      makeVisible(document.querySelector("#freq-monthly"))

      const byweekdayWeeklyOption = document.createElement("option")
      byweekdayWeeklyOption.value = "byweekday"
      byweekdayWeeklyOption.innerText = `Monthly on the ${nth === 1 ? "first" : nth === 2 ? "second" : nth === 3 ? "third" : nth === 3 ? "fourth" : "fifth"} ${weekday}`

      const bymonthdayWeeklyOption = document.createElement("option")
      bymonthdayWeeklyOption.value = "bymonthday"
      bymonthdayWeeklyOption.innerText = `Monthly on day ${dayOfMonth}`
      monthly.innerHTML = ""
      monthly.append(byweekdayWeeklyOption, bymonthdayWeeklyOption)

      break;
    case "yearly":
      makeVisible(document.querySelector("#freq-yearly"))

      const byweekdayYearlyOption = document.createElement("option")
      byweekdayYearlyOption.value = "byweekdayYearly"
      byweekdayYearlyOption.innerText = `Annually on the ${nth === 1 ? "first" : nth === 2 ? "second" : nth === 3 ? "third" : nth === 3 ? "fourth" : "fifth"} ${weekday} in ${startDate.toLocaleDateString(undefined, { month: "long" })}`

      const bymonthdayYearlyOption = document.createElement("option")
      bymonthdayYearlyOption.value = "bymonthdayYearly"
      bymonthdayYearlyOption.innerText = `Annually on ${startDate.toLocaleDateString(undefined, { month: "long", day: "numeric" })}`

      yearly.innerHTML = ""
      yearly.append(byweekdayYearlyOption, bymonthdayYearlyOption)
      break;
  }
})

const weekdays = document.querySelectorAll("#freq-weekly input")
weekdays.forEach(day => {
  day.addEventListener("change", () => {
    const days = []
    weekdays.forEach(day => {
      if (day.checked) {
        days.push(day.value.toUpperCase())
      }
    })
  })
})

endingNever.addEventListener("change", () => {
  endingDate.value = ""
  count.value = ""
})

endingDate.addEventListener("change", () => {
  document.querySelector("#until").checked = true
  count.value = ""
})

count.addEventListener("change", () => {
  document.querySelector("#after").checked = true
  endingDate.value = ""

  const o = document.querySelector("#episodes")
  if (count.value == 1) {
    o.innerText = "episode"
  } else {
    o.innerText = "episodes"
  }
})

document.querySelector('#complete').addEventListener("change", () => {
  endingDate.value = ""
  count.value = ""
})

const updateCode = () => {
  let rule;
  let options = {};
  let untilISO;

  if (document.querySelector('#complete').checked) {
    document.querySelector("pre code").innerText = `<podcast:updateFrequency complete="true">Complete</podcast:updateFrequency>`
    return
  }

  if (suggestions.value != "custom") {
    rule = RRule.fromString(suggestions.value)
  } else {
    options.freq = FREQ_constant(frequency.value)

    if(interval.value != 1) {
      options.interval = interval.value
    }

    switch (frequency.value) {
      case "weekly":
        const selectedWeekdays = document.querySelectorAll('input[name="byweekday"]:checked')
        const selectedWeekdaysArray = Array.from(selectedWeekdays).map(weekday => weekday.value)
        
        if (selectedWeekdaysArray.length > 0) {
          options.byweekday = weekday_constants(selectedWeekdaysArray)
        }
        break;
      case "monthly":
        const monthly = document.querySelector("#monthly")
        switch (monthly.value) {
          case "byweekday":
            options.byweekday = nth_weekday_constant(dayabbr, nth)
            break;
          case "bymonthday":
            options.bymonthday = dayOfMonth
            break;
        }
      case "yearly":
        const yearly = document.querySelector("#yearly")
        switch (yearly.value) {
          case "byweekdayYearly":
            options.bymonth = month + 1
            options.byweekday = nth_weekday_constant(dayabbr, nth)
            break;
          case "bymonthdayYearly":
            options.bymonth = month + 1
            options.bymonthday = dayOfMonth
            break;
        }
        break;
      default:
        break;
    }

    if (document.querySelector('#until').checked && endingDate.value) {
      let year = endingDate.value.slice(0,4)
      let month = endingDate.value.slice(5,7)-1
      let day = endingDate.value.slice(8,10)
      untilISO = new Date(year, month, day).toISOString()
      options.until = new Date(year, month, day)
    }

    if (document.querySelector('#count').checked && count.value) {
      options.count = count.value
    }

    rule = new RRule(options)
  }

  let description = rule.toText()
  description = description.charAt(0).toUpperCase() + description.slice(1)

  let rruleStr = rule.toString().slice(6)
  if (untilISO) {
    rruleStr = rruleStr.replace(/UNTIL=\d{8}T\d{6}Z/, `UNTIL=${untilISO}`)
  }

  document.querySelector("pre code").innerText = `<podcast:updateFrequency dtstart="${startDate.toISOString()}" rrule="${rruleStr}">${description}</podcast:updateFrequency>`
}

document.querySelector("form").addEventListener("change", () => {
  updateCode()
})

updateSuggestions()
updateMin()
updateCode()
