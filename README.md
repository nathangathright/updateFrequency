# `podcast:updateFrequency`

This repo is a sample UI implementation of the now-formalized [`<podcast:updateFrequency>`](https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/tags/update-frequency.md) tag.

It exists to make one case clearly: podcast feeds should be able to express release cadence as structured data, not only as loose text or platform-specific settings.

The tag gives publishers a standard way to say things like:

- `Weekly`
- `Every Monday and Wednesday`
- `Every weekday until June 1`
- `10-episode season starting September 3`
- `No more episodes are planned`

That helps hosting platforms publish better metadata, and it helps apps show listeners what to expect.

Demo: https://nathangathright.github.io/updateFrequency/

## Why adopt it

`<podcast:updateFrequency>` turns a common listener question into machine-readable feed data: "When does this show usually publish?"

It is useful because it can describe:

- simple recurring schedules such as daily, weekly, monthly, and yearly
- more precise schedules such as weekdays or specific days of the week
- limited runs using `COUNT` or `UNTIL`
- future resumptions using `dtstart`
- completed shows using `complete="true"`

It also brings an open RSS equivalent to the "Update Frequency" concept already familiar from Apple Podcasts Connect.

## Why this is better than plain text alone

Plain text is helpful for humans, but it is weak metadata for software.

A phrase like "New episodes every week" does not tell an app whether the show is:

- on a planned break
- between seasons
- a limited run with a known end
- permanently complete
- resuming on a future date

`<podcast:updateFrequency>` keeps the human-readable text and adds enough structure for apps to reason about the schedule.

## Common examples

Most shows only need simple rules.

```xml
<podcast:updateFrequency rrule="FREQ=DAILY">Daily</podcast:updateFrequency>

<podcast:updateFrequency rrule="FREQ=WEEKLY">Weekly</podcast:updateFrequency>

<podcast:updateFrequency rrule="FREQ=WEEKLY;INTERVAL=2">Biweekly</podcast:updateFrequency>

<podcast:updateFrequency rrule="FREQ=MONTHLY">Monthly</podcast:updateFrequency>

<podcast:updateFrequency rrule="FREQ=YEARLY">Yearly</podcast:updateFrequency>
```

When a show needs more detail, the same tag can express it.

```xml
<podcast:updateFrequency rrule="FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR">
  Every weekday
</podcast:updateFrequency>

<podcast:updateFrequency
  dtstart="2026-09-03T00:00:00.000Z"
  rrule="FREQ=WEEKLY;BYDAY=WE;COUNT=10"
>
  Weekly on Wednesdays for 10 episodes
</podcast:updateFrequency>

<podcast:updateFrequency
  dtstart="2027-01-06T00:00:00.000Z"
  rrule="FREQ=WEEKLY;BYDAY=TU"
>
  Tuesdays, returning in January 2027
</podcast:updateFrequency>

<podcast:updateFrequency complete="true">
  Complete
</podcast:updateFrequency>
```

## FAQ

### Do podcasters need to learn RRULE syntax?

No. Podcasters should not be expected to write recurrence rules by hand.

This is a tooling problem, not a creator problem. Hosts, CMSs, feed generators, and validators can expose simple controls such as "Weekly", "Every weekday", "Ends after 8 episodes", or "Returns on January 6". This repo demonstrates that approach with a form-based UI built on [`rrule`](https://github.com/jkbrzt/rrule).

### Is this too complex for RSS?

No, because the complexity is optional and mostly shifted into software.

The tag still allows a plain-text node value, so the feed stays readable in a text editor. For common cases, the structured part is short:

```xml
<podcast:updateFrequency rrule="FREQ=WEEKLY">Weekly</podcast:updateFrequency>
```

That is not meaningfully harder to read than many existing podcast tags, but it is much more useful to apps.

### Why not keep this as plain text only?

Because plain text does not reliably support automation.

Apps cannot safely infer status, future schedule windows, limited-run behavior, or hiatus from arbitrary text. Structured recurrence data lets clients do that without guessing, while the node value still gives publishers full control over the human-facing wording.

### Why not infer a show's schedule from its publishing history?

Because history is not the same thing as intent.

Heuristics can be useful, but they often break on serialized shows, seasonal runs, planned hiatuses, irregular production schedules, and shows that are about to change cadence. Those are exactly the cases where listener-facing apps need better metadata.

`podcast:updateFrequency` lets the publisher declare what should happen next, even when the recent back catalog suggests something else. Apps can still compare that declaration with actual publishing behavior if they want, but they should not be forced to guess when the feed can say it directly.

### Is this the same as `sy:updateFrequency`?

No.

`sy:updateFrequency` is about how often aggregators should check a feed for updates. `podcast:updateFrequency` is about how often listeners should expect new episodes. One is crawler-facing. The other is listener-facing.

### How do Podping and `podcast:updateFrequency` work together?

They solve different problems.

Podping tells apps and services that a feed has changed and a new episode may be available now. `podcast:updateFrequency` tells apps what the publisher expects to happen next.

That distinction matters because apps cannot derive future intent from Podping alone. A listener-facing app may want to show "Weekly", "Every weekday", "Returns in January", or "This 8-episode season ends next month" before the next episode is published. That is schedule metadata, not change notification.

Used together, they make feeds better. Podping helps apps react quickly when something new is published. `podcast:updateFrequency` helps them set expectations before that happens.

### Does this replace `<itunes:complete>`?

It covers that use case.

If a podcast has no intention to release more episodes, it can express that directly:

```xml
<podcast:updateFrequency complete="true">Complete</podcast:updateFrequency>
```

That lets completion status live beside release-schedule metadata instead of in a separate tag.

### How do I express a hiatus or limited run?

Use `COUNT` or `UNTIL` when the current run has a known end.

If the feed has no future occurrences left, apps can reasonably treat the show as on hiatus or between seasons. If the show is expected to return, publish a new rule with a future `dtstart`.

### What if the schedule changes?

Update the tag.

This metadata describes current intent, not an irreversible promise. If a weekly show becomes seasonal, or a break gets extended, the feed should publish the new expected cadence.

### What should apps display?

Use the text node for human-facing copy when it is present, and use the attributes for logic.

That gives publishers control over wording and gives apps enough structure to power search, badges, status labels, and "next expected episode" features.

## Why this repo matters

This project shows that the tag is practical to implement.

It relies on [rrule](https://github.com/jkbrzt/rrule), a well-established recurrence library, to generate valid RRULE values from normal form inputs. That is the right adoption model: publishers pick from simple controls, and software emits compliant metadata.

The formal spec is here:

- https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/tags/update-frequency.md

The discussion that shaped the final tag is here:

- https://github.com/Podcastindex-org/podcast-namespace/discussions/515

## Requirements

- Node `22.13.1`
- `pnpm@10.15.0`

## Development

```bash
pnpm install
pnpm dev
```

## Checks

```bash
pnpm check
```

The production build is emitted to `dist/`.
