# File structure

Directory map of the BlueGriffon project. See
[docs/CODE_ARCHITECTURE.md](CODE_ARCHITECTURE.md) for how these pieces
connect.

## Root files

| File | Purpose |
| --- | --- |
| `moz.build` | Top-level Mozilla build definition |
| `app.mozbuild` | Application build settings |
| `build.mk` | Make infrastructure |
| `defs.mk` | Shared make definitions |
| `confvars.sh` | Shell variables for the build system |
| `Makefile.in` | Autoconf-generated makefile template |
| `moz.configure` | Mozilla configure script |
| `makefiles.sh` | Makefile generation helper |
| `Brewfile` | macOS Homebrew build dependencies |
| `build.sh` | Automated Gecko setup, build, run, and package |
| `source_me.sh` | Environment setup for development |
| `LICENSE` | Mozilla Public License 2.0 |
| `README.md` | Project overview and quick start |
| `AGENTS.md` | AI agent instructions |
| `VERSION` | Current version number |

## Directories

### `app/` -- application bootstrap

Application entry point, branding icons, and build helpers.

- `application.ini` -- application metadata (name, version, Gecko version)
- `nsEditorApp.cpp` -- C++ application startup
- `macversion.py` -- macOS version info build helper
- `icons/` -- application icons
- `macbuild/` -- macOS-specific build resources
- `profile/` -- default profile files

### `base/` -- core editor

The main BlueGriffon application code.

- `content/` -- XUL overlays, dialogs, toolbars, and editor JavaScript
- `locale/` -- locale-specific strings for the base application
- `res/` -- static resources (icons, default stylesheets)
- `jar.mn` / `jar.mn.in` -- JAR manifest for chrome packaging

### `branding/` -- branding assets

Application branding images, icons, and metadata used during packaging.

### `components/` -- XPCOM components

JavaScript and C++ components registered with XPCOM:

- `bgCharUnicodeAutocomplete.js` -- Unicode character autocomplete
- `bgCommandHandler.js` -- command dispatch handler
- `bgLocationAutocomplete.js` -- URL bar autocomplete
- `fuelApplication.js` -- FUEL application API
- `phpStreamConverter.js` -- PHP stream conversion
- `devtools/` -- developer tools components

### `config/` -- build configuration

- `gecko_dev_branch.txt` -- Gecko branch name (`esr140`)
- `gecko_dev_content.patch` -- content-layer patch for Gecko
- `gecko_dev_idl.patch` -- IDL interface patch for Gecko
- `mozilla_central_revision.txt` -- legacy Mercurial revision reference
- `version.txt` -- BlueGriffon version (`3.2`)
- `codename.txt` -- release codename (`"Artemus"`)
- `mozconfig.macosx` -- macOS mozconfig template
- `mozconfig.ubuntu64` -- Ubuntu 64-bit mozconfig template
- `mozconfig.win` -- Windows mozconfig template
- `linux/` -- Linux-specific build configs
- `win/` -- Windows-specific build configs

### `devel/` -- development tools

- `commit_changelog.py` -- changelog generation helper

### `docs/` -- documentation

Project documentation in Markdown. See
[docs/REPO_STYLE.md](REPO_STYLE.md) for naming conventions.

### `extensions/` -- add-on extensions

Each subdirectory is a self-contained extension:

- `inspector/` -- DOM and CSS inspector
- `svg-edit/` -- SVG editing support
- `markdown/` -- Markdown editing mode
- `scripteditor/` -- script editing panel
- `gfd/` -- GFD editor tools
- `fs/` -- file system utilities
- `op1/` -- OP1 editing features

### `installer/` -- packaging

Platform-specific installer and packaging scripts.

- `linux/` -- Linux packaging
- `windows/` -- Windows installer (NSIS)
- `package-manifest.in` -- files included in the package
- `removed-files.in` -- files removed during upgrade

### `langpacks/` -- language packs

Standalone language pack extensions for distribution.

### `locales/` -- localization

Translation files organized by locale code. Supported languages include:

`cs`, `de`, `en-US`, `es-ES`, `fi`, `fr`, `gl`, `he`, `hu`, `it`, `ja`,
`ko`, `nl`, `pl`, `pt-PT`, `ru`, `sl`, `sr`, `sv-SE`, `zh-CN`, `zh-TW`

### `modules/` -- shared JS modules

Reusable JavaScript modules (`.jsm` files) loaded via
`Components.utils.import()`:

- `editorHelper.jsm` -- editor utility functions
- `fileHelper.jsm` -- file operations
- `filePicker.jsm` -- file picker dialogs
- `cssHelper.jsm` -- CSS manipulation helpers
- `cssInspector.jsm` -- CSS inspection tools
- `cssProperties.jsm` -- CSS property database
- `colourPickerHelper.jsm` -- color picker integration
- `unicodeHelper.jsm` -- Unicode utilities
- `l10nHelper.jsm` -- localization helpers
- `urlHelper.jsm` -- URL handling
- `screens.jsm` -- screen/display management
- `projectManager.jsm` -- project management
- `prompterHelper.jsm` -- prompt/dialog helpers
- `printHelper.jsm` -- print support
- `handlersManager.jsm` -- handler registration
- `fileChanges.jsm` -- file change tracking
- `bgQuit.jsm` -- application quit handling
- `fireFtp.jsm` -- FTP integration

### `sidebars/` -- sidebar panels

Dockable sidebar panels for specialized editing:

- `cssproperties/` -- CSS property inspector
- `domexplorer/` -- DOM tree explorer
- `scripteditor/` -- inline script editor
- `stylesheets/` -- stylesheet manager
- `aria/` -- ARIA accessibility attributes
- `its20/` -- ITS 2.0 internationalization tags

### `src/` -- additional source

- `dibgutils/` -- BlueGriffon utility library
- `diOSIntegration.mac/` -- macOS integration code

### `tests/` -- test infrastructure

Test scripts run with pytest:

- `test_pyflakes_code_lint.py` -- pyflakes static analysis gate
- `test_ascii_compliance.py` -- ASCII/ISO-8859-1 encoding check
- `test_whitespace.py` -- whitespace and formatting checks
- `test_shebangs.py` -- shebang line validation
- `test_indentation.py` -- indentation style checks
- `test_bandit_security.py` -- security linting
- `test_import_requirements.py` -- import dependency checks
- `test_import_star.py` -- wildcard import detection
- `check_ascii_compliance.py` -- single-file ASCII checker
- `fix_ascii_compliance.py` -- single-file ASCII fixer
- `fix_whitespace.py` -- whitespace fixer
- `git_file_utils.py` -- shared Git utility module

### `themes/` -- visual themes

Platform-specific editor themes:

- `mac/` -- macOS theme (CSS and images)
- `win/` -- Windows theme
- `win.old/` -- archived Windows theme
