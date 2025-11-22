#!/usr/bin/env bash

set -e

echo "Building WASM module with TinyGo..."

# ============================================================
# IMPORTANT: VERSION REQUIREMENTS
# ============================================================
# TinyGo 0.37.x REQUIRES Go 1.22.12 for WASM compilation
# DO NOT use other Go versions - TinyGo 0.37 is not compatible
# This combination is tested and verified to work together
# ============================================================

# Check if TinyGo is installed
if ! command -v tinygo &> /dev/null; then
    echo "Error: TinyGo is not installed. Please install it first."
    echo "Visit: https://tinygo.org/getting-started/install/"
    exit 1
fi

# Use Go 1.22.12 for compatibility with TinyGo 0.37
export GOROOT="$HOME/sdk/go1.22.12"
export PATH="$GOROOT/bin:$PATH"

echo "Using Go version: $(go version)"

# Navigate to wasm directory
cd wasm

# Download dependencies
echo "Downloading Go dependencies..."
go mod download

# Build WASM module
echo "Compiling to WASM..."
tinygo build -o exif-parser.wasm -target wasm -no-debug ./main.go

# Copy wasm_exec.js from TinyGo
echo "Copying wasm_exec.js..."
cp "$(tinygo env TINYGOROOT)/targets/wasm_exec.js" ./wasm_exec.js

cd ..

echo "Build complete!"
echo "Output: wasm/exif-parser.wasm"
echo "Runtime: wasm/wasm_exec.js"
