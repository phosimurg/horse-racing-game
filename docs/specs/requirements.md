# Requirements Specification

| Field | Value |
| --- | --- |
| Status | Draft for approval |
| Last updated | 2026-09-14 |
| Source | Insider One "Software Developer Assessment Project" brief |
| Related | [Design](design.md), [Tasks](tasks.md), [ADRs](../adr/) |

## 1. Purpose and scope

An interactive horse racing game: a roster of 20 horses, a generated program of 6 rounds, and an animated race that runs the rounds one at a time and publishes results as each round concludes.

This document is the verification baseline. Every requirement has an ID, acceptance criteria use EARS notation, and every ID must appear in at least one test title.

Out of scope: accounts, persistence of past races, betting, multiplayer and backend services.

## 2. Glossary

| Term | Meaning |
| --- | --- |
| Horse | A racer with an id from 1 to 20, a unique name, a unique silk color and a condition score |
| Condition | Integer from 1 to 100; a higher condition means a higher expected speed |
| Program | The generated schedule of 6 rounds (the brief's "race schedule") |
| Race | The whole 6-round program, from Start to the end of round 6 |
| Round | One run over a fixed distance with 10 horses; labeled "Lap" in the UI, as in the brief's example |
| Lane | A horse's track position within a round, 1 to 10; shown as "Position" in the Program panel |
| Placement | A horse's finishing place within a round, 1 to 10; shown as "Position" in the Results panel |
| Intermission | The short pause between the end of one round and the start of the next |
| Race control | The single button that reads Start, Pause or Resume |

## 3. Brief traceability

| Brief item | Covered by |
| --- | --- |
| Requirement 1: Vue | ADR 0001 |
| Requirement 2: generate horse list | HORSE-01 to HORSE-04 |
| Requirement 3: generate race schedule | PROG-01 to PROG-04 |
| Requirement 4: start the race | RACE-01, CTRL-01, CTRL-02 |
| Requirement 5: display race results | RES-01, RES-02 |
| Requirement 6: animated horse movement | RACE-02, RACE-03, RACE-05 |
| Requirement 7: coding style | ADR 0001, [design.md](design.md) |
| Rule 1: 20 horses | HORSE-01 |
| Rule 2: unique color | HORSE-02 |
| Rule 3: condition 1 to 100 | HORSE-03 |
| Rule 4: 6 rounds | PROG-01 |
| Rule 5: 10 random horses per round | PROG-03 |
| Rule 6: round distances | PROG-02 |
| Technical: Vuex or Pinia | ADR 0001 |
| Technical: component-based design | [design.md](design.md) |
| Bonus: unit, E2E and visual tests | ADR 0003 |

## 4. Functional requirements

### 4.1 Horses

- **HORSE-01** The system shall maintain exactly 20 horses with ids 1 to 20.
- **HORSE-02** The system shall give each horse a name and a color that no other horse shares; each color shall have a human-readable name and a hex value.
- **HORSE-03** The system shall give each horse an integer condition from 1 to 100 inclusive.
- **HORSE-04** When the application loads, the system shall generate the horses at random and list each horse's name, condition and color.

### 4.2 Program

- **PROG-01** When the user activates Generate Program, the system shall create a program of 6 rounds.
- **PROG-02** The system shall set the distance of round n to 1200 + 200 * (n - 1) meters, giving 1200, 1400, 1600, 1800, 2000 and 2200 meters.
- **PROG-03** The system shall fill each round with 10 distinct horses drawn at random from the 20 and assign them lanes 1 to 10 in draw order.
- **PROG-04** When a program is generated, the system shall list every round with its lap title, distance and lane order (Position = lane, Name) and shall clear any previous results.

### 4.3 Race

- **RACE-01** When the user activates Start while a program is ready, the system shall run the rounds in order, one at a time, with an intermission between consecutive rounds.
- **RACE-02** While a round is running, the system shall move each horse along its lane in proportion to its simulated progress, show the lap title and the current leader on the track, and mark the running round in the Program panel and the lap stepper with `aria-current`.
- **RACE-03** When the user activates Pause while the race is running, including during an intermission, the system shall freeze horse positions and all race timers; when the user activates Resume, the system shall continue from the frozen state. The race control shall read Start, Pause or Resume according to the lifecycle table in section 6.
- **RACE-04** The system shall derive every round's finishing order from a simulation in which a higher condition raises a horse's expected speed and per-round randomness allows upsets.
- **RACE-05** If animation frames are delayed (for example in a hidden tab) or the viewport is resized during a round, then the system shall not skip, reorder or visually distort the round.

### 4.4 Results

- **RES-01** When a round finishes, the system shall append that round's results (Position = placement, Name, a podium marker for placements 1 to 3) after the results of earlier rounds, scroll the newest results into view within the Results panel and announce the winner once to assistive technology.
- **RES-02** When round 6 finishes, the system shall enter the finished state and keep the horses at the finish line.

### 4.5 Controls

- **CTRL-01** While no program exists or the race is finished, the system shall disable the race control.
- **CTRL-02** While the race is running, the system shall disable Generate Program; repeated activations of any control shall have the same effect as a single activation.

### 4.6 Experience

- **UX-01** While no program exists, the system shall show guidance instead of empty content in the Program panel, the Results panel and the track.
- **UX-02** The system shall apply the operating system's color scheme on the first visit, let the user switch between dark and light themes, and restore the chosen theme on later visits.
- **UX-03** While the viewport is narrower than 768 CSS pixels, the system shall present Horses, Program and Results as tabs below the track and keep the primary controls in a sticky bottom bar.

## 5. Non-functional requirements

- **NFR-01 Accessibility** The system shall conform to WCAG 2.2 level AA, following the checklist in [design.md](design.md) section 10, and shall report no axe violations in either theme on desktop and mobile viewports.
- **NFR-02 Responsiveness** The system shall reflow at 320 CSS pixels without horizontal scrolling and provide touch targets of at least 24 by 24 CSS pixels, and 44 by 44 for primary controls.
- **NFR-03 Determinism** Where the URL contains `seed=<uint32>`, the system shall produce identical horses, programs and results for identical user actions; if the seed is missing or invalid, then the system shall use a random seed.
- **NFR-04 Runtime quality** The system shall animate horses with CSS transforms only and shall produce no console errors, uncaught exceptions or Vue warnings.
- **NFR-05 Performance** A Lighthouse audit of the production build shall score at least 95 for Performance, 100 for Accessibility, at least 95 for Best Practices and at least 90 for SEO.
- **NFR-06 Privacy and security** The system shall make no third-party network requests and shall ship a Content Security Policy in production builds.

## 6. Race lifecycle

States: `idle` (no program), `ready` (program generated, race not started), `running` (a round or an intermission is in progress), `paused`, `finished`.

| State | Generate Program | Race control | Round completed | Round 6 completed |
| --- | --- | --- | --- | --- |
| `idle` | Create program, go to `ready` | Disabled, reads Start (no-op) | Not applicable | Not applicable |
| `ready` | Replace program, clear results, stay `ready` | Reads Start: go to `running`, round 1 starts | Not applicable | Not applicable |
| `running` | Disabled (no-op) | Reads Pause: go to `paused` | Append result, start intermission, stay `running` | Append result, go to `finished` |
| `paused` | Discard race, replace program, clear results, go to `ready` | Reads Resume: go to `running` from the frozen state | Cannot occur: timers frozen | Cannot occur: timers frozen |
| `finished` | Replace program, clear results, go to `ready` | Disabled, reads Start (no-op) | Not applicable | Not applicable |

Round completion events come from the playback engine, never from the user. Every no-op cell is covered by a unit test (CTRL-02).

## 7. Assumptions

- **A1 Horse count:** "between 1 to 20 horses" is read as the numbering of the list. Rule 1 fixes the total at 20, and rule 5 would be impossible with fewer than 10 horses.
- **A2 Generate scope:** horses are generated once per page load; Generate Program only draws a new schedule.
- **A3 Condition:** a horse's condition stays constant across rounds; there is no fatigue model.
- **A4 Generate while paused:** discards the race in progress and prepares a new program.
- **A5 End of a round:** a round ends when its last horse finishes; an intermission follows, except after round 6.
- **A6 Terminology:** "race" names the 6-round program and "round" one lap, matching the example's "1ST Lap - 1200m" labels.
- **A7 Upsets:** the better-conditioned horse usually, but not always, wins its head-to-head comparison.

## 8. Clarification questions for the recruiter

Each question lists the assumption applied until it is answered.

1. Should the horse list always contain exactly 20 horses, or may the count vary between 1 and 20? (A1)
2. Should Generate also create a new horse list, or only a new race schedule? (A2)
3. Should a horse's condition change between rounds, for example through fatigue? (A3)
4. Should Generate be available while a race is paused? (A4)
5. Should a round end when the winner crosses the line or when every horse has finished? (A5)
6. How strongly should condition decide results, and are upsets expected? (A7)

## 9. Verification

- `scripts/check-traceability.mjs` fails the build when a requirement ID has no test whose title contains it.
- [tasks.md](tasks.md) maps each ID to its implementation task and test files.
