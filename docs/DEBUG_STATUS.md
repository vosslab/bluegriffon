# Debug Status

**This project is in active debug mode.** Do not remove debug instrumentation.

## Context

BlueGriffon is being migrated from Gecko 55 (2017) to Gecko ESR 140. The app
builds successfully but exits immediately on launch. We are deep into diagnosing
why the chrome window never appears.

## Debug instrumentation in place

- `browser.dom.window.dump.enabled` set to `true` in `bluegriffon/app/profile/bluegriffon-prefs.js`
- `javascript.options.showInConsole` set to `true`
- `javascript.options.strict` set to `true`
- `nglayout.debug.disable_xul_cache` set to `true`
- `nglayout.debug.disable_xul_fastload` set to `true`
- `dump()` and `console.error()` calls added throughout `DefaultCLH.sys.mjs` (Gecko toolkit tree)
- `dump()` calls in `bgCommandHandler.js` component handlers

## Rules for developers

- **Do not remove** any `dump()`, `console.error()`, or `console.log()` calls.
- **Add more** debug output whenever touching code that runs during startup.
- When fixing a module or component, add `dump()` at entry points so we can
  trace execution flow.
- Capture stderr when launching: `bluegriffon -no-remote 2>&1`
- Use `MOZ_LOG="nsComponentManager:5"` for component loading diagnostics.
- We are a long way from shipping. Verbosity is preferred over silence.

## Known issues under investigation

- App exits with code 0 and minimal error output.
- `DevToolsStartup.sys.mjs` fails to load (`resource:///modules/` path).
- `DefaultCLH.sys.mjs` diagnostic messages not appearing (unclear if module loads).
- `bgCommandHandler.js` default handler returns early when `cmdLine.length == 0`
  without opening a window.
