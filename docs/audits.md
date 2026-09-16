# Audit results

Recorded for task HRG-72 on 2026-09-16, against the production build of commit `0217a52`.

## Lighthouse

Lighthouse 12 with headless Chrome. "Local" is `npm run build-only` served by `vite preview`; "Live" is the GitHub Pages demo.

| Run           | Performance | Accessibility | Best practices | SEO |
| ------------- | ----------- | ------------- | -------------- | --- |
| Local mobile  | 99          | 100           | 100            | 91  |
| Local desktop | 100         | 100           | 100            | 91  |
| Live mobile   | 94          | 100           | 100            | 91  |
| Live desktop  | 70          | 100           | 100            | 91  |

NFR-05 asks for at least 95 Performance, 100 Accessibility, at least 95 Best practices and at least 90 SEO. The local production build meets all four.

Notes on the gaps:

- **Live performance** is dominated by GitHub Pages latency, not by the application. The desktop run scored 0 on `server-response-time` and `document-latency-insight` for the same bytes that score 100 locally, and `uses-long-cache-ttl` reflects the cache headers Pages sets, which this repository cannot change.
- **SEO 91** comes from a single failing audit, `robots-txt`. Lighthouse fetches `robots.txt` from the origin root, `https://phosimurg.github.io/robots.txt`, which belongs to the account's root Pages site rather than to this project repository. A `robots.txt` shipped from here would deploy to `/horse-racing-game/robots.txt` and would not satisfy the audit.
- **Render-blocking CSS** is the one remaining lever inside the app: a single stylesheet in the head. Design section 10.5 makes a preloaded display face conditional on this audit showing layout shift or slow text rendering. Neither appeared (local Performance 99 and 100, no CLS finding), so the font preload was not added.

## Keyboard

Walked the live demo with the Tab key. Focus order and visibility:

| Order | Element                        | Focus ring |
| ----- | ------------------------------ | ---------- |
| 1     | "Skip to the race track" link  | 3 px       |
| 2     | Theme toggle                   | 3 px       |
| 3     | Horses tab                     | 3 px       |
| 4     | Horse list scroll region       | 3 px       |
| 5     | Horse list table scroll region | 3 px       |
| 6     | Generate Program               | 3 px       |

Every scrollable region is reachable, so keyboard users can scroll the roster, the program and the results without a pointer. The order matches the visual order.

## Automated accessibility

`@axe-core/playwright` runs in CI over both themes at desktop and phone viewports with the WCAG 2.0, 2.1 and 2.2 A and AA rule sets, and reports no violations. Lighthouse Accessibility scores 100 in all four runs above.

## Screen reader

The author ran the VoiceOver pass on the live demo on 2026-09-16 and reported no issues. It cannot be automated from this environment, so it stays a manual step. The script followed:

1. With VoiceOver on, load the page and confirm the heading level 1, then the landmarks (banner, main, the Horse list, Program and Results regions).
2. Activate Generate Program and confirm the announcement "New program ready: 20 new horses, 6 laps from 1200 to 2200 meters."
3. Activate Start and confirm each lap announces its winner once, with no repetition while a lap runs.
4. Move through the Program and Results tables with the table reading commands and confirm the caption, the column headers and the podium markers read out.
5. Confirm the running lap is announced as the current step in the Laps list.
