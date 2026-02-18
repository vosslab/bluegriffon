#!/bin/bash
# build.sh -- automate BlueGriffon Gecko setup, build, run, and package
set -euo pipefail

#============================================
# Constants
#============================================
REPO_ROOT="$(cd "$(dirname "$0")" && git rev-parse --show-toplevel)"
BG_APP_DIR="$REPO_ROOT/bluegriffon"
BG_CONFIG_DIR="$BG_APP_DIR/config"
GECKO_REPO_URL="https://github.com/mozilla-firefox/firefox"
DEFAULT_GECKO_DIR="$REPO_ROOT/builds/bluegriffon-source"
GECKO_DIR="$DEFAULT_GECKO_DIR"
GECKO_BRANCH="$(tr -d '[:space:]' < "$BG_CONFIG_DIR/gecko_dev_branch.txt")"
OBJ_DIR="opt"
APPLY_PATCHES=false

#============================================
# Helper functions
#============================================

# print error to stderr and exit
die() {
	echo "ERROR: $*" >&2
	exit 1
}

# print prefixed status message
info() {
	echo "==> $*"
}

# detect platform, returns macosx or ubuntu64
detect_platform() {
	local os_name
	os_name="$(uname -s)"
	case "$os_name" in
		Darwin) echo "macosx" ;;
		Linux)  echo "ubuntu64" ;;
		*)      die "Unsupported platform: $os_name" ;;
	esac
}

# detect logical CPU count
detect_cpu_count() {
	local platform
	platform="$(detect_platform)"
	if [ "$platform" = "macosx" ]; then
		sysctl -n hw.logicalcpu
	else
		nproc
	fi
}

# apply a single patch idempotently with per-file progress and timing
# usage: apply_patch_if_needed <patch_file>
apply_patch_if_needed() {
	local patch_file="$1"
	local patch_name
	patch_name="$(basename "$patch_file")"

	# count files in patch for progress reporting
	local file_count
	file_count="$(grep -c '^--- ' "$patch_file" || echo "unknown")"

	# check if patch is already applied using git
	if git -C "$GECKO_DIR" apply --check --reverse "$patch_file" > /dev/null 2>&1; then
		info "$patch_name already applied ($file_count files), skipping"
		return 0
	fi

	# check if patch can be applied
	local check_output
	check_output="$(git -C "$GECKO_DIR" apply --check "$patch_file" 2>&1)"
	if [ $? -ne 0 ]; then
		echo "ERROR: Patch $patch_name cannot be applied cleanly" >&2
		echo "" >&2
		echo "Git apply check output:" >&2
		echo "$check_output" >&2
		echo "" >&2
		echo "This may indicate:" >&2
		echo "  - Patch conflicts with current Gecko revision" >&2
		echo "  - Patch was already partially applied" >&2
		echo "  - Gecko tree has been modified" >&2
		echo "" >&2
		echo "Current Gecko revision: $(git -C "$GECKO_DIR" rev-parse --short HEAD)" >&2
		echo "Expected branch:   $GECKO_BRANCH" >&2
		die "Patch application failed"
	fi

	info "Applying $patch_name ($file_count files)..."
	local start_time
	start_time="$(date +%s.%N)"

	# apply patch with git apply (faster than GNU patch)
	# track per-file timing
	local current_file=""
	local file_start_time=""
	local files_patched=0

	git -C "$GECKO_DIR" apply --verbose --whitespace=nowarn "$patch_file" 2>&1 | while IFS= read -r line; do
		# parse "Applying: path/to/file" or similar patterns
		if [[ "$line" =~ Applying:.*$ ]] || [[ "$line" =~ ^Checking\ patch\ (.*)\.\.\.$ ]]; then
			# if we have a previous file, report its completion time
			if [ -n "$current_file" ]; then
				local file_end_time
				file_end_time="$(date +%s.%N)"
				local file_duration
				file_duration="$(echo "$file_end_time - $file_start_time" | bc)"
				printf "%s patched in %.2fs\n" "$current_file" "$file_duration"
			fi

			# extract filename from the line
			current_file="$(echo "$line" | sed -E 's/^(Applying|Checking patch): *//' | sed 's/\.\.\.$//')"
			file_start_time="$(date +%s.%N)"
			files_patched=$((files_patched + 1))
			printf "Patching %s...\n" "$current_file"
		fi
	done

	# report final file if there was one
	if [ -n "$current_file" ]; then
		local file_end_time
		file_end_time="$(date +%s.%N)"
		local file_duration
		file_duration="$(echo "$file_end_time - $file_start_time" | bc)"
		printf "%s patched in %.2fs\n" "$current_file" "$file_duration"
	fi

	local end_time
	end_time="$(date +%s.%N)"
	local total_duration
	total_duration="$(echo "$end_time - $start_time" | bc)"
	info "$patch_name applied successfully (${files_patched} files in ${total_duration}s)"
}

# apply required Gecko tree fixes for ESR 140 (always applied, not optional)
# these are separate from the old 2017 patches which are broken
apply_required_gecko_fixes() {
	info "Applying required ESR 140 Gecko tree fixes..."

	# fix ld64 linker detection for Xcode 16+
	apply_patch_if_needed "$BG_CONFIG_DIR/gecko_esr140_toolchain_ld64.patch"

	# add bluegriffon to valid MOZ_BUILD_APP list in gen_last_modified.py
	apply_patch_if_needed "$BG_CONFIG_DIR/gecko_esr140_gen_last_modified.patch"

	info "Required Gecko fixes applied"
}

# locate the built application bundle or binary
# sets APP_PATH to the path if found, empty string otherwise
find_built_app() {
	local platform
	platform="$(detect_platform)"
	if [ "$platform" = "macosx" ]; then
		local app_bundle="$GECKO_DIR/$OBJ_DIR/dist/BlueGriffon.app"
		if [ -d "$app_bundle" ]; then
			echo "$app_bundle"
			return 0
		fi
	else
		local app_bin="$GECKO_DIR/$OBJ_DIR/dist/bin/bluegriffon"
		if [ -x "$app_bin" ]; then
			echo "$app_bin"
			return 0
		fi
	fi
	echo ""
	return 1
}

# format byte count as human-readable size
human_size() {
	local bytes="$1"
	if [ "$bytes" -ge 1073741824 ]; then
		echo "$(echo "scale=1; $bytes / 1073741824" | bc)G"
	elif [ "$bytes" -ge 1048576 ]; then
		echo "$(echo "scale=1; $bytes / 1048576" | bc)M"
	elif [ "$bytes" -ge 1024 ]; then
		echo "$(echo "scale=0; $bytes / 1024" | bc)K"
	else
		echo "${bytes}B"
	fi
}

# verify gecko directory exists
require_gecko_dir() {
	if [ ! -d "$GECKO_DIR" ]; then
		die "Gecko directory not found: $GECKO_DIR\nRun './build.sh setup' first."
	fi
}

# verify setup is complete before build/run/package
require_setup() {
	require_gecko_dir
	if [ ! -L "$GECKO_DIR/bluegriffon" ]; then
		die "BlueGriffon symlink missing in Gecko tree.\nRun './build.sh setup' first."
	fi
	if [ ! -f "$GECKO_DIR/.mozconfig" ]; then
		die ".mozconfig not found in Gecko tree.\nRun './build.sh setup' first."
	fi
}

#============================================
# Subcommand: setup
#============================================
cmd_setup() {
	info "Setting up BlueGriffon build environment"

	# create builds directory if needed
	mkdir -p "$REPO_ROOT/builds"

	# clone Firefox source if not already present
	if [ ! -d "$GECKO_DIR" ]; then
		info "Cloning Firefox $GECKO_BRANCH (shallow, single branch to save disk space)..."
		# shallow clone of just the target branch, no history
		if git clone --depth 1 --single-branch --branch "$GECKO_BRANCH" "$GECKO_REPO_URL" "$GECKO_DIR"; then
			info "Shallow clone succeeded"
		else
			info "Shallow clone failed, falling back to full clone..."
			git clone --branch "$GECKO_BRANCH" "$GECKO_REPO_URL" "$GECKO_DIR"
		fi
	else
		info "Gecko directory already exists: $GECKO_DIR"
	fi

	# create symlink from gecko tree to bluegriffon app directory
	local symlink_target="$GECKO_DIR/bluegriffon"
	if [ -L "$symlink_target" ]; then
		info "BlueGriffon symlink already exists"
	elif [ -e "$symlink_target" ]; then
		die "$symlink_target exists but is not a symlink. Remove it manually."
	else
		info "Creating symlink: $symlink_target -> $BG_APP_DIR"
		ln -sfn "$BG_APP_DIR" "$symlink_target"
	fi

	# apply required Gecko tree fixes (ld64 detection, gen_last_modified)
	apply_required_gecko_fixes

	# old patches are optional and currently broken (from 2017, incompatible with ESR 140)
	if [ "$APPLY_PATCHES" = true ]; then
		info "Attempting to apply patches (experimental, will likely fail)..."
		apply_patch_if_needed "$BG_CONFIG_DIR/gecko_dev_content.patch"
		apply_patch_if_needed "$BG_CONFIG_DIR/gecko_dev_idl.patch"
	else
		info "Skipping patches (not required - patches are from 2017 and incompatible with ESR 140)"
	fi

	# copy mozconfig if not already present
	if [ -f "$GECKO_DIR/.mozconfig" ]; then
		info ".mozconfig already exists, skipping (will not overwrite)"
	else
		local platform
		platform="$(detect_platform)"
		local mozconfig_template="$BG_CONFIG_DIR/mozconfig.$platform"
		if [ ! -f "$mozconfig_template" ]; then
			die "No mozconfig template found for platform: $platform"
		fi

		info "Copying mozconfig template for $platform..."
		cp "$mozconfig_template" "$GECKO_DIR/.mozconfig"

		# auto-detect CPU count and substitute the -j flag
		local cpu_count
		cpu_count="$(detect_cpu_count)"
		info "Detected $cpu_count logical CPUs, setting -j$cpu_count"
		sed -i.bak "s/-j8/-j${cpu_count}/g" "$GECKO_DIR/.mozconfig"
		rm -f "$GECKO_DIR/.mozconfig.bak"

		# on macOS, auto-detect and set the correct SDK path
		if [ "$platform" = "macosx" ]; then
			local sdk_path
			sdk_path="$(xcrun --show-sdk-path 2>/dev/null || true)"
			if [ -n "$sdk_path" ] && [ -d "$sdk_path" ]; then
				info "Detected macOS SDK at $sdk_path"
				sed -i.bak "s|--with-macos-sdk=.*|--with-macos-sdk=${sdk_path}|" "$GECKO_DIR/.mozconfig"
				rm -f "$GECKO_DIR/.mozconfig.bak"
			else
				echo "WARNING: macOS SDK not found via xcrun"
				echo "         Edit $GECKO_DIR/.mozconfig to set the correct SDK path."
			fi
		fi
	fi

	info "Setup complete. Run './build.sh build' to compile."
}

#============================================
# Subcommand: build
#============================================
cmd_build() {
	require_setup

	local platform
	platform="$(detect_platform)"
	local cpu_count
	cpu_count="$(detect_cpu_count)"

	info "Building BlueGriffon..."
	info "  Platform:   $platform"
	info "  CPUs:       $cpu_count"
	info "  Gecko dir:  $GECKO_DIR"
	info "  Object dir: $GECKO_DIR/$OBJ_DIR/"

	local start_time
	start_time="$(date +%s)"

	cd "$GECKO_DIR"
	# unset CONFIG_FILES to avoid collision with Gecko's config_status
	unset CONFIG_FILES
	./mach build

	local end_time
	end_time="$(date +%s)"
	local elapsed=$(( end_time - start_time ))
	local minutes=$(( elapsed / 60 ))
	local seconds=$(( elapsed % 60 ))

	info "Build completed in ${minutes}m ${seconds}s"

	# report the built app location
	local app_path
	app_path="$(find_built_app)" || true
	if [ -n "$app_path" ]; then
		info "Built app: $app_path"
		info "Run './build.sh run' to launch, or './build.sh open' to open directly"
	fi
}

#============================================
# Subcommand: configure
#============================================
cmd_configure() {
	require_setup
	info "Configuring BlueGriffon build..."
	cd "$GECKO_DIR"
	unset CONFIG_FILES
	./mach configure
	info "Configure complete. Run './build.sh build' to compile."
}

#============================================
# Subcommand: run
#============================================
cmd_run() {
	require_setup

	# show where the app is before launching
	local app_path
	app_path="$(find_built_app)" || true
	if [ -n "$app_path" ]; then
		info "Found built app: $app_path"
	else
		info "No built app found yet (will build on first run if needed)"
	fi

	info "Launching BlueGriffon via mach..."
	cd "$GECKO_DIR"
	./mach run
}

#============================================
# Subcommand: open (macOS direct launch)
#============================================
cmd_open() {
	require_setup
	local platform
	platform="$(detect_platform)"

	local app_path
	app_path="$(find_built_app)" || true

	if [ -z "$app_path" ]; then
		die "No built app found. Run './build.sh build' first."
	fi

	if [ "$platform" = "macosx" ]; then
		info "Opening $app_path"
		open "$app_path"
	else
		info "Launching $app_path"
		"$app_path" &
	fi
}

#============================================
# Subcommand: package
#============================================
cmd_package() {
	require_setup
	info "Packaging BlueGriffon..."
	cd "$GECKO_DIR"
	./mach package

	# show package output location
	local dist_dir="$GECKO_DIR/$OBJ_DIR/dist"
	info "Package output directory: $dist_dir"
	if [ -d "$dist_dir" ]; then
		# list any dmg, tar, or zip files produced
		local packages
		packages="$(find "$dist_dir" -maxdepth 1 \( -name '*.dmg' -o -name '*.tar.*' -o -name '*.zip' \) 2>/dev/null || true)"
		if [ -n "$packages" ]; then
			info "Packages created:"
			echo "$packages" | while IFS= read -r pkg; do
				echo "  $pkg"
			done
		fi
	fi
}

#============================================
# Subcommand: clobber
#============================================
cmd_clobber() {
	require_gecko_dir

	local obj_path="$GECKO_DIR/$OBJ_DIR"
	if [ ! -d "$obj_path" ]; then
		info "No build artifacts found at $obj_path"
		return 0
	fi

	# show size before clobber
	local dir_size
	dir_size="$(du -sk "$obj_path" 2>/dev/null | cut -f1 || echo 0)"
	local human
	human="$(human_size $(( dir_size * 1024 )))"
	info "Cleaning build artifacts: $obj_path ($human)"

	cd "$GECKO_DIR"
	./mach clobber

	info "Clobber complete. Run './build.sh build' to recompile."
}

#============================================
# Subcommand: clean
#============================================
cmd_clean() {
	require_gecko_dir

	# remove build artifacts (same as clobber but without requiring mach)
	local obj_path="$GECKO_DIR/$OBJ_DIR"
	if [ -d "$obj_path" ]; then
		local dir_size
		dir_size="$(du -sk "$obj_path" 2>/dev/null | cut -f1 || echo 0)"
		local human
		human="$(human_size $(( dir_size * 1024 )))"
		info "Removing build artifacts: $obj_path ($human)"
		rm -rf "$obj_path"
	fi

	# remove BlueGriffon symlink
	if [ -L "$GECKO_DIR/bluegriffon" ]; then
		info "Removing BlueGriffon symlink"
		rm -f "$GECKO_DIR/bluegriffon"
	fi

	# remove mozconfig
	if [ -f "$GECKO_DIR/.mozconfig" ]; then
		info "Removing .mozconfig"
		rm -f "$GECKO_DIR/.mozconfig" "$GECKO_DIR/.mozconfig.bak"
	fi

	# revert any applied patches by resetting the git tree
	if [ -d "$GECKO_DIR/.git" ]; then
		info "Reverting patched files in Gecko tree"
		git -C "$GECKO_DIR" checkout -- .
	fi

	info "Clean complete. Gecko source preserved at $GECKO_DIR"
	info "Run './build.sh setup' to reconfigure."
}

#============================================
# Subcommand: status
#============================================
cmd_status() {
	echo "BlueGriffon build status"
	echo "========================"
	echo "Repo root:        $REPO_ROOT"
	echo "Gecko dir:        $GECKO_DIR"
	echo "Gecko branch:     $GECKO_BRANCH"
	echo "Platform:         $(detect_platform)"
	echo "CPU count:        $(detect_cpu_count)"
	echo ""

	# check gecko directory
	if [ -d "$GECKO_DIR" ]; then
		echo "Gecko cloned:     yes"
		local current_head
		current_head="$(git -C "$GECKO_DIR" rev-parse --short HEAD 2>/dev/null)"
		echo "Current HEAD:     ${current_head:-unknown}"
	else
		echo "Gecko cloned:     no"
	fi

	# check symlink
	if [ -L "$GECKO_DIR/bluegriffon" ]; then
		echo "Symlink:          yes"
	else
		echo "Symlink:          no"
	fi

	# check required ESR 140 patches
	if [ -d "$GECKO_DIR" ]; then
		for patch_file in "$BG_CONFIG_DIR/gecko_esr140_toolchain_ld64.patch" "$BG_CONFIG_DIR/gecko_esr140_gen_last_modified.patch"; do
			local patch_name
			patch_name="$(basename "$patch_file")"
			if git -C "$GECKO_DIR" apply --check --reverse "$patch_file" > /dev/null 2>&1; then
				echo "Patch $patch_name: applied"
			else
				echo "Patch $patch_name: not applied"
			fi
		done
	fi

	# check old 2017 patches (historical, broken)
	if [ -d "$GECKO_DIR" ]; then
		for patch_file in "$BG_CONFIG_DIR/gecko_dev_content.patch" "$BG_CONFIG_DIR/gecko_dev_idl.patch"; do
			local patch_name
			patch_name="$(basename "$patch_file")"
			if git -C "$GECKO_DIR" apply --check --reverse "$patch_file" > /dev/null 2>&1; then
				echo "Patch $patch_name: applied (legacy)"
			else
				echo "Patch $patch_name: not applied (legacy, expected)"
			fi
		done
	fi

	# check mozconfig
	if [ -f "$GECKO_DIR/.mozconfig" ]; then
		echo "Mozconfig:        yes"
	else
		echo "Mozconfig:        no"
	fi

	echo ""

	# check build artifacts
	local obj_path="$GECKO_DIR/$OBJ_DIR"
	if [ -d "$obj_path" ]; then
		local dir_size
		dir_size="$(du -sk "$obj_path" 2>/dev/null | cut -f1 || echo 0)"
		local human
		human="$(human_size $(( dir_size * 1024 )))"
		echo "Build dir:        $obj_path ($human)"
	else
		echo "Build dir:        not found (not yet built)"
	fi

	# check for built application
	local app_path
	app_path="$(find_built_app)" || true
	if [ -n "$app_path" ]; then
		echo "Built app:        $app_path"
	else
		echo "Built app:        not found"
	fi

	# check for ccache availability
	if command -v ccache > /dev/null 2>&1; then
		local ccache_version
		ccache_version="$(ccache --version 2>/dev/null | head -1)"
		echo "ccache:           $ccache_version"
	else
		echo "ccache:           not installed (recommended: brew install ccache)"
	fi
}

#============================================
# Subcommand: help
#============================================
cmd_help() {
	cat <<'USAGE'
Usage: ./build.sh <command> [options]

Commands:
  setup      Clone Firefox source, pin revision, symlink, configure
  configure  Run mach configure separately (without full build)
  build      Compile BlueGriffon (./mach build)
  run        Launch BlueGriffon via mach (builds if needed)
  open       Launch the built .app directly (macOS) or binary (Linux)
  package    Create distributable package (./mach package)
  clobber    Remove build artifacts but keep the Gecko source tree
  clean      Remove build artifacts, symlink, and mozconfig (keeps Gecko source)
  status     Print build environment and artifact summary
  help       Show this help message

Options:
  --gecko-dir <path>     Override the default Gecko directory location
  --apply-patches        Experimental: attempt to apply patches (broken, from 2017)

Typical workflow:
  ./build.sh setup                     # clone gecko, symlink, configure
  ./build.sh build                     # compile (takes a while)
  ./build.sh run                       # launch via mach
  ./build.sh open                      # launch .app directly (macOS)

Other examples:
  ./build.sh status                    # check build environment
  ./build.sh clobber                   # wipe build artifacts, keep source
  ./build.sh package                   # create distributable .dmg/.tar
  ./build.sh --gecko-dir /tmp/g setup  # use custom gecko location
USAGE
}

#============================================
# Argument parsing and dispatch
#============================================
main() {
	local command=""

	# parse arguments
	while [ $# -gt 0 ]; do
		case "$1" in
			--gecko-dir)
				if [ $# -lt 2 ]; then
					die "--gecko-dir requires a path argument"
				fi
				GECKO_DIR="$2"
				shift 2
				;;
			--apply-patches)
				APPLY_PATCHES=true
				shift
				;;
			setup|configure|build|run|open|package|clobber|clean|status|help)
				command="$1"
				shift
				;;
			*)
				die "Unknown argument: $1\nRun './build.sh help' for usage."
				;;
		esac
	done

	# default to help if no command given
	if [ -z "$command" ]; then
		cmd_help
		exit 0
	fi

	# dispatch to subcommand
	case "$command" in
		setup)     cmd_setup ;;
		configure) cmd_configure ;;
		build)     cmd_build ;;
		run)       cmd_run ;;
		open)      cmd_open ;;
		package)   cmd_package ;;
		clobber)   cmd_clobber ;;
		clean)     cmd_clean ;;
		status)    cmd_status ;;
		help)      cmd_help ;;
	esac
}

main "$@"
