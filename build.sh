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
GECKO_REVISION="$(tr -d '[:space:]' < "$BG_CONFIG_DIR/gecko_dev_revision.txt")"
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

# apply a single patch idempotently
# usage: apply_patch_if_needed <patch_file>
apply_patch_if_needed() {
	local patch_file="$1"
	local patch_name
	patch_name="$(basename "$patch_file")"

	# check if patch can still be applied
	if patch --dry-run --forward -p 1 -d "$GECKO_DIR" < "$patch_file" > /dev/null 2>&1; then
		info "Applying $patch_name..."
		patch --forward -p 1 -d "$GECKO_DIR" < "$patch_file"
	# check if patch is already applied (reverse succeeds)
	elif patch --dry-run --reverse -p 1 -d "$GECKO_DIR" < "$patch_file" > /dev/null 2>&1; then
		info "$patch_name already applied, skipping"
	else
		die "Patch $patch_name cannot be applied or reversed cleanly"
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

	# pin to the required revision if HEAD does not already match
	# compare using the same prefix length as the stored revision
	local rev_len=${#GECKO_REVISION}
	local current_head
	current_head="$(git -C "$GECKO_DIR" rev-parse HEAD | cut -c1-"$rev_len")"
	if [ "$current_head" = "$GECKO_REVISION" ]; then
		info "Gecko already at revision $GECKO_REVISION"
	else
		info "Pinning Gecko to revision $GECKO_REVISION (currently at $current_head)..."
		# use git checkout for commits already in the local history
		git -C "$GECKO_DIR" checkout "$GECKO_REVISION" 2>/dev/null \
			|| git -C "$GECKO_DIR" checkout "$(git -C "$GECKO_DIR" rev-list --all | grep "^${GECKO_REVISION}")" \
			|| die "Revision $GECKO_REVISION not found. Try './build.sh clean' then './build.sh setup'."
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

	# apply patches only when explicitly requested
	if [ "$APPLY_PATCHES" = true ]; then
		info "Applying patches..."
		apply_patch_if_needed "$BG_CONFIG_DIR/gecko_dev_content.patch"
		apply_patch_if_needed "$BG_CONFIG_DIR/gecko_dev_idl.patch"
	else
		info "Skipping patches (use --apply-patches to apply)"
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
	info "Building BlueGriffon..."
	cd "$GECKO_DIR"
	# unset CONFIG_FILES to avoid collision with Gecko's config_status
	unset CONFIG_FILES
	./mach build
}

#============================================
# Subcommand: run
#============================================
cmd_run() {
	require_setup
	info "Running BlueGriffon..."
	cd "$GECKO_DIR"
	./mach run
}

#============================================
# Subcommand: package
#============================================
cmd_package() {
	require_setup
	info "Packaging BlueGriffon..."
	cd "$GECKO_DIR"
	./mach package
}

#============================================
# Subcommand: clean
#============================================
cmd_clean() {
	require_gecko_dir
	info "Removing Gecko source tree: $GECKO_DIR"
	rm -rf "$GECKO_DIR"
	info "Clean complete. Run './build.sh setup' to re-download."
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
	echo "Expected revision: $GECKO_REVISION"
	echo "Platform:         $(detect_platform)"
	echo "CPU count:        $(detect_cpu_count)"
	echo ""

	# check gecko directory
	local rev_len=${#GECKO_REVISION}
	if [ -d "$GECKO_DIR" ]; then
		echo "Gecko cloned:     yes"
		local current_head
		current_head="$(git -C "$GECKO_DIR" rev-parse HEAD 2>/dev/null | cut -c1-"$rev_len")"
		echo "Current HEAD:     ${current_head:-unknown}"
		if [ "$current_head" = "$GECKO_REVISION" ]; then
			echo "Revision match:   yes"
		else
			echo "Revision match:   NO (expected $GECKO_REVISION)"
		fi
	else
		echo "Gecko cloned:     no"
	fi

	# check symlink
	if [ -L "$GECKO_DIR/bluegriffon" ]; then
		echo "Symlink:          yes"
	else
		echo "Symlink:          no"
	fi

	# check patches
	if [ -d "$GECKO_DIR" ]; then
		for patch_file in "$BG_CONFIG_DIR/gecko_dev_content.patch" "$BG_CONFIG_DIR/gecko_dev_idl.patch"; do
			local patch_name
			patch_name="$(basename "$patch_file")"
			if patch --dry-run --reverse -p 1 -d "$GECKO_DIR" < "$patch_file" > /dev/null 2>&1; then
				echo "Patch $patch_name: applied"
			else
				echo "Patch $patch_name: not applied"
			fi
		done
	fi

	# check mozconfig
	if [ -f "$GECKO_DIR/.mozconfig" ]; then
		echo "Mozconfig:        yes"
	else
		echo "Mozconfig:        no"
	fi
}

#============================================
# Subcommand: help
#============================================
cmd_help() {
	cat <<'USAGE'
Usage: ./build.sh <command> [options]

Commands:
  setup     Clone Firefox source, pin revision, apply patches, configure
  build     Compile BlueGriffon (./mach build)
  run       Launch BlueGriffon (./mach run)
  package   Create distributable package (./mach package)
  clean     Remove the downloaded Gecko source tree
  status    Print build environment diagnostic summary
  help      Show this help message

Options:
  --gecko-dir <path>     Override the default Gecko directory location
  --apply-patches        Apply Gecko patches during setup

Examples:
  ./build.sh setup                     # first-time setup
  ./build.sh --apply-patches setup     # setup and apply Gecko patches
  ./build.sh build                     # compile after setup
  ./build.sh run                       # launch the editor
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
			setup|build|run|package|clean|status|help)
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
		setup)   cmd_setup ;;
		build)   cmd_build ;;
		run)     cmd_run ;;
		package) cmd_package ;;
		clean)   cmd_clean ;;
		status)  cmd_status ;;
		help)    cmd_help ;;
	esac
}

main "$@"
