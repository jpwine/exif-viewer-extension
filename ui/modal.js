/**
 * Modal Component
 * Manages the modal display for images and EXIF data
 */

import { createElement, clearElement, isPortrait, addEventListener } from './utils.js';
import {
    modalOverlayStyle,
    modalContainerStyle,
    modalContainerPortraitStyle,
    imageContainerStyle,
    imageContainerPortraitStyle,
    exifContainerStyle,
    imageStyle,
    closeButtonStyle,
    closeButtonHoverStyle,
    injectStyles,
} from './styles.js';
import {
    createExifDisplay,
    createLoadingIndicator,
    createErrorMessage,
} from './exif-display.js';

const MODAL_HOST_ID = 'exif-viewer-modal-host';
const MODAL_CONTAINER_ID = 'exif-viewer-modal-container';

/**
 * Modal class for displaying images and EXIF data
 */
export class Modal {
    constructor() {
        this.hostEl = null;
        this.shadowRoot = null;
        this.overlay = null;
        this.container = null;
        this.imageContainer = null;
        this.exifContainer = null;
        this.cleanupFunctions = [];
        this.previouslyFocused = null;
    }

    /**
     * Show modal with image and EXIF data
     * @param {string} imageUrl - URL of the image
     * @param {Function} exifLoader - Async function that returns EXIF data
     */
    async show(imageUrl, exifLoader) {
        // Remove existing modal if any
        this.hide();

        // Remember what had focus so we can restore it on close
        this.previouslyFocused = document.activeElement;

        // Create modal structure inside a shadow root so the host page's
        // own CSS (resets, `button {}` / `table {}` rules, `!important`
        // overrides, etc.) can't bleed into it.
        this.createModalStructure();

        // Load image
        this.loadImage(imageUrl);

        // Load EXIF data
        await this.loadExifData(exifLoader);

        // Add to DOM
        document.body.appendChild(this.hostEl);

        // Setup event listeners
        this.setupEventListeners();

        // Move keyboard focus into the dialog
        this.container.focus();
    }

    /**
     * Hide and remove modal
     */
    hide() {
        // Cleanup event listeners
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];

        // Remove from DOM
        if (this.hostEl && this.hostEl.parentNode) {
            this.hostEl.parentNode.removeChild(this.hostEl);
        }

        // Restore focus to whatever triggered the modal
        if (this.previouslyFocused && typeof this.previouslyFocused.focus === 'function') {
            this.previouslyFocused.focus();
        }
        this.previouslyFocused = null;

        this.hostEl = null;
        this.shadowRoot = null;
        this.overlay = null;
        this.container = null;
        this.imageContainer = null;
        this.exifContainer = null;
    }

    /**
     * Create modal DOM structure
     */
    createModalStructure() {
        const portrait = isPortrait();

        // Shadow host: a plain, unstyled element living in the page's DOM.
        // `all: initial` strips any inherited/cascaded styles from the host
        // page before they can cross into the shadow tree; `display: contents`
        // keeps the host element itself from introducing a layout box.
        this.hostEl = createElement('div', {
            attrs: { id: MODAL_HOST_ID },
            styles: { all: 'initial', display: 'contents' },
        });
        this.shadowRoot = this.hostEl.attachShadow({ mode: 'open' });
        injectStyles(this.shadowRoot);

        // Create overlay
        this.overlay = createElement('div', {
            attrs: { id: MODAL_CONTAINER_ID },
            styles: modalOverlayStyle,
        });

        // Create container
        this.container = createElement('div', {
            styles: portrait ? modalContainerPortraitStyle : modalContainerStyle,
            attrs: {
                role: 'dialog',
                'aria-modal': 'true',
                'aria-label': 'EXIF情報',
                tabindex: '-1',
            },
        });

        // Create image container
        this.imageContainer = createElement('div', {
            className: 'exif-viewer-scrollbar',
            styles: portrait ? imageContainerPortraitStyle : imageContainerStyle,
        });

        // Create EXIF container
        this.exifContainer = createElement('div', {
            className: 'exif-viewer-scrollbar',
            styles: exifContainerStyle,
        });

        // Create close button
        const closeButton = this.createCloseButton();
        this.container.appendChild(closeButton);

        // Assemble structure
        this.container.appendChild(this.imageContainer);
        this.container.appendChild(this.exifContainer);
        this.overlay.appendChild(this.container);
        this.shadowRoot.appendChild(this.overlay);
    }

    /**
     * Create close button
     * @returns {HTMLElement}
     */
    createCloseButton() {
        const button = createElement('button', {
            html: '&times;',
            styles: closeButtonStyle,
            attrs: {
                'aria-label': '閉じる',
                type: 'button',
            },
        });

        button.addEventListener('mouseenter', () => {
            Object.assign(button.style, closeButtonHoverStyle);
        });

        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = closeButtonStyle.backgroundColor;
            button.style.transform = 'none';
        });

        button.addEventListener('click', () => this.hide());

        return button;
    }

    /**
     * Load and display image
     * @param {string} imageUrl
     */
    loadImage(imageUrl) {
        const img = createElement('img', {
            attrs: { src: imageUrl, alt: 'Image' },
            styles: imageStyle,
        });

        img.addEventListener('error', () => {
            clearElement(this.imageContainer);
            const error = createErrorMessage('画像の読み込みに失敗しました');
            this.imageContainer.appendChild(error);
        });

        this.imageContainer.appendChild(img);
    }

    /**
     * Load and display EXIF data
     * @param {Function} exifLoader - Async function that returns EXIF data
     */
    async loadExifData(exifLoader) {
        // Show loading indicator
        const loading = createLoadingIndicator();
        this.exifContainer.appendChild(loading);

        try {
            // Load EXIF data
            const exifData = await exifLoader();

            // Clear loading indicator
            clearElement(this.exifContainer);

            // Display EXIF data
            const exifDisplay = createExifDisplay(exifData);
            this.exifContainer.appendChild(exifDisplay);
        } catch (error) {
            // Clear loading indicator
            clearElement(this.exifContainer);

            // Log detailed error
            console.error('[Modal] EXIF loading error:', error);
            console.error('[Modal] Error stack:', error.stack);

            // Show error message
            const errorMsg = createErrorMessage(
                error.message || 'EXIF データの読み込みに失敗しました'
            );
            this.exifContainer.appendChild(errorMsg);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close on overlay click
        const overlayClick = (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        };
        this.cleanupFunctions.push(
            addEventListener(this.overlay, 'click', overlayClick)
        );

        // Close on escape key
        const escapeKey = (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        };
        this.cleanupFunctions.push(
            addEventListener(document, 'keydown', escapeKey)
        );

        // Prevent scrolling of background. This listener sits outside the
        // shadow root, so a composed event's `target` gets retargeted to
        // `hostEl` — use composedPath() to find the true origin instead.
        const preventScroll = (e) => {
            if (!e.composedPath().includes(this.container)) {
                e.preventDefault();
            }
        };
        this.cleanupFunctions.push(
            addEventListener(document.body, 'wheel', preventScroll, { passive: false })
        );

        // Basic focus trap: keep Tab cycling within the dialog
        const trapFocus = (e) => {
            if (e.key !== 'Tab') {
                return;
            }
            const focusable = this.shadowRoot.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable.length === 0) {
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = this.shadowRoot.activeElement;

            if (e.shiftKey && active === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        };
        this.cleanupFunctions.push(
            addEventListener(this.container, 'keydown', trapFocus)
        );
    }
}

/**
 * Create and show modal (convenience function)
 * @param {string} imageUrl
 * @param {Function} exifLoader
 * @returns {Modal}
 */
export function showModal(imageUrl, exifLoader) {
    const modal = new Modal();
    modal.show(imageUrl, exifLoader);
    return modal;
}
