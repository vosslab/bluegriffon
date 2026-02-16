# BlueGriffon

An open-source WYSIWYG HTML editor built on Mozilla's Gecko rendering engine.

BlueGriffon was originally created by Daniel Glazman (Disruptive Innovations
SARL) around 2006, based on the Nvu editor lineage from Mozilla Composer.
The current version is 3.2 (codename "Artemus"), now maintained by
Neil R. Voss.

## Quick start

1. Set up the Gecko source tree and build environment --
   see [docs/INSTALL.md](docs/INSTALL.md)
2. Build: `./mach build`
3. Run: `./mach run`
4. Package: `./mach package`

See [docs/USAGE.md](docs/USAGE.md) for details on build options and
development workflow.

## Build environments

- macOS 14+ (Sonoma) with Xcode 16+, native ARM64 for Apple Silicon
- Ubuntu 22.04+ LTS
- Windows 10+ with Visual Studio 2022

## Documentation

- [docs/INSTALL.md](docs/INSTALL.md) -- setup and build prerequisites
- [docs/USAGE.md](docs/USAGE.md) -- how to build, run, and package
- [docs/CODE_ARCHITECTURE.md](docs/CODE_ARCHITECTURE.md) -- system design
- [docs/FILE_STRUCTURE.md](docs/FILE_STRUCTURE.md) -- directory map
- [docs/RELEASE_HISTORY.md](docs/RELEASE_HISTORY.md) -- version timeline
- [docs/ROADMAP.md](docs/ROADMAP.md) -- planned work and priorities

## Build setup

BlueGriffon builds inside a Mozilla Gecko source tree. Clone `gecko-dev`,
check out the pinned revision from
[config/gecko_dev_revision.txt](config/gecko_dev_revision.txt), apply the
patches in [config/](config/), and create a `.mozconfig` from the provided
templates.

```bash
git clone https://github.com/mozilla/gecko-dev bluegriffon-source
cd bluegriffon-source
git reset --hard $(cat bluegriffon/config/gecko_dev_revision.txt)
patch -p 1 < bluegriffon/config/gecko_dev_content.patch
patch -p 1 < bluegriffon/config/gecko_dev_idl.patch
cp bluegriffon/config/mozconfig.macosx .mozconfig
./mach build
```

See [docs/INSTALL.md](docs/INSTALL.md) for full instructions.

## Contributing

- Code contributions via pull requests are welcome.
- Localization: translate files in the `locales/` directory from `en-US`
  into a new locale and submit a pull request.

## License

This project is licensed under the
[Mozilla Public License 2.0](LICENSE). Individual source files may reference
the MPL 1.1 / GPL 2.0 / LGPL 2.1 tri-license from the original codebase.

## Credits

- **Daniel Glazman** -- original author and creator of BlueGriffon
  (Disruptive Innovations SARL)
- **Neil R. Voss** -- current maintainer
  (https://bsky.app/profile/neilvosslab.bsky.social)

See [docs/AUTHORS.md](docs/AUTHORS.md) for full author details.
