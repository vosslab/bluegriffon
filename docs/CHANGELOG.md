# Changelog

## 2026-02-16

- Created [docs/CODE_ARCHITECTURE.md](CODE_ARCHITECTURE.md) with high-level system design, data flow diagram, and key directory overview
- Created [docs/FILE_STRUCTURE.md](FILE_STRUCTURE.md) with full directory map of the project
- Created [docs/INSTALL.md](INSTALL.md) with modern build prerequisites for macOS 14+, Ubuntu 22.04+, and Windows with VS 2022
- Created [docs/USAGE.md](USAGE.md) with build, run, and package instructions
- Created [docs/RELEASE_HISTORY.md](RELEASE_HISTORY.md) with version timeline from v1.0 through v3.2
- Created [docs/ROADMAP.md](ROADMAP.md) with current work, deferred items, and future goals
- Updated [README.md](../README.md) with modern build environments, quick start, documentation links, and credits
- Created `VERSION` file at repo root (synced with `config/version.txt` at `3.2`)
- Updated [docs/AUTHORS.md](AUTHORS.md) to add Daniel Glazman as original author
- Rewrote [app/macversion.py](../app/macversion.py) to replace deprecated `optparse` with `argparse`, add type hints, use f-strings, use tabs for indentation, and add function separator comments
- Updated [config/mozconfig.macosx](../config/mozconfig.macosx): fixed header to say macOS instead of WIN32, updated to macOS 14+/Xcode 16+, changed SDK path to generic `MacOSX.sdk`, set minimum target to macOS 12.0
- Updated [config/mozconfig.macosx](../config/mozconfig.macosx): native ARM64 for Apple Silicon (M1/M2/M3/M4), no x86_64 target forced
- Updated [config/mozconfig.ubuntu64](../config/mozconfig.ubuntu64): updated Ubuntu reference from 16.04 to 22.04+ LTS
- Updated bundled CodeMirror from v5.2 (April 2015) to v5.65.18 (latest 5.x)
- Updated [base/moz.build](../base/moz.build) to reflect new CodeMirror file structure (691 to 872 lines)
- Updated [base/res/cm2.html](../base/res/cm2.html) with new theme CSS links (36 to 66 themes)
- Updated [base/res/codemirror/themes-list.js](../base/res/codemirror/themes-list.js) with new theme names
- Staged `extensions/inspector/.hg/` for removal (embedded Mercurial VCS, 6MB)
- All Python files pass pyflakes, shebangs, indentation, and whitespace tests
- ASCII compliance failures are pre-existing in locale/L10N files and SVG-edit extension (expected)
