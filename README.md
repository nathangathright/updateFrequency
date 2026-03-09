# Update Frequency

This project is a sample UI implementation of the [`<podcast:updateFrequency>`](https://github.com/Podcastindex-org/podcast-namespace/pull/439) spec.

It relies on @jakubroztocil’s [rrule](https://github.com/jakubroztocil/rrule) package to implement RRULE as defined in [iCalendar RFC 5545 Section 3.3.10](https://www.rfc-editor.org/rfc/rfc5545#section-3.3.10).

https://nathangathright.github.io/updateFrequency/

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
pnpm lint
pnpm test
pnpm build
```

The production build is emitted to `dist/`.
