# Usage

How to build, run, and package BlueGriffon. For full setup instructions see
[docs/INSTALL.md](INSTALL.md).

## Prerequisites

Complete the Gecko setup and mozconfig configuration described in
[docs/INSTALL.md](INSTALL.md) before building.

## Build

Compile BlueGriffon from the Gecko source root:

```bash
./mach build
```

## Run

Launch BlueGriffon with a temporary profile (useful for testing):

```bash
./mach run
```

## Package

Create a distributable archive or installer:

```bash
./mach package
```

The output location depends on your platform and the `MOZ_OBJDIR` setting
in `.mozconfig`.

## Mozconfig

The `.mozconfig` file controls build options. Copy a template from the
[config/](../config/) directory and adapt it:

```bash
cp bluegriffon/config/mozconfig.macosx .mozconfig
```

Available templates:

- `config/mozconfig.macosx` -- macOS
- `config/mozconfig.ubuntu64` -- Ubuntu 64-bit
- `config/mozconfig.win` -- Windows

Key settings to adjust:

- `MOZ_MAKE_FLAGS="-j8"` -- set to your CPU core count
- `--with-macos-sdk=...` -- macOS SDK path (macOS only)
- Optimize vs. debug flags (see comments in the template)

## Development workflow

### Running tests

```bash
source source_me.sh && python -m pytest tests/
```

Run a specific test file:

```bash
source source_me.sh && python -m pytest tests/test_pyflakes_code_lint.py
```

### Project files

- Version: [config/version.txt](../config/version.txt) (currently `3.2`)
- Codename: [config/codename.txt](../config/codename.txt) (`"Artemus"`)
- Gecko revision: [config/gecko_dev_revision.txt](../config/gecko_dev_revision.txt)
