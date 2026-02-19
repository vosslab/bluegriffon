#!/bin/sh

pkill -f BlueGriffon

sleep 0.1

rm -f \
$HOME/Library/Caches/BlueGriffon/Profiles/htgdvwvs.default/startupCache/*

$HOME/nsh/bluegriffon/builds/bluegriffon-source/opt/dist/BlueGriffon.app/Contents/MacOS/bluegriffon \
  -no-remote -purgecaches 2>&1 \
  > /tmp/bluegriffon-run.txt &

sleep 30; pkill -f BlueGriffon
