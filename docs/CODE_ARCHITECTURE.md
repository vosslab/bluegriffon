# Code architecture

High-level system design of BlueGriffon, an open-source WYSIWYG HTML editor
built on Mozilla's Gecko rendering engine.

## Overview

BlueGriffon is a XUL application that uses Mozilla's Gecko engine (the same
engine behind Firefox) to render and edit web content. The user interface is
defined in XUL (XML User Interface Language) and styled with CSS. Application
logic is written in JavaScript and C++, with XPCOM providing the component
bridge between the two.

## Core data flow

```
+------------------+     +---------------------+     +------------------+
| XUL UI overlays  | --> | JavaScript handlers | --> | Gecko rendering  |
| (base/content/)  |     | (modules/, base/)   |     | engine           |
+------------------+     +---------------------+     +------------------+
        ^                         |                          |
        |                         v                          v
        |                 +----------------+         +----------------+
        +-----------------| XPCOM bridge   |         | HTML document  |
                          | (components/)  |         | output         |
                          +----------------+         +----------------+
```

1. XUL files in `base/content/` define the editor UI (menus, toolbars, panels).
2. JavaScript handlers in `modules/` and `base/content/` respond to user
   actions and manipulate the document through Gecko's editing APIs.
3. XPCOM components in `components/` provide native services (autocomplete,
   command handling, PHP stream conversion) accessible from both JS and C++.
4. Gecko renders the live HTML preview and exposes editing interfaces.

## Gecko dependency

BlueGriffon depends on Mozilla's Gecko engine, pinned to commit `042b84a` in
[config/gecko_dev_revision.txt](../config/gecko_dev_revision.txt). During
build setup, the builder clones `mozilla/gecko-dev`, checks out this pinned
revision, and applies two patches:

- `config/gecko_dev_content.patch` -- content-layer modifications
- `config/gecko_dev_idl.patch` -- IDL interface additions

This is a stable, pinned dependency. Mozilla dropped XUL support after
Firefox 57 (November 2017), so this Gecko revision represents the last
compatible engine version.

## Build system

The build uses Mozilla's `mach` tool and `moz.build` files throughout the
tree. Each directory contains a `moz.build` that declares which files get
compiled, packaged, or installed. JAR manifests (`jar.mn`) control how
resources are bundled into chrome packages for the XUL runtime.

Key build files at the repo root:

- `moz.build` -- top-level build definition
- `app.mozbuild` -- application-level build settings
- `confvars.sh` -- shell variables for the build system
- `build.mk` / `defs.mk` -- make infrastructure

## Key directories

| Directory | Purpose |
| --- | --- |
| `app/` | Application bootstrap, branding, `application.ini` |
| `base/` | Core editor: XUL content, locale, resources |
| `base/content/` | XUL overlays, dialogs, and editor JS |
| `base/res/` | Static resources (icons, default stylesheets) |
| `components/` | XPCOM components (JS and C++) |
| `modules/` | Shared JavaScript modules (`.jsm` files) |
| `extensions/` | Add-on extensions (inspector, svg-edit, markdown) |
| `sidebars/` | Sidebar panels (CSS properties, DOM explorer) |
| `themes/` | Visual themes (classic, modern) |
| `config/` | Build configs, mozconfigs, Gecko revision pin |
| `locales/` | Localization files for 20+ languages |
| `installer/` | Packaging and installer scripts |

## Extension system

Extensions live in `extensions/` and follow the Mozilla add-on pattern. Each
extension has its own `moz.build`, content overlays, and locale files.
Current extensions include:

- `inspector/` -- DOM and CSS inspector tools
- `svg-edit/` -- SVG editing support
- `markdown/` -- Markdown editing mode
- `scripteditor/` -- script editing panel
- `gfd/`, `fs/`, `op1/` -- additional editing tools

## Sidebar panels

Sidebars in `sidebars/` provide dockable panels for specialized editing:

- `cssproperties/` -- CSS property inspector
- `domexplorer/` -- DOM tree explorer
- `scripteditor/` -- inline script editor
- `stylesheets/` -- stylesheet manager
- `aria/` -- ARIA accessibility attributes
- `its20/` -- ITS 2.0 internationalization

## Module system

Shared JavaScript modules in `modules/` use the `.jsm` (JavaScript Module)
format loaded via `Components.utils.import()`. These provide reusable
services for file handling, CSS inspection, color picking, Unicode helpers,
localization, and more.

## Themes

The `themes/` directory contains platform-specific visual themes:

- `mac/` -- macOS theme
- `win/` -- Windows theme

Each theme provides CSS stylesheets and image assets that control the look
and feel of the editor chrome on each platform.
