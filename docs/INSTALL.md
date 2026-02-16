# Install

Build prerequisites and setup instructions for BlueGriffon.

## Platform requirements

### macOS

- macOS 14+ (Sonoma or later)
- Xcode 16+ with command-line tools
- Native ARM64 support for Apple Silicon (M1/M2/M3/M4)
- Clang (provided by Xcode)

### Linux

- Ubuntu 22.04+ LTS (or equivalent)
- GCC or Clang toolchain
- GTK3 development libraries
- Standard Mozilla build dependencies (autoconf 2.13, yasm, etc.)

### Windows

- Windows 10 or later
- Visual Studio 2022 with C++ workload
- MozillaBuild environment

**Windows locale note:** both Windows and Visual Studio should use the same
locale (preferably en-US). Mismatched locales can cause build failures.

## Gecko setup

BlueGriffon builds inside a Mozilla Gecko source tree. The Gecko version is
pinned to a specific commit for stability.

### 1. Clone Gecko

```bash
git clone https://github.com/mozilla/gecko-dev bluegriffon-source
cd bluegriffon-source
```

### 2. Checkout the pinned revision

The required Gecko commit is stored in
[config/gecko_dev_revision.txt](../config/gecko_dev_revision.txt).

```bash
git reset --hard $(cat bluegriffon/config/gecko_dev_revision.txt)
```

### 3. Clone BlueGriffon into the tree

```bash
git clone <your-bluegriffon-repo-url> bluegriffon
```

### 4. Apply patches

Two patches modify Gecko for BlueGriffon compatibility:

```bash
patch -p 1 < bluegriffon/config/gecko_dev_content.patch
patch -p 1 < bluegriffon/config/gecko_dev_idl.patch
```

## Configure the build

Create a `.mozconfig` file in the `bluegriffon-source` root directory.
Template configs are provided in the [config/](../config/) directory:

| Template | Platform |
| --- | --- |
| `config/mozconfig.macosx` | macOS |
| `config/mozconfig.ubuntu64` | Ubuntu 64-bit |
| `config/mozconfig.win` | Windows (32-bit and 64-bit options) |

Copy the appropriate template and adjust for your system:

```bash
cp bluegriffon/config/mozconfig.macosx .mozconfig
```

Edit `.mozconfig` to set the correct SDK path and parallelism (`-j` flag)
for your machine.

### macOS mozconfig notes

The template references a macOS SDK path. Update it to match your Xcode
installation:

```
ac_add_options --with-macos-sdk=/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk
```

For ARM64 (Apple Silicon), ensure no `--target` flag forces x86_64.

## Build

```bash
./mach build
```

## Run

Launch BlueGriffon with a temporary profile:

```bash
./mach run
```

## Package

Create a distributable package:

```bash
./mach package
```

## Troubleshooting

- If the build fails with SDK errors on macOS, verify the SDK path in
  `.mozconfig` matches your installed Xcode version.
- Adjust the `-j` flag in `MOZ_MAKE_FLAGS` to match your CPU core count.
- On Windows, run builds from the MozillaBuild shell, not PowerShell or CMD.
- See Mozilla's
  [build documentation](https://firefox-source-docs.mozilla.org/setup/index.html)
  for general Gecko build prerequisites.
