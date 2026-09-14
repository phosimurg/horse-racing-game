# Horse Racing

An interactive horse racing game built with Vue 3, TypeScript and Pinia for the Insider One frontend assessment. Generate a program of six laps from 1200 to 2200 meters and watch ten of twenty horses race each lap.

> Status: in development. Progress is tracked in [docs/specs/tasks.md](docs/specs/tasks.md).

## Quick start

Requires Node.js `^22.22.2`, `^24.15.0` or `>=26.0.0`.

```bash
npm ci
npm run dev
```

## Scripts

| Command                      | Purpose                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------- |
| `npm run dev`                | Start the development server                                                     |
| `npm run verify`             | Lint, format check, type-check, unit tests with coverage, build and traceability |
| `npm run test:e2e`           | End-to-end tests with Playwright                                                 |
| `npm run test:visual:docker` | Visual regression tests inside the official Playwright image                     |

## Documentation

- [Requirements](docs/specs/requirements.md)
- [Design](docs/specs/design.md)
- [Tasks](docs/specs/tasks.md)
- [Architecture decisions](docs/adr/)
- [Implementation plan](docs/implementation-plan.md)
- [AI-assisted workflow log](docs/ai-workflow.md)
