/**
 * Utility functions for the UI
 */

/**
 * Create an element with attributes and styles
 * @param {string} tag - HTML tag name
 * @param {Object} options - Options object
 * @param {Object} options.attrs - HTML attributes
 * @param {Object} options.styles - CSS styles
 * @param {string} options.text - Text content
 * @param {string} options.html - HTML content
 * @returns {HTMLElement}
 */
export function createElement(tag, options = {}) {
    const element = document.createElement(tag);

    if (options.attrs) {
        Object.entries(options.attrs).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }

    if (options.styles) {
        Object.assign(element.style, options.styles);
    }

    if (options.text) {
        element.textContent = options.text;
    }

    if (options.html) {
        element.innerHTML = options.html;
    }

    if (options.className) {
        element.className = options.className;
    }

    return element;
}

/**
 * Remove all child elements
 * @param {HTMLElement} element
 */
export function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Get filename from URL
 * @param {string} url
 * @returns {string}
 */
export function getFilenameFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const parts = pathname.split('/');
        return parts[parts.length - 1] || 'unknown';
    } catch {
        return url.substring(url.lastIndexOf('/') + 1) || 'unknown';
    }
}

/**
 * Format file size
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Debounce function
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if element is visible in viewport
 * @param {HTMLElement} element
 * @returns {boolean}
 */
export function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Escape HTML special characters
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Check if device is mobile
 * @returns {boolean}
 */
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check if screen is in portrait mode
 * @returns {boolean}
 */
export function isPortrait() {
    return window.innerHeight > window.innerWidth * 1.2;
}

/**
 * Add event listener with cleanup
 * @param {HTMLElement} element
 * @param {string} event
 * @param {Function} handler
 * @returns {Function} Cleanup function
 */
export function addEventListener(element, event, handler) {
    element.addEventListener(event, handler);
    return () => element.removeEventListener(event, handler);
}

/**
 * Wait for condition to be true
 * @param {Function} condition
 * @param {number} timeout
 * @returns {Promise<void>}
 */
export function waitFor(condition, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const check = () => {
            if (condition()) {
                resolve();
            } else if (Date.now() - startTime > timeout) {
                reject(new Error('Timeout waiting for condition'));
            } else {
                setTimeout(check, 100);
            }
        };

        check();
    });
}
