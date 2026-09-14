---
paths:
  - 'src/stores/**'
---

# Store rules

- Setup stores only: `defineStore('name', () => { ... })`, returning every piece of state.
- Stores own global state and change only on user actions or round boundaries; never update a store on every animation frame.
- Keep immutable domain data in `shallowRef` and replace it instead of mutating nested objects.
- Delegate rules to `src/domain`; stores orchestrate.
- Get randomness only through `useRng()`.
- An action that does not apply in the current status is a no-op, exactly as the lifecycle table in `docs/specs/requirements.md` section 6 defines.
- Tests build stores with `createTestStores({ seed })` and cover every state and event pair.
