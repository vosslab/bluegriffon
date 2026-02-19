# Changelog

## 2026-02-18

- Fixed Quit (Cmd+Q and File > Quit) not working: ESR 140's `goQuitApplication()` requires an event parameter; updated [menubar.inc](../bluegriffon/base/content/bluegriffon/xul/menubar.inc) handler and [sets.inc](../bluegriffon/base/content/bluegriffon/xul/sets.inc) key binding to pass `event`
- Removed references to `nsDragAndDrop.js` and `nsTransferable.js` from [scripts.inc](../bluegriffon/base/content/bluegriffon/xul/scripts.inc) (files removed in ESR 140)
- Migrated all `nsIFilePicker` calls from removed sync `fp.show()` / `fp.init(window)` to ESR 140 async `fp.open(callback)` / `fp.init(browsingContext)` across 9 files: [fileCommands.inc](../bluegriffon/base/content/bluegriffon/js/fileCommands.inc), [openLocation.js](../bluegriffon/base/content/bluegriffon/dialogs/openLocation.js), [fileHelper.sys.mjs](../bluegriffon/modules/fileHelper.sys.mjs), [filepickerbutton.xml](../bluegriffon/base/content/bluegriffon/bindings/filepickerbutton.xml), [editStylesheet.js](../bluegriffon/base/content/bluegriffon/dialogs/editStylesheet.js), [insertVideo.js](../bluegriffon/base/content/bluegriffon/dialogs/insertVideo.js), [global.js](../bluegriffon/sidebars/its20/content/global.js), [handlers.js](../bluegriffon/extensions/svg-edit/handlers.js), [FilePickerUtils.js](../bluegriffon/extensions/inspector/resources/content/jsutil/system/FilePickerUtils.js)
- Changed `build.sh clean` to preserve the Gecko git clone: instead of `rm -rf "$GECKO_DIR"`, it now removes only build artifacts (`$OBJ_DIR`), the BlueGriffon symlink, `.mozconfig`, and reverts patched files via `git checkout`. This avoids re-downloading the ~1.5GB source tree when re-running setup
- Fixed XML parsing error on macOS launch (`undefined entity &preferencesCmdMac.commandkey;`): added missing macOS-specific DTD entities (from removed `baseMenuOverlay.dtd` and `editMenuOverlay.dtd`) to the locale source of truth at `bluegriffon/locales/en-US/` instead of `bluegriffon/base/locale/en-US/` which gets overwritten during build
- Switched version from `3.2` to `26.02` (CalVer) across `VERSION`, `config/version.txt`, all extension `install.rdf` files, all langpack `install.rdf` files, and docs

## 2026-02-17

- Removed all media disable flags from [mozconfig.macosx](../bluegriffon/config/mozconfig.macosx) (`--disable-av1`, `--disable-ffmpeg`, `--disable-jxl`, `--disable-webspeech`, `--disable-synth-speechd`): each flag causes cascading build failures in Gecko's tightly coupled build system (missing `media_libdav1d_asm`, broken prefs, missing IPDL files). The media code compiles but is unused by the editor. Major build savings already come from `--disable-webrtc` and `--disable-tests`
- Updated [README.md](../README.md): rewrote overview to describe ESR 140 modernization strategy, added project status section, added [docs/CHANGELOG.md](CHANGELOG.md) link, removed Contributing section
- Updated [docs/ROADMAP.md](ROADMAP.md): rewrote Gecko situation section to reflect completed ESR 140 migration and remaining UI work
- Added mozconfig flags to disable unnecessary media features for a text editor: `--disable-av1`, `--disable-ffmpeg`, `--disable-jxl`, `--disable-webspeech`, `--disable-synth-speechd` (skips AV1/dav1d, FFmpeg codecs, JPEG XL, and speech API compilation)
- Removed Gecko revision pinning from `build.sh setup`: the ESR 140 branch only receives security patches and minor fixes, so the setup now uses the branch tip directly from the shallow clone instead of pinning to a specific commit. This eliminates the `git fetch --unshallow` workaround and the "empty string is not a valid pathspec" error. Deleted `config/gecko_dev_revision.txt` and updated all docs
- Fixed 12 remaining `ChromeUtils.importESModule()` calls that were not capturing return values: in Gecko ESR 140 ES modules, the module namespace must be destructured (e.g., `var { Symbol } = ChromeUtils.importESModule(...)`) instead of relying on global side effects. Updated imports across sidebars (`cssproperty.xml`, `aria.xml`), devtools (`bootstrap.js`, `RemoteDebuggerServer.sys.mjs`), base JS (`recentPages.js2`, `printCommands.inc`), and bindings (`cssClassPicker.xml`, `filepickerbutton.xml`, `ecolorpicker.xml`)

## 2026-02-16

- **Modernized BlueGriffon for Gecko ESR 140**: converted all 18 `.jsm` modules to `.sys.mjs` ES modules, replaced 248 `Components.utils.import()` calls with `ChromeUtils.importESModule()` across 122 files, and fixed deprecated API usage
- Fixed prefs preprocessing: changed `JS_PREFERENCE_FILES` to `JS_PREFERENCE_PP_FILES` in [app/moz.build](../bluegriffon/app/moz.build) so `#filter substitution` and `#ifdef` directives in `bluegriffon-prefs.js` are processed at build time
- Converted 18 BlueGriffon `.jsm` modules to `.sys.mjs` ES module format: removed `EXPORTED_SYMBOLS`, added `export` keywords, replaced `Services.jsm` imports (now a built-in global), updated cross-module references to `.sys.mjs`
- Updated [modules/moz.build](../bluegriffon/modules/moz.build) to reference new `.sys.mjs` filenames
- Replaced all 248 `Components.utils.import()` calls across components, main JS, dialogs, sidebars, extensions, prefs, utils, bindings, and txns with `ChromeUtils.importESModule()` using `.sys.mjs` paths; removed all `Services.jsm` imports (Services is now a global)
- Replaced all `Components.utils.reportError()` calls with `console.error()` (14 occurrences across 9 files)
- Fixed removed `nsIDOMWindow`/`nsIDOMChromeWindow` interfaces: replaced `QueryInterface(nsIDOMWindow)` calls with direct usage (enumerator already returns window proxy in ESR 140), replaced `getInterface(nsIDOMWindow)` with `getInterface(nsISupports)` fallback
- Replaced removed `nsIDOMCSSRule` with standard `CSSRule` in [modules/cssHelper.sys.mjs](../bluegriffon/modules/cssHelper.sys.mjs), [modules/cssInspector.sys.mjs](../bluegriffon/modules/cssInspector.sys.mjs), and [modules/fileChanges.sys.mjs](../bluegriffon/modules/fileChanges.sys.mjs)
- Replaced removed `nsIDOMNode`/`nsIDOMNodeFilter` with standard `Node`/`NodeFilter` in [modules/editorHelper.sys.mjs](../bluegriffon/modules/editorHelper.sys.mjs)
- Replaced removed `nsIDOMHTMLDocument`/`nsIDOMHTMLStyleElement` with standard DOM equivalents
- Converted [components/devtools/modules/RemoteDebuggerServer.jsm](../bluegriffon/components/devtools/modules/RemoteDebuggerServer.sys.mjs) to `.sys.mjs` and fixed `Cu.import`/`Cu.unload` calls in devtools bootstrap
- Enhanced [build.sh](../build.sh) with new subcommands: `configure` (run mach configure separately), `open` (launch built .app directly on macOS or binary on Linux), and `clobber` (remove build artifacts while keeping the Gecko source tree)
- Improved [build.sh](../build.sh) `build` subcommand to show platform info, build timing, and built app location on completion
- Improved [build.sh](../build.sh) `run` subcommand to display the built app path before launching
- Improved [build.sh](../build.sh) `status` subcommand to show build directory size, built app path, and ccache availability
- Improved [build.sh](../build.sh) `package` subcommand to list created package files after packaging
- Reorganized [build.sh](../build.sh) help text with typical workflow section and all new commands
- Created [bluegriffon/config/gecko_esr140_toolchain_ld64.patch](../bluegriffon/config/gecko_esr140_toolchain_ld64.patch) to fix ld64 linker detection on Xcode 16+ for both target and host linker (Apple removed "Logging ld64 options" stderr message; also falls back to ld64 on Darwin when no linker is specified)
- Created [bluegriffon/config/gecko_esr140_gen_last_modified.patch](../bluegriffon/config/gecko_esr140_gen_last_modified.patch) to add `bluegriffon` as a valid `MOZ_BUILD_APP` in `gen_last_modified.py`
- Updated [build.sh](../build.sh) to apply required ESR 140 Gecko tree patches automatically during `setup` (separate from broken 2017 patches)
- Clarified in [docs/USAGE.md](USAGE.md), [docs/INSTALL.md](INSTALL.md), and [build.sh](../build.sh) that **patches are NOT required** for BlueGriffon builds (including ARM64 macOS)
- Improved [build.sh](../build.sh) patch diagnostics to show why patches fail when `--apply-patches` is used experimentally
- Switched [build.sh](../build.sh) patch engine from GNU `patch` to `git apply` with per-file progress reporting
- Documented that existing patches are from 2017 (Firefox 55 era) and incompatible with ESR 140 - they exist for historical reference only
- Enabled ccache compiler cache in [bluegriffon/config/mozconfig.macosx](../bluegriffon/config/mozconfig.macosx) for 5-10x faster rebuilds
- Added ccache to [Brewfile](../Brewfile) as required build dependency
- Updated [docs/INSTALL.md](INSTALL.md) to document ccache requirement

- **Build succeeds on macOS ARM64 with Gecko ESR 140** -- first successful compilation, linking, and packaging of BlueGriffon on modern Gecko
- Modernized [app/nsEditorApp.cpp](../bluegriffon/app/nsEditorApp.cpp) for ESR 140: guarded `WindowsDllBlocklist.h` include with `#ifdef XP_WIN`, added `XREShellData.h` include, updated `InitXPCOMGlue()` to use no-arg `BinaryPath::Get()` and `Result`-based `GetBootstrap` API
- Added CoreFoundation framework linkage to [app/moz.build](../bluegriffon/app/moz.build) for macOS (fixes undefined symbols for `CFBundleCopyExecutableURL` etc.)
- Replaced removed `nsXPIDLString.h` with `nsString.h` in [diOSIntegrationFactory.cpp](../bluegriffon/src/diOSIntegration.mac/diOSIntegrationFactory.cpp)
- Converted macOS OS integration component from old `mozilla::Module`/`NSMODULE_DEFN` registration to modern `components.conf` static registration system; created [components.conf](../bluegriffon/src/diOSIntegration.mac/components.conf)
- Patched Gecko `services/settings/dumps/gen_last_modified.py` to recognize `bluegriffon` as a valid `MOZ_BUILD_APP` platform
- Restructured [app/Makefile.in](../bluegriffon/app/Makefile.in): fixed binary copy path to use `$(DIST)/bin/`, skipped `channel-prefs.js` preprocessing on macOS (matches Firefox ESR 140), fixed `tools repackage` target to reference `$(DIST)/bin/$(MOZ_APP_NAME)`, removed dead `LIBXUL_SDK` blocks
- Added `APP_VERSION`, `CODE_NAME`, and `GRE_BUILDID` DEFINES to [base/moz.build](../bluegriffon/base/moz.build) (migrated from Makefile.in shell commands)
- Replaced removed `nsIDOMNode` with `nsISupports` in 8 BlueGriffon IDL files under [bluegriffon/src/dibgutils/](../bluegriffon/src/dibgutils/) (`diIAttrChangedTxn.idl`, `diIAttrNameChangedTxn.idl`, `diIInnerHtmlChangedTxn.idl`, `diINodeInsertionTxn.idl`, `diIRemoveAttributeNSTxn.idl`, `diISetAttributeNSTxn.idl`, `diIStyleAttrChangeTxn.idl`, `diITextNodeChangedTxn.idl`) to fix XPIDL build error with ESR 140 where `nsIDOMNode` is no longer a scriptable interface
- Removed unused `interface nsIDOMNode;` forward declaration from [diIChangeFileStylesheetTxn.idl](../bluegriffon/src/dibgutils/diIChangeFileStylesheetTxn.idl)
- Updated [config/gecko_dev_idl.patch](../bluegriffon/config/gecko_dev_idl.patch) to replace `nsIDOMNode` with `nsISupports` in `nsIEditorMouseObserver` method signatures
- Removed `DEFINES` from all 11 Makefile.in files under `bluegriffon/` (blocked by ESR 140 build system) and migrated them to corresponding moz.build files where possible; created new moz.build files for `installer/` and `installer/windows/`
- Created [Brewfile](../Brewfile) with macOS Homebrew build dependencies (`autoconf`, `python@3.12`)
- Added `--enable-linker=ld64` to [config/mozconfig.macosx](../config/mozconfig.macosx) to fix "Failed to find an adequate linker" error on macOS with Xcode clang 16+ (uses Apple's native linker instead of requiring LLVM `lld`)
- Patched Gecko `toolchain.configure` ld64 detection to recognize Apple's new linker (Xcode 16+ no longer prints "Logging ld64 options")
- Ported [confvars.sh](../confvars.sh) for ESR 140: moved `MOZ_APP_ID`, `MOZ_APP_VENDOR`, `MOZ_DEVTOOLS` to [moz.configure](../moz.configure) as `imply_option()` calls; removed obsolete variables no longer recognized by Gecko
- Changed [build.sh](../build.sh) patches from opt-out (`--skip-patches`) to opt-in (`--apply-patches`) since content patch needs updating for ESR 140
- Updated [docs/INSTALL.md](INSTALL.md) with `brew bundle` prerequisite and resolved Brewfile known gap
- Added `Brewfile` to [docs/FILE_STRUCTURE.md](FILE_STRUCTURE.md) root files listing
- Created [docs/GECKO_PATCHES.md](GECKO_PATCHES.md) documenting all 103 files in `gecko_dev_content.patch` and the IDL patch, grouped by category with BlueGriffon-specific preferences
- Refreshed [docs/INSTALL.md](INSTALL.md) with verify-install section, known gaps, and trimmed duplicate build/run/package content
- Refreshed [docs/USAGE.md](USAGE.md) with examples section, inputs/outputs, and known gaps
- Updated Gecko base from Firefox ~55 (2017, commit `042b84a`) to Firefox ESR 140 (2026, commit `0e1da68`)
- Updated Gecko source repo URL from `mozilla/gecko-dev` to `mozilla-firefox/firefox` (canonical repo moved)
- Created [config/gecko_dev_branch.txt](../config/gecko_dev_branch.txt) with branch `esr140`
- Updated [config/gecko_dev_revision.txt](../config/gecko_dev_revision.txt) to `0e1da68`
- Created [build.sh](../build.sh) to automate Gecko clone, revision pin, patch application, mozconfig setup, build, run, package, and clean
- Added `builds/` to [.gitignore](../.gitignore) for the Gecko source tree checkout
- Updated [docs/INSTALL.md](INSTALL.md) to reference `build.sh` and new Firefox ESR 140 source
- Updated [docs/USAGE.md](USAGE.md) with `build.sh` subcommand documentation
- Updated [README.md](../README.md) quick start to use `build.sh`, updated to ESR 140
- Updated [docs/FILE_STRUCTURE.md](FILE_STRUCTURE.md) to include `build.sh` and `gecko_dev_branch.txt`
- Created [docs/CODE_ARCHITECTURE.md](CODE_ARCHITECTURE.md) with high-level system design, data flow diagram, and key directory overview
- Created [docs/FILE_STRUCTURE.md](FILE_STRUCTURE.md) with full directory map of the project
- Created [docs/INSTALL.md](INSTALL.md) with modern build prerequisites for macOS 14+, Ubuntu 22.04+, and Windows with VS 2022
- Created [docs/USAGE.md](USAGE.md) with build, run, and package instructions
- Created [docs/RELEASE_HISTORY.md](RELEASE_HISTORY.md) with version timeline from v1.0 through v26.02
- Created [docs/ROADMAP.md](ROADMAP.md) with current work, deferred items, and future goals
- Updated [README.md](../README.md) with modern build environments, quick start, documentation links, and credits
- Created `VERSION` file at repo root (synced with `config/version.txt` at `26.02`)
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
