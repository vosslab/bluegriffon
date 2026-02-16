# Usage

How to build, run, and package BlueGriffon. For setup instructions see
[docs/INSTALL.md](INSTALL.md).

## Quick start

```bash
./build.sh setup    # clone gecko, pin revision, apply patches, configure
./build.sh build    # compile
./build.sh run      # launch the editor
```

## CLI -- build.sh

The [build.sh](../build.sh) script automates all Gecko setup and build steps.

### Subcommands

| Command | Action |
| --- | --- |
| `setup` | Clone Firefox source (ESR 140), pin revision, symlink, apply patches, copy mozconfig |
| `build` | Compile BlueGriffon (`./mach build`) |
| `run` | Launch BlueGriffon (`./mach run`) |
| `package` | Create distributable package (`./mach package`) |
| `clean` | Remove the downloaded Gecko source tree |
| `status` | Print diagnostic summary of the build environment |
| `help` | Show usage (default if no args) |

### Options

`--gecko-dir <path>` overrides the default Gecko directory
(`builds/bluegriffon-source`).

```bash
./build.sh --gecko-dir /tmp/gecko-tree setup
```

## Examples

Check build environment before starting:

```bash
./build.sh status
```

Full setup and build:

```bash
./build.sh setup
./build.sh build
./build.sh run
```

Create a distributable package after building:

```bash
./build.sh package
```

Remove the Gecko tree and start fresh:

```bash
./build.sh clean
./build.sh setup
```

## What setup does

1. Creates a `builds/` directory in the repo root
2. Shallow-clones the Firefox source from the branch in
   `config/gecko_dev_branch.txt` (no history, saves disk space)
3. Pins Gecko to the revision in `config/gecko_dev_revision.txt`
4. Creates a symlink from the Gecko tree to the BlueGriffon app directory
5. Applies `gecko_dev_content.patch` and `gecko_dev_idl.patch` (idempotent)
6. Copies the platform-appropriate mozconfig template and sets the `-j` flag
   to your CPU count

## Mozconfig

The `.mozconfig` file controls build options. `build.sh setup` copies the
right template automatically. For manual setup, copy a template from
[config/](../config/):

Available templates:

- `config/mozconfig.macosx` -- macOS
- `config/mozconfig.ubuntu64` -- Ubuntu 64-bit
- `config/mozconfig.win` -- Windows

Key settings to adjust:

- `MOZ_MAKE_FLAGS="-j8"` -- set to your CPU core count
- `--with-macos-sdk=...` -- macOS SDK path (macOS only)
- Optimize vs. debug flags (see comments in the template)

## Inputs and outputs

### Inputs

- Gecko source tree -- cloned by `build.sh setup` into `builds/bluegriffon-source`
- [config/gecko_dev_revision.txt](../config/gecko_dev_revision.txt) -- pinned commit
- [config/gecko_dev_branch.txt](../config/gecko_dev_branch.txt) -- Gecko branch (`esr140`)
- [config/gecko_dev_content.patch](../config/gecko_dev_content.patch) -- content-layer Gecko patch
- [config/gecko_dev_idl.patch](../config/gecko_dev_idl.patch) -- IDL interface patch
- `.mozconfig` -- build configuration (generated from templates in `config/`)

### Outputs

- Compiled binary in the `MOZ_OBJDIR` directory (default `opt/` inside the Gecko tree)
- Distributable package created by `./build.sh package`

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
- Gecko branch: [config/gecko_dev_branch.txt](../config/gecko_dev_branch.txt)

## Known gaps

- [ ] Document output location per platform after `./build.sh package`
- [ ] Add `--dry-run` flag to `build.sh setup` to preview actions without executing
- [ ] Document debug build workflow (toggle optimize/debug flags in mozconfig)
