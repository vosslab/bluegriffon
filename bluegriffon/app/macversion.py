#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# Standard Library
import re
import argparse


#============================================
def parse_args() -> argparse.Namespace:
	"""Parse command-line arguments.

	Returns:
		argparse.Namespace: Parsed arguments with buildid and version.
	"""
	parser = argparse.ArgumentParser(
		description="Compute a CFBundleVersion-compatible version number from build ID and version string.",
	)
	parser.add_argument(
		'-b', '--buildid', dest='buildid', required=True,
		help='Path to build ID file',
	)
	parser.add_argument(
		'-v', '--version', dest='version', required=True,
		help='Version string (e.g. 14.0b1)',
	)
	args = parser.parse_args()
	return args


#============================================
def read_buildid(buildid_path: str) -> str:
	"""Read the build ID string from a file.

	Args:
		buildid_path: Path to the file containing the build ID.

	Returns:
		str: The build ID string.
	"""
	with open(buildid_path, 'r') as handle:
		buildid = handle.read().strip()
	return buildid


#============================================
def extract_major_version(version_string: str) -> str:
	"""Extract the major version number from a version string.

	Args:
		version_string: Version string like '14.0b1'.

	Returns:
		str: The major version number (e.g. '14').

	Raises:
		ValueError: If no major version can be extracted.
	"""
	match = re.match(r'^(\d+)[^\d].*', version_string)
	if not match:
		raise ValueError(f"Cannot extract major version from '{version_string}'")
	major_version = match.group(1)
	return major_version


#============================================
def compute_cfbundle_version(buildid: str, version_string: str) -> str:
	"""Compute a CFBundleVersion-compatible version number.

	The format is nnnnn[.nn[.nn]], incorporating both the version
	number and the build date so that it changes at least daily
	(for nightly builds), but newly-built older versions are not
	considered newer than previously-built newer versions.

	Args:
		buildid: Build ID string (date-based, e.g. '20250216120000').
		version_string: Version string (e.g. '14.0b1').

	Returns:
		str: CFBundleVersion string (e.g. '1425.2.16').
	"""
	major_version = extract_major_version(version_string)
	# last two digits of the year
	twodigityear = buildid[2:4]
	# extract month, stripping leading zero
	month = buildid[4:6]
	if month[0] == '0':
		month = month[1]
	# extract day, stripping leading zero
	day = buildid[6:8]
	if day[0] == '0':
		day = day[1]
	cfbundle_version = f"{major_version}{twodigityear}.{month}.{day}"
	return cfbundle_version


#============================================
def main() -> None:
	"""Compute and print the CFBundleVersion string."""
	args = parse_args()
	buildid = read_buildid(args.buildid)
	cfbundle_version = compute_cfbundle_version(buildid, args.version)
	print(cfbundle_version)


#============================================
if __name__ == "__main__":
	main()
