/**
 * Image List Component
 * Manages the list of images on the page
 */

import { getFilenameFromUrl } from './utils.js';

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

