# Release history

BlueGriffon version timeline from initial release to the current version.

## Origins

BlueGriffon was created by Daniel Glazman (Disruptive Innovations SARL)
around 2006. It descends from the Nvu editor, which itself derived from
Mozilla Composer. BlueGriffon was built from the ground up as a modern
WYSIWYG HTML editor using Mozilla's Gecko rendering engine and the XUL
application framework.

## Version timeline

| Version | Notes |
| --- | --- |
| 1.0 | Initial stable release; basic HTML editing with Gecko |
| 1.1 - 1.7 | Incremental improvements, CSS editing, UI polish |
| 2.0 | Major update; modernized interface, new extension system |
| 2.1 - 2.4 | Continued improvements; dropped 32-bit universal builds on macOS |
| 3.0 | Architecture refresh; updated Gecko integration |
| 3.1 | Stability and feature updates |
| 3.2 | Last original release, codename "Artemus" |
| 26.02 | Modernized for Gecko ESR 140; CalVer versioning |

## Gecko sync history

BlueGriffon tracks a pinned revision of Mozilla's Gecko engine. The last
major Gecko sync occurred in 2017, pinned to commit `042b84a`. Mozilla
dropped XUL support after Firefox 57 (November 2017), which is why the
Gecko revision has not advanced since then.

## Current maintenance

BlueGriffon is now maintained by Neil R. Voss. Current work focuses on
documentation, build system cleanup, CodeMirror updates, and Python script
modernization. See [docs/ROADMAP.md](ROADMAP.md) for planned work.
