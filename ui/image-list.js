/**
 * Image List Component
 * Manages the list of images on the page
 */

import { createElement, getFilenameFromUrl } from './utils.js';
import { imageListItemStyle, imageListItemHoverStyle } from './styles.js';

/**
 * Sort types for images
 */
export const SortType = {
    AREA: 0,      // Height x Width
    HEIGHT: 1,    // Height only
    WIDTH: 2,     // Width only
};

/**
 * Scan page for images and return sorted list
 * @param {number} sortType - Sort type (SortType enum)
 * @param {number} maxResults - Maximum number of results to return
 * @returns {Array<Object>} Array of image objects
 */
export function scanPageImages(sortType = SortType.AREA, maxResults = 20) {
    const images = Array.from(document.getElementsByTagName('img'));

    // Filter out images with no dimensions or small images
    const validImages = images.filter(img => {
        return img.naturalWidth > 0 && img.naturalHeight > 0 &&
               img.naturalWidth >= 100 && img.naturalHeight >= 100;
    });

    // Sort based on type
    const sortedImages = sortImages(validImages, sortType);

    // Limit results
    const limitedImages = sortedImages.slice(0, maxResults);

    // Convert to image info objects
    return limitedImages.map(img => ({
        src: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight,
        area: img.naturalWidth * img.naturalHeight,
        filename: getFilenameFromUrl(img.src),
        element: img,
    }));
}

/**
 * Sort images by specified type
 * @param {Array<HTMLImageElement>} images
 * @param {number} sortType
 * @returns {Array<HTMLImageElement>}
 */
function sortImages(images, sortType) {
    switch (sortType) {
        case SortType.AREA:
            return images.sort((a, b) =>
                (b.naturalHeight * b.naturalWidth) - (a.naturalHeight * a.naturalWidth)
            );

        case SortType.HEIGHT:
            return images.sort((a, b) => b.naturalHeight - a.naturalHeight);

        case SortType.WIDTH:
            return images.sort((a, b) => b.naturalWidth - a.naturalWidth);

        default:
            return images;
    }
}

/**
 * Create image list item element
 * @param {Object} imageInfo - Image information object
 * @param {Function} onClick - Click handler
 * @returns {HTMLElement}
 */
export function createImageListItem(imageInfo, onClick) {
    const item = createElement('div', {
        styles: imageListItemStyle,
    });

    // Size display
    const sizeSpan = createElement('span', {
        text: `${imageInfo.height} × ${imageInfo.width}`,
        styles: {
            fontWeight: '600',
            minWidth: '120px',
            textAlign: 'right',
            fontFamily: 'monospace',
        },
    });

    // Filename display
    const nameSpan = createElement('span', {
        text: imageInfo.filename,
        styles: {
            marginLeft: '16px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: '1',
        },
        attrs: {
            title: imageInfo.src, // Show full URL on hover
        },
    });

    item.appendChild(sizeSpan);
    item.appendChild(nameSpan);

    // Hover effect
    item.addEventListener('mouseenter', () => {
        Object.assign(item.style, imageListItemHoverStyle);
    });

    item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = '';
    });

    // Click handler
    item.addEventListener('click', () => onClick(imageInfo));

    return item;
}

/**
 * Create image list container
 * @param {Array<Object>} imageInfos - Array of image info objects
 * @param {Function} onImageClick - Click handler for images
 * @returns {HTMLElement}
 */
export function createImageList(imageInfos, onImageClick) {
    const container = createElement('div', {
        className: 'exif-viewer-scrollbar',
        styles: {
            overflowY: 'auto',
            maxHeight: '100%',
        },
    });

    if (imageInfos.length === 0) {
        const emptyMessage = createElement('div', {
            text: '画像が見つかりませんでした',
            styles: {
                padding: '20px',
                textAlign: 'center',
                color: '#999',
            },
        });
        container.appendChild(emptyMessage);
        return container;
    }

    imageInfos.forEach(imageInfo => {
        const item = createImageListItem(imageInfo, onImageClick);
        container.appendChild(item);
    });

    return container;
}

/**
 * Get sort type name
 * @param {number} sortType
 * @returns {string}
 */
export function getSortTypeName(sortType) {
    switch (sortType) {
        case SortType.AREA:
            return '面積 (H×W)';
        case SortType.HEIGHT:
            return '高さ (H)';
        case SortType.WIDTH:
            return '幅 (W)';
        default:
            return '不明';
    }
}

/**
 * Get next sort type (for cycling through options)
 * @param {number} currentSortType
 * @returns {number}
 */
export function getNextSortType(currentSortType) {
    return (currentSortType + 1) % 3;
}
