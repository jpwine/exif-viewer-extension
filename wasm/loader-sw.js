/**
 * WASM Loader for Service Worker
 * This version has no ES6 module exports for compatibility with importScripts()
 */

class WasmExifParser {
    constructor() {
        this.initialized = false;
        this.loading = false;
        this.loadPromise = null;
    }

    async load() {
        if (this.initialized) {
            return;
        }

        if (this.loading) {
            return this.loadPromise;
        }

        this.loading = true;
        this.loadPromise = this._loadWasm();

        try {
            await this.loadPromise;
            this.initialized = true;
        } finally {
            this.loading = false;
        }
    }

    async _loadWasm() {
        // Go class should be loaded via importScripts('wasm/wasm_exec.js')
        if (typeof Go === 'undefined') {
            throw new Error('Go runtime not loaded. Ensure wasm_exec.js is imported before loader-sw.js');
        }

        // Load WASM file
        const wasmUrl = self.registration ?
            new URL('../wasm/exif-parser.wasm', self.location.href).href :
            chrome.runtime.getURL('wasm/exif-parser.wasm');
        const go = new Go();

        // Fetch WASM bytes
        const response = await fetch(wasmUrl);
        const wasmBytes = await response.arrayBuffer();

        // Validate WASM module first
        const isValid = WebAssembly.validate(wasmBytes);
        if (!isValid) {
            throw new Error('WASM module validation failed');
        }

        // Instantiate WASM
        const result = await WebAssembly.instantiate(wasmBytes, go.importObject);

        // Run the Go program
        go.run(result.instance);

        // Wait for WASM functions to be exported
        let retries = 0;
        while (typeof parseExif !== 'function' && retries < 50) {
            await new Promise(resolve => setTimeout(resolve, 10));
            retries++;
        }

        if (typeof parseExif !== 'function') {
            throw new Error('WASM functions not available');
        }
    }

    async parseExif(imageData) {
        if (!this.initialized) {
            await this.load();
        }

        if (typeof parseExif !== 'function') {
            throw new Error('WASM module not initialized');
        }

        const jsonString = await parseExif(imageData);
        return JSON.parse(jsonString);
    }

    async detectFormat(imageData) {
        if (!this.initialized) {
            await this.load();
        }

        if (typeof detectImageFormat !== 'function') {
            throw new Error('WASM module not initialized');
        }

        return detectImageFormat(imageData);
    }

    async getSupportedFormats() {
        if (!this.initialized) {
            await this.load();
        }

        if (typeof getSupportedFormats !== 'function') {
            throw new Error('WASM module not initialized');
        }

        return Array.from(getSupportedFormats());
    }

    async parseFromUrl(url) {
        const response = await fetch(url);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Try to parse EXIF, but include basic image info regardless
        const imageInfo = {
            fileSize: blob.size,
            mimeType: blob.type,
            url: url
        };

        try {
            const exifData = await this.parseExif(uint8Array);
            // Merge EXIF data with basic image info
            return { ...imageInfo, ...exifData };
        } catch (error) {
            // If EXIF parsing fails, return basic image info with error
            console.warn('EXIF parsing failed, returning basic image info:', error.message);
            return {
                ...imageInfo,
                _error: error.message,
                _note: 'EXIF data not available'
            };
        }
    }
}

// Create singleton instance and make globally available
self.wasmExifParser = new WasmExifParser();
self.WasmExifParser = WasmExifParser;
