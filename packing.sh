#!/usr/bin/env bash

set -e

echo "Packaging EXIF Viewer Extension..."

# Remove old package if exists
[ -f extension.zip ] && rm -v extension.zip

# Build WASM if needed
if [ ! -f wasm/exif-parser.wasm ]; then
    echo "WASM module not found. Building..."
    ./build.sh
fi

# Create package
echo "Creating package..."
zip -r extension.zip \
    manifest.json \
    background.js \
    content.js \
    popup.html \
    popup.js \
    ui/ \
    wasm/exif-parser.wasm \
    wasm/wasm_exec.js \
    wasm/loader.js \
    wasm/loader-sw.js \
    images/ev_*.png

echo "Package created: extension.zip"
echo ""
echo "Contents:"
unzip -l extension.zip
