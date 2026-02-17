# Roadmap

Planned work, current priorities, and items intentionally deferred.

## Current work

Active areas of development:

- Documentation overhaul and cleanup
- CodeMirror update from 5.2 to latest 5.x release
- Python script fixes and modernization
- Dead code removal and repository cleanup
- ARM64 mozconfig targeting native Apple Silicon (M1/M2/M3/M4)

## Not changing now

These areas are intentionally left unchanged for now:

- Core XUL/Gecko application architecture
- JavaScript application code in `base/` and `modules/`
- Extension system and existing extensions
- Localization files and language packs
- XPCOM component interfaces

## Gecko situation

BlueGriffon has been migrated from the original 2017-era Gecko (Firefox 55)
to Firefox ESR 140. The ESR 140 Gecko code stays in place as the rendering
engine; BlueGriffon overlay code (XUL, JS, XPCOM bindings) is updated to
work with the modern Gecko APIs. Key migration work already completed:

- All 18 `.jsm` modules converted to `.sys.mjs` ES modules
- All 248 `Components.utils.import()` calls replaced with `ChromeUtils.importESModule()`
- Removed XPCOM interfaces (`nsIDOMNode`, `nsIDOMWindow`, etc.) replaced with standard DOM equivalents
- Build system updated for ESR 140 (mozconfig, moz.build, component registration)
- Builds and links on macOS ARM64

Remaining work is fixing BlueGriffon UI and JavaScript to fully function
with the modern Gecko runtime.

## Future goals

- Complete BlueGriffon UI fixes for ESR 140 compatibility
- Expand test coverage for build and packaging workflows
- Improve cross-platform build documentation
- Evaluate Linux and Windows build support on ESR 140
