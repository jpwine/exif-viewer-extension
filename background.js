// Import WASM loader (Service Worker version)
importScripts('wasm/wasm_exec.js', 'wasm/loader-sw.js');

let wasmParser = null;

// Initialize WASM parser
async function initWasmParser() {
    if (wasmParser) {
        return wasmParser;
    }

    // Create a new instance - loader-sw.js exports wasmExifParser
    wasmParser = self.wasmExifParser || new WasmExifParser();
    await wasmParser.load();

    return wasmParser;
}

chrome.runtime.onInstalled.addListener(function() {
    const menu = chrome.contextMenus.create({
        type: "normal",
        id: "fd0cb59b8ef1",
        title: "View EXIF",
        contexts: ["image"]
    });

    // Pre-load WASM module
    initWasmParser().catch(err => {
        console.error('[Background] Failed to initialize WASM:', err);
    });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (info.menuItemId === "fd0cb59b8ef1") {
        let sndMsgPromise = chrome.tabs.sendMessage(tab.id, { action: "fd0cb59b8ef1", url: info.srcUrl });
    }
});

// Handle EXIF parsing requests from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'parseExif') {
        (async () => {
            try {
                const parser = await initWasmParser();
                const exifData = await parser.parseFromUrl(request.url);
                sendResponse({ success: true, data: exifData });
            } catch (error) {
                console.error('EXIF parsing error:', error);
                sendResponse({ success: false, error: error.message });
            }
        })();

        return true; // Keep channel open for async response
    }
});

