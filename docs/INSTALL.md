# Install

BlueGriffon is a C++ application built on Mozilla's Gecko engine. "Installed"
means you have compiled the source inside a Gecko tree and can launch the
editor with `./build.sh run` or `./mach run`.

## Requirements

### All platforms

- Git
- ~4 GB free disk space for the Gecko source tree
- Internet connection for the initial clone

### macOS

- macOS 14+ (Sonoma or later)
- Xcode 16+ with command-line tools
- Clang (provided by Xcode)
- Native ARM64 support for Apple Silicon (M1/M2/M3/M4)
- Homebrew packages (install with `brew bundle` from the repo root, see
  [Brewfile](../Brewfile))

### Linux

- Ubuntu 22.04+ LTS (or equivalent)
- GCC or Clang toolchain
- GTK3 development libraries
- Standard Mozilla build dependencies (autoconf 2.13, yasm, etc.)

### Windows

- Windows 10 or later
- Visual Studio 2022 with C++ workload
- MozillaBuild environment
- Both Windows and Visual Studio should use the same locale (preferably en-US)

### Development tools (optional)

Python 3.12 and dev dependencies for running tests:

```bash
source source_me.sh && pip install -r pip_requirements-dev.txt
```

## Install steps

### Automated (recommended)

The [build.sh](../build.sh) script handles the full Gecko setup:

```bash
./build.sh setup
./build.sh build
```

See [docs/USAGE.md](USAGE.md) for all subcommands and options.

### Manual

1. Clone the Firefox source (ESR 140 branch):

```bash
git clone --branch esr140 https://github.com/mozilla-firefox/firefox bluegriffon-source
cd bluegriffon-source
```

2. Pin to the required revision from
   [config/gecko_dev_revision.txt](../config/gecko_dev_revision.txt):

```bash
git reset --hard $(cat bluegriffon/config/gecko_dev_revision.txt)
```

3. Symlink or clone BlueGriffon into the tree:

```bash
ln -sfn /path/to/bluegriffon bluegriffon
```

4. Apply patches:

```bash
patch -p 1 < bluegriffon/config/gecko_dev_content.patch
patch -p 1 < bluegriffon/config/gecko_dev_idl.patch
```

5. Copy a mozconfig template and adjust for your system:

```bash
cp bluegriffon/config/mozconfig.macosx .mozconfig
```

Available templates: `mozconfig.macosx`, `mozconfig.ubuntu64`, `mozconfig.win`
in [config/](../config/). Edit `.mozconfig` to set the correct SDK path and
`-j` flag for your CPU count.

6. Build and run:

```bash
./mach build
./mach run
```

## Verify install

After building, confirm the editor launches:

```bash
./build.sh run
```

Or from the Gecko tree directly:

```bash
./mach run
```

BlueGriffon should open a window with the WYSIWYG editor interface.

## Troubleshooting

- If the build fails with SDK errors on macOS, verify the SDK path in
  `.mozconfig` matches your installed Xcode version.
- Adjust the `-j` flag in `MOZ_MAKE_FLAGS` to match your CPU core count.
  `build.sh setup` auto-detects this.
- On Windows, run builds from the MozillaBuild shell, not PowerShell or CMD.
- See Mozilla's
  [build documentation](https://firefox-source-docs.mozilla.org/setup/index.html)
  for general Gecko build prerequisites.

## Known gaps

- [ ] Verify exact minimum Xcode version required for ESR 140 build
- [ ] Document Mozilla system dependency bootstrap (`./mach bootstrap`)
- [ ] Confirm Windows build with current patches and ESR 140
- [x] Document Homebrew packages needed on macOS (see [Brewfile](../Brewfile))
