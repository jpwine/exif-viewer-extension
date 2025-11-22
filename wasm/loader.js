/**
 * WASM Loader for EXIF Parser
 * Handles loading and initialization of the WASM module
 * Note: wasm_exec.js is loaded as a content script in manifest.json
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
        console.log('[WASM] Starting WASM initialization...');

        // wasm_exec.js is loaded as a content script, so Go should be available
        if (typeof Go === 'undefined') {
            console.error('[WASM] Go class not found');
            throw new Error('Go runtime not loaded. Ensure wasm_exec.js is loaded as content script.');
        }
        console.log('[WASM] Go class is available');

        // Load WASM file
        const wasmUrl = chrome.runtime.getURL('wasm/exif-parser.wasm');
        console.log('[WASM] Loading WASM from:', wasmUrl);
        const go = new Go();

        // Fetch WASM bytes (Chrome extensions need this instead of instantiateStreaming)
        const response = await fetch(wasmUrl);
        const wasmBytes = await response.arrayBuffer();
        console.log('[WASM] Fetched WASM bytes:', wasmBytes.byteLength);

        // Validate WASM module first
        const isValid = WebAssembly.validate(wasmBytes);
        console.log('[WASM] WASM module is valid:', isValid);
        if (!isValid) {
            throw new Error('WASM module validation failed');
        }

        // Directly instantiate without separate compile step
        // Chrome extension content scripts may not allow WebAssembly.compile()
        console.log('[WASM] Starting direct instantiation...');
        console.log('[WASM] ArrayBuffer size:', wasmBytes.byteLength);

        let result;
        try {
            result = await WebAssembly.instantiate(wasmBytes, go.importObject);
            console.log('[WASM] WASM module instantiated successfully');
        } catch (error) {
            console.error('[WASM] Instantiation error:', error);
            console.error('[WASM] Error name:', error.name);
            console.error('[WASM] Error message:', error.message);
            console.error('[WASM] Error stack:', error.stack);
            console.error('[WASM] Go importObject keys:', Object.keys(go.importObject));
            throw new Error('WASM instantiation failed: ' + error.message);
        }

        // Run the Go program
        go.run(result.instance);
        console.log('[WASM] Go program started');

        // Wait for WASM functions to be exported
        let retries = 0;
        while (typeof parseExif !== 'function' && retries < 50) {
            await new Promise(resolve => setTimeout(resolve, 10));
            retries++;
        }

        if (typeof parseExif !== 'function') {
            console.error('[WASM] parseExif not available after', retries, 'retries');
            throw new Error('WASM functions not available');
        }

        console.log('[WASM] Initialized successfully');
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
        console.log('[WASM Loader] Fetching image from:', url);
        const response = await fetch(url);
        console.log('[WASM Loader] Response status:', response.status);

        const blob = await response.blob();
        console.log('[WASM Loader] Blob size:', blob.size, 'type:', blob.type);

        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        console.log('[WASM Loader] Image data length:', uint8Array.length);

        const result = await this.parseExif(uint8Array);
        console.log('[WASM Loader] Parse result:', result);
        return result;
    }
}

// Create singleton instance and export to global scope
const wasmExifParser = new WasmExifParser();

// Make available globally for Service Worker (importScripts context)
if (typeof self !== 'undefined') {
    self.wasmExifParser = wasmExifParser;
    self.WasmExifParser = WasmExifParser;
}
