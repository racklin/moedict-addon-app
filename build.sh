#!/bin/bash

# Copyright (c) 2012  XULApp StarterKit racklin@gmail.com

CALLDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

PACKAGENAME="moedict-app"
VERSION="1.1.1"

BUILDID=`date +%Y%m%d`
DISTDIR="$CALLDIR/dist"
BUILDDIR="$CALLDIR/build"

echo "Building Moedict-app addon"

# Remove build directory
if [ ! -d "$BUILDDIR" ]; then mkdir -p "$BUILDDIR"; fi

# Copy app directory
cp -RH "$CALLDIR/webapp" "$BUILDDIR/"
cp -RH "$CALLDIR/chrome" "$BUILDDIR/"
cp -RH "$CALLDIR/defaults" "$BUILDDIR/"
cp "$CALLDIR/chrome.manifest" "$BUILDDIR/"
cp "$CALLDIR/install.rdf" "$BUILDDIR/"
cp "$CALLDIR/LICENSE" "$BUILDDIR/"
cp "$CALLDIR/README.md" "$BUILDDIR/"

# remote manifest.appcache
rm -f $BUILDDIR/webapp/manifest.appcache

# Make sure DISTDIR exists
if [ ! -d "$DISTDIR" ]; then mkdir -p "$DISTDIR"; fi

cd "$BUILDDIR" && zip -rqX "$DISTDIR/${PACKAGENAME}-${VERSION}.xpi" *

rm -rf $BUILDDIR
