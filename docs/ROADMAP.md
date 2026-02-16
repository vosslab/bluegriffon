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

BlueGriffon is pinned to a 2017-era Gecko revision (`042b84a`). Mozilla
dropped XUL support after Firefox 57 (November 2017), so updating Gecko is
not a simple version bump. It would require substantial investigation into
alternative rendering approaches or a port away from XUL.

This is a major investigation, not a near-term task.

## Future goals

- Investigate Gecko version update feasibility
- Evaluate alternative rendering engines if Gecko update proves impractical
- Expand test coverage for build and packaging workflows
- Improve cross-platform build documentation
