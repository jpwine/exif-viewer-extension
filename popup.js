/**
 * Popup Script
 * Handles the extension popup UI
 */

// DOM elements
const scanButton = document.getElementById('scanButton');
const imageList = document.getElementById('imageList');
const maxImagesInput = document.getElementById('maxImages');
const sortTypeSelect = document.getElementById('sortType');

/**
 * Show loading state
 */
function showLoading() {
    imageList.innerHTML = `
        <div class="state">
            <div class="spinner"></div>
            <span>画像をスキャン中...</span>
        </div>
    `;
}

/**
 * Show empty state
 */
function showEmpty() {
    imageList.innerHTML = `
        <div class="state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/>
                <circle cx="8.5" cy="10" r="1.5" stroke="currentColor" stroke-width="1.6"/>
                <path d="M21 15l-5-4-4.5 4-2-1.5L3 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>画像が見つかりませんでした</span>
        </div>
    `;
}

/**
 * Show error message
 * @param {string} message
 */
function showError(message) {
    imageList.innerHTML = `<div class="error">${message}</div>`;
}

/**
 * Clear image list
 */
function clearList() {
    imageList.innerHTML = '';
}

/**
 * Create image list item
 * @param {Object} imageData
 * @returns {HTMLElement}
 */
function createImageItem(imageData) {
    const item = document.createElement('div');
    item.className = 'image-item';

    const thumb = document.createElement('img');
    thumb.className = 'image-thumb';
    thumb.src = imageData.src;
    thumb.alt = '';
    thumb.loading = 'lazy';
    // Hide the thumbnail gracefully if it fails to load (e.g. blocked by the page's CSP)
    thumb.addEventListener('error', () => { thumb.style.visibility = 'hidden'; }, { once: true });

    const meta = document.createElement('div');
    meta.className = 'image-meta';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'image-name';
    nameSpan.textContent = imageData.filename;
    nameSpan.title = imageData.src;

    const sizeSpan = document.createElement('span');
    sizeSpan.className = 'image-size';
    sizeSpan.textContent = `${imageData.width} × ${imageData.height}`;

    meta.appendChild(nameSpan);
    meta.appendChild(sizeSpan);

    item.appendChild(thumb);
    item.appendChild(meta);

    // Click handler
    item.addEventListener('click', () => {
        handleImageClick(imageData.src);
    });

    return item;
}

/**
 * Handle image click
 * @param {string} imageUrl
 */
function handleImageClick(imageUrl) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            // Send message to content script to show EXIF modal
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'showExif',
                url: imageUrl,
            });
        }
    });
}

/**
 * Scan page for images
 */
function scanImages() {
    showLoading();

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) {
            showError('アクティブなタブが見つかりません');
            return;
        }

        const maxResults = parseInt(maxImagesInput.value) || 20;
        const sortType = parseInt(sortTypeSelect.value) || 0;

        // Connect to content script
        const port = chrome.tabs.connect(tabs[0].id, {
            name: 'exif-viewer-image-scan',
        });

        const images = [];
        let hasError = false;

        // Listen for messages
        port.onMessage.addListener((msg) => {
            if (msg.type === 'image') {
                images.push(msg.data);
            } else if (msg.type === 'complete') {
                port.disconnect();

                // Display results
                if (images.length === 0) {
                    showEmpty();
                } else {
                    clearList();
                    images.forEach(imageData => {
                        const item = createImageItem(imageData);
                        imageList.appendChild(item);
                    });
                }
            }
        });

        // Handle errors
        port.onDisconnect.addListener(() => {
            if (chrome.runtime.lastError) {
                if (!hasError && images.length === 0) {
                    showError('ページとの通信に失敗しました');
                }
                hasError = true;
            }
        });

        // Send scan request
        port.postMessage({
            action: 'scan',
            maxResults: maxResults,
            sortType: sortType,
        });
    });
}

/**
 * Initialize popup
 */
function init() {
    // Scan button click handler
    scanButton.addEventListener('click', () => {
        scanImages();
    });

    // Enter key in max images input
    maxImagesInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            scanImages();
        }
    });

    // Sort type change: save the preference and re-scan if a result list is already shown
    sortTypeSelect.addEventListener('change', () => {
        chrome.storage.sync.set({ sortType: sortTypeSelect.value });

        if (imageList.children.length > 0 && !imageList.querySelector('.state, .error')) {
            scanImages();
        }
    });

    // Load saved preferences
    chrome.storage.sync.get(['maxImages', 'sortType'], (result) => {
        if (result.maxImages) {
            maxImagesInput.value = result.maxImages;
        }
        if (result.sortType !== undefined) {
            sortTypeSelect.value = result.sortType;
        }
    });

    // Save preferences on change
    maxImagesInput.addEventListener('change', () => {
        chrome.storage.sync.set({ maxImages: maxImagesInput.value });
    });
}

// Initialize on load
init();
