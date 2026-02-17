# Brewfile -- macOS build dependencies for BlueGriffon
# Install with: brew bundle
# After a successful build, node and cbindgen can be uninstalled.

# Build toolchain (Xcode CLT provides clang/clang++)
brew "autoconf"

# Python for Gecko's mach build system
brew "python@3.12"

# Build-time only (safe to uninstall after build completes)
brew "node"

# Compiler cache for 5-10x faster rebuilds (required by mozconfig)
brew "ccache"
