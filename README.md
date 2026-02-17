# BlueGriffon

An open-source WYSIWYG HTML editor built on Mozilla's Gecko rendering engine.

BlueGriffon was originally created by Daniel Glazman (Disruptive Innovations
SARL) around 2006, based on the Nvu editor lineage from Mozilla Composer.
The current version is 3.2 (codename "Artemus"), now maintained by
Neil R. Voss.

## Quick start

```bash
./build.sh setup    # clone gecko, pin revision, apply patches, configure
./build.sh build    # compile
./build.sh run      # launch the editor
```

For manual setup without the script, see [docs/INSTALL.md](docs/INSTALL.md).
See [docs/USAGE.md](docs/USAGE.md) for all subcommands and build options.

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

BlueGriffon builds inside a Mozilla Gecko source tree (Firefox ESR 140). The
[build.sh](build.sh) script automates the full setup: cloning the Firefox
source from the ESR 140 branch tip, applying patches, and configuring the
build.

See [docs/INSTALL.md](docs/INSTALL.md) for manual setup or platform-specific
details.

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
