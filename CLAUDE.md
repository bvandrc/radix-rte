# @bvandrc/radix-rich-text-editor — Claude Code Reference

A Tiptap rich text editor for React, built on Radix and Tailwind v4, published to npm as `@bvandrc/radix-rich-text-editor`. The repo is `bvandrc/radix-rte`; the names differ on purpose, and `repository` in `package.json` must name the repo, since npm checks provenance against it.

The editor began in TaskRankr (`bvandrc/taskrankr`), which is still its main consumer.

## Code conventions

Follow all of these. `.github/workflows/sync-conventions.yml` syncs them from https://github.com/bvandrc/bvandrc-conventions and overwrites `conventions/` each time, so change a rule upstream.

- @conventions/typescript.md — TypeScript/JavaScript language rules
- @conventions/react.md — components, JSX, folder layout, and accessibility
- @conventions/ts-testing-all.md — every TypeScript suite: test IDs, naming, and assertions
- @conventions/ts-unit-testing.md — unit test layout, naming, fixtures, and assertions
- @conventions/all.md — every repo: branches, formatting, comments, testing, writing, and PR reviews
- @conventions/npm-publishing.md — releasing, trusted publishing, `package.json` fields, and versioning

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm run build` | Build `dist/` with tsdown: unbundled ESM plus `.d.mts` types |
| `pnpm run format` | Biome format — **run before every commit** |
| `pnpm run lint` | Biome lint and format check |
| `pnpm run ts:check` | TypeScript check |
| `pnpm run test` | Vitest unit tests (single run) |
| `pnpm run check` | `ts:check` + `lint`; `prepublishOnly` runs it, then `test` and `build` |

## Gotchas

- **Generic by intent**: nothing here may know about an app that uses it, TaskRankr included.
  - A dependency ships to every consumer, so prefer a local copy of a small helper over a new package.
  - A package only tests use is a devDependency and ships nothing.
- **The host draws the parts**: the editor never styles a menu, dialog, or button itself. It takes them through `components`, each typed as the Radix part it stands for, so a host's own (like shadcn's) fit as they are. A new part, or a new prop on one, is a change to every host, so it's breaking unless optional.
- **Colors come from the theme**: the editor's colors are the `--color-radix-rte-*` theme colors in `styles.css`, each defaulting to the shadcn color of its role. Use those in classes (`text-radix-rte-foreground`), never a host's own color names or a raw color, so a host can recolor everything from one place.
- **Public API**: what `package.json`'s `exports` points at, and the `--color-radix-rte-*` variables and `data-testid`s, which hosts style and test against. Removing or renaming any of them is breaking, so it needs a major bump.
- **README is an index; JSDoc holds the details**:
  - The README says what each export and part is for, plus any requirement that breaks it when missed. That's enough to pick it and use it safely.
  - Props, edge cases, timing, and examples go in its JSDoc, which ships in the `dist/*.d.mts` types, where a consumer's editor or agent reads it.
  - So a change to an existing export, like a new optional prop or a fixed edge case, usually touches only its JSDoc.
- **Test support ships**: `src/test-support/` is published for consumers' tests, so anything it exports imports `vi` from `vitest` rather than relying on globals a consumer may not turn on.
- **`@/*` is `src/*`**:
  - Use it for any import that would climb out of a folder (`../`); keep same-folder siblings relative.
  - Declared once in `tsconfig.json`. Vitest reads it through `resolve.tsconfigPaths`, and tsdown rewrites it to relative paths in `dist/`, so consumers never see it.
- **Unit tests run in real Chromium**: Vitest's browser mode, through Playwright, not happy-dom or jsdom. An editor is selections and typing, which those only approximate: ProseMirror 1.43 broke the table and full-screen tests under happy-dom while Chromium passed them.
  - Install the browser once with `pnpm exec playwright install chromium`. CI installs it in each job that runs the tests, the release job included, since `prepublishOnly` runs them.
  - Each test file gets a page of its own, but its cases share it. `vitest.setup.ts` clears the DOM, `localStorage`, and fake timers after every case, and `vitest.config.ts` restores spies and stubbed globals before each.
  - A module's own state is the test's to undo.
  - A spy made once for a whole `describe` is restored before its first case, so make it in each case or a `beforeEach`.
  - The page is Vitest's default viewport, 414px wide, which is below Tailwind's `md`. A case about mobile or desktop sets it with `mockMobile` from `@bvandrc/react-toolkit/test-support` rather than relying on the width.
- **pnpm, pinned**: `packageManager` in `package.json` pins the version, which `corepack enable` (or CI's `pnpm/action-setup`) picks up. Install with `pnpm install`; npm and `package-lock.json` aren't used.
