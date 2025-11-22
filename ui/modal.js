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

const MODAL_CONTAINER_ID = 'exif-viewer-modal-container';

/**
 * Modal class for displaying images and EXIF data
 */
export class Modal {
    constructor() {
        this.overlay = null;
        this.container = null;
        this.imageContainer = null;
        this.exifContainer = null;
        this.cleanupFunctions = [];

        // Inject styles on first use
        injectStyles();
    }

    /**
     * Show modal with image and EXIF data
     * @param {string} imageUrl - URL of the image
     * @param {Function} exifLoader - Async function that returns EXIF data
     */
    async show(imageUrl, exifLoader) {
        // Remove existing modal if any
        this.hide();

        // Create modal structure
        this.createModalStructure();

        // Load image
        this.loadImage(imageUrl);

        // Load EXIF data
        await this.loadExifData(exifLoader);

        // Add to DOM
        document.body.appendChild(this.overlay);

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Hide and remove modal
     */
    hide() {
        // Cleanup event listeners
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];

        // Remove from DOM
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }

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

        // Create overlay
        this.overlay = createElement('div', {
            attrs: { id: MODAL_CONTAINER_ID },
            styles: modalOverlayStyle,
        });

        // Create container
        this.container = createElement('div', {
            styles: portrait ? modalContainerPortraitStyle : modalContainerStyle,
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
                'aria-label': 'Close',
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

        // Prevent scrolling of background
        const preventScroll = (e) => {
            if (!this.container.contains(e.target)) {
                e.preventDefault();
            }
        };
        this.cleanupFunctions.push(
            addEventListener(document.body, 'wheel', preventScroll, { passive: false })
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
