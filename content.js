/**
 * Content Script (Entry Point)
 * Handles EXIF display on web pages
 * WASM parsing is now done in background service worker
 */

let uiModules = null;

/**
 * Load UI modules dynamically
 */
async function loadUIModules() {
    if (uiModules) {
        return uiModules;
    }

    const [modal, imageList] = await Promise.all([
        import(chrome.runtime.getURL('ui/modal.js')),
        import(chrome.runtime.getURL('ui/image-list.js'))
    ]);

    uiModules = {
        showModal: modal.showModal,
        scanPageImages: imageList.scanPageImages,
        SortType: imageList.SortType
    };

    return uiModules;
}

/**
 * Parse EXIF data by sending request to background service worker
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<Object>} EXIF data
 */
async function parseExifViaBackground(imageUrl) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            { action: 'parseExif', url: imageUrl },
            (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                if (!response) {
                    reject(new Error('No response from background script'));
                    return;
                }

                if (response.success) {
                    resolve(response.data);
                } else {
                    reject(new Error(response.error || 'Unknown error'));
                }
            }
        );
    });
}

/**
 * Show EXIF modal for an image URL
 * @param {string} imageUrl - URL of the image
 */
async function showExifModal(imageUrl) {
    try {
        // Load UI modules
        const ui = await loadUIModules();

        // Create EXIF loader function that calls background script
        const exifLoader = async () => {
            return await parseExifViaBackground(imageUrl);
        };

        // Show modal with image and EXIF data
        ui.showModal(imageUrl, exifLoader);
    } catch (error) {
        console.error('Failed to show EXIF modal:', error);
        alert('EXIF表示エラー: ' + error.message);
    }
}

/**
 * Handle messages from background script or popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showExif' || request.action === 'fd0cb59b8ef1') {
        // Show EXIF modal for the requested image
        showExifModal(request.url)
            .then(() => sendResponse({ success: true }))
            .catch(error => {
                console.error('Error in showExifModal:', error);
                sendResponse({ success: false, error: error.message });
            });

        return true; // Keep message channel open for async response
    }
});

/**
 * Handle port connections from popup
 */
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'exif-viewer-image-scan') {
        port.onMessage.addListener(async (msg) => {
            if (msg.action === 'scan') {
                try {
                    // Load UI modules
                    const ui = await loadUIModules();

                    // Scan page for images
                    const sortType = msg.sortType ?? ui.SortType.AREA;
                    const maxResults = msg.maxResults ?? 20;

                    const images = ui.scanPageImages(sortType, maxResults);

                    // Send results back to popup
                    images.forEach(imageInfo => {
                        port.postMessage({
                            type: 'image',
                            data: {
                                src: imageInfo.src,
                                width: imageInfo.width,
                                height: imageInfo.height,
                                filename: imageInfo.filename,
                            },
                        });
                    });

                    // Signal completion
                    port.postMessage({ type: 'complete' });
                } catch (error) {
                    console.error('Error scanning images:', error);
                    port.postMessage({ type: 'error', message: error.message });
                }
            }
        });
    }

    // Legacy support for old port name
    if (port.name === 'VCA_nkz7rhj_rge6gcz') {
        port.onMessage.addListener(async (msg) => {
            if (msg.state === 'ping') {
                try {
                    // Load UI modules
                    const ui = await loadUIModules();

                    const sortType = parseInt(msg.sortType) ?? 0;
                    const maxResults = parseInt(msg.listSize) ?? 20;

                    const images = ui.scanPageImages(sortType, maxResults);

                    images.forEach(imageInfo => {
                        port.postMessage({
                            state: 'pong',
                            imgSrc: imageInfo.src,
                            imgSize: `${imageInfo.height}x${imageInfo.width}`,
                        });
                    });

                    port.postMessage({ state: 'over' });
                } catch (error) {
                    console.error('Error scanning images (legacy):', error);
                }
            }
        });
    }
});

console.log('EXIF Viewer content script loaded');
