# House Expenses Tracker

## Design system (mandatory)

All UI work in this project MUST follow [design.md](design.md): colors, typography, spacing, components, screens, RTL/Arabic rules, motion, accessibility, and content tone. Read it before building or changing any UI. If a request conflicts with it, flag the conflict instead of silently deviating.

## Code style (mandatory)

- **Arrow functions only.** Never write `function name() {}` declarations or `function () {}` expressions: use `const name = (...) => {...}` (and `async (...) =>` / `export const name = ...`). This applies to every `.ts` and `.vue` file, in components, stores, composables, utils and server code, including new code and edits to existing code.
- Arrow functions are not hoisted: declare a function above the first line that runs it at setup/module time (callbacks that run later are fine).
- Exceptions only where JavaScript requires it: generators (`function*`) and code that needs its own `this`/`arguments`. Say so in a comment when you use one.
