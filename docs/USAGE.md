# Usage

How to build, run, and package BlueGriffon. For setup instructions see
[docs/INSTALL.md](INSTALL.md).

## Quick start

```bash
./build.sh setup  # clone gecko, pin revision, configure (skips outdated patches)
./build.sh build  # compile
./build.sh run    # launch the editor
```

**Note**: Gecko patches are **not required** and are skipped by default. The patches in this repo are from 2017 (Firefox 55 era) and are incompatible with ESR 140 - they will fail to apply. See [docs/GECKO_PATCHES.md](GECKO_PATCHES.md) for historical context.

## CLI -- build.sh

The [build.sh](../build.sh) script automates all Gecko setup and build steps.

### Subcommands

| Command | Action |
| --- | --- |
| `setup` | Clone Firefox source (ESR 140), pin revision, symlink, copy mozconfig |
| `configure` | Run `./mach configure` separately (without full build) |
| `build` | Compile BlueGriffon (`./mach build`) with timing and artifact info |
| `run` | Launch BlueGriffon via `./mach run` |
| `open` | Launch the built `.app` directly (macOS) or binary (Linux) |
| `package` | Create distributable package (`./mach package`) |
| `clobber` | Remove build artifacts but keep the Gecko source tree |
| `clean` | Remove the entire downloaded Gecko source tree |
| `status` | Print diagnostic summary of the build environment and artifacts |
| `help` | Show usage (default if no args) |

### Options

| Option | Description |
| --- | --- |
| `--apply-patches` | **Experimental:** Attempt to apply patches (currently broken - patches are from 2017 and incompatible with ESR 140) |
| `--gecko-dir <path>` | Override default Gecko directory (`builds/bluegriffon-source`) |

```bash
./build.sh setup                             # normal setup (no patches needed)
./build.sh --gecko-dir /tmp/gecko-tree setup # use custom gecko location
./build.sh --apply-patches setup             # experimental: will fail (patches are from 2017)
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
./build.sh run      # launch via mach
./build.sh open     # or open .app directly (macOS)
```

Create a distributable package after building:

```bash
./build.sh package
```

Clean build artifacts without re-downloading Gecko:

```bash
./build.sh clobber  # wipe build artifacts, keep source
./build.sh build    # recompile from scratch
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
5. Skips patches (patches are optional and currently broken - from 2017, incompatible with ESR 140)
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
- `--with-ccache` -- compiler cache enabled by default (provides 5-10x faster rebuilds)
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

Build artifacts go into the `MOZ_OBJDIR` directory (default `opt/` inside the Gecko tree):

- macOS app bundle: `builds/bluegriffon-source/opt/dist/BlueGriffon.app`
- Linux binary: `builds/bluegriffon-source/opt/dist/bin/bluegriffon`
- Distributable package created by `./build.sh package`

Run `./build.sh status` to see the current build directory size and app location.

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

- [ ] Add `--dry-run` flag to `build.sh setup` to preview actions without executing
- [ ] Document debug build workflow (toggle optimize/debug flags in mozconfig)
