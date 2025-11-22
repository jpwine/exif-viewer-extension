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
    imageList.innerHTML = '<div class="loading">画像をスキャン中...</div>';
}

/**
 * Show empty state
 */
function showEmpty() {
    imageList.innerHTML = '<div class="empty">画像が見つかりませんでした</div>';
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

    const sizeSpan = document.createElement('span');
    sizeSpan.className = 'image-size';
    sizeSpan.textContent = `${imageData.height} × ${imageData.width}`;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'image-name';
    nameSpan.textContent = imageData.filename;
    nameSpan.title = imageData.src;

    item.appendChild(sizeSpan);
    item.appendChild(nameSpan);

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

    // Sort type change
    sortTypeSelect.addEventListener('change', () => {
        if (imageList.children.length > 0 && !imageList.querySelector('.empty, .loading, .error')) {
            // Re-scan with new sort type
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

    sortTypeSelect.addEventListener('change', () => {
        chrome.storage.sync.set({ sortType: sortTypeSelect.value });
    });
}

// Initialize on load
init();
