/**
 * EXIF Display Component
 * Renders EXIF data in a table format
 */

import { createElement, escapeHtml } from './utils.js';
import {
    v,
    exifTableStyle,
    exifTableRowStyle,
    exifTableKeyStyle,
    exifTableValueStyle,
    sectionHeaderStyle,
    errorMessageStyle,
    loadingSpinnerStyle,
} from './styles.js';

/**
 * Create EXIF data table
 * @param {Object} exifData - EXIF data object
 * @returns {HTMLElement}
 */
export function createExifTable(exifData) {
    const table = createElement('table', { styles: exifTableStyle });
    const tbody = createElement('tbody');
    table.appendChild(tbody);

    // Separate different types of metadata
    const basicInfoKeys = ['fileSize', 'mimeType', 'url', '_error', '_note'];
    const commentKeys = ['Comment', 'JPEG_Comment'];
    const metadataKeys = ['JFIF_Version', 'JFXX_Extension', 'XMP_Metadata', 'ICC_Profile',
                          'FlashPix', 'Photoshop_IRB', 'Adobe_APP14', 'EXIF_ParseError',
                          'APP0_Data', 'APP1_Data', 'APP2_Data', 'APP3_Data', 'APP4_Data',
                          'APP5_Data', 'APP6_Data', 'APP7_Data', 'APP8_Data', 'APP9_Data',
                          'APP10_Data', 'APP11_Data', 'APP12_Data', 'APP13_Data', 'APP14_Data', 'APP15_Data'];

    const allKeys = Object.keys(exifData);
    const exifKeys = allKeys
        .filter(key => !basicInfoKeys.includes(key) && !commentKeys.includes(key) && !metadataKeys.includes(key))
        .sort();
    const foundMetadataKeys = allKeys
        .filter(key => metadataKeys.includes(key))
        .sort();

    // Show basic info if no EXIF or metadata
    if (exifKeys.length === 0 && foundMetadataKeys.length === 0) {
        if (exifData._note) {
            const noteRow = createElement('tr');
            const noteCell = createElement('td', {
                text: exifData._note,
                attrs: { colspan: '2' },
                styles: { textAlign: 'center', padding: '20px', color: v.textMuted, fontStyle: 'italic' },
            });
            noteRow.appendChild(noteCell);
            tbody.appendChild(noteRow);
        }

        addBasicInfoRows(tbody, exifData);
        return table;
    }

    // Create rows for EXIF fields
    exifKeys.forEach(key => {
        const value = exifData[key];
        if (value === null || value === undefined || value === '') {
            return;
        }

        const row = createElement('tr', { styles: exifTableRowStyle });

        row.addEventListener('mouseenter', () => {
            row.style.backgroundColor = v.bgSubtle;
        });
        row.addEventListener('mouseleave', () => {
            row.style.backgroundColor = '';
        });

        const keyCell = createElement('td', {
            text: key,
            styles: exifTableKeyStyle,
        });

        const valueCell = createElement('td', {
            text: formatExifValue(value),
            styles: exifTableValueStyle,
        });

        row.appendChild(keyCell);
        row.appendChild(valueCell);
        tbody.appendChild(row);
    });

    // Add other metadata section
    if (foundMetadataKeys.length > 0) {
        addMetadataRows(tbody, exifData, foundMetadataKeys);
    }

    // Add basic info at the end
    if (exifData.fileSize || exifData.mimeType) {
        addBasicInfoRows(tbody, exifData);
    }

    return table;
}

/**
 * Add a section separator row
 * @param {HTMLElement} tbody
 * @param {string} label
 * @param {Object} [accentStyle] - Extra styles layered on top of sectionHeaderStyle
 */
function addSectionSeparator(tbody, label, accentStyle = {}) {
    const separator = createElement('tr');
    const separatorCell = createElement('td', {
        attrs: { colspan: '2' },
        styles: {
            ...sectionHeaderStyle,
            borderTop: `1px solid ${v.border}`,
            ...accentStyle,
        },
        text: label,
    });
    separator.appendChild(separatorCell);
    tbody.appendChild(separator);
}

/**
 * Add metadata section rows
 * @param {HTMLElement} tbody
 * @param {Object} data
 * @param {Array} keys
 */
function addMetadataRows(tbody, data, keys) {
    addSectionSeparator(tbody, chrome.i18n.getMessage('otherMetadata'), {
        backgroundColor: v.warnBg,
        color: v.warnText,
    });

    keys.forEach(key => {
        const value = data[key];
        if (value) {
            addInfoRow(tbody, key, value);
        }
    });
}

/**
 * Add basic image info rows to table
 * @param {HTMLElement} tbody
 * @param {Object} data
 */
function addBasicInfoRows(tbody, data) {
    addSectionSeparator(tbody, chrome.i18n.getMessage('imageInfo'), {
        backgroundColor: v.bgSubtle,
    });

    // File size
    if (data.fileSize) {
        addInfoRow(tbody, chrome.i18n.getMessage('fileSizeLabel'), formatFileSize(data.fileSize));
    }

    // MIME type
    if (data.mimeType) {
        addInfoRow(tbody, chrome.i18n.getMessage('mimeTypeLabel'), data.mimeType);
    }
}

/**
 * Add single info row
 */
function addInfoRow(tbody, key, value) {
    const row = createElement('tr', { styles: exifTableRowStyle });

    const keyCell = createElement('td', {
        text: key,
        styles: { ...exifTableKeyStyle, backgroundColor: v.bgSubtle },
    });

    const valueCell = createElement('td', {
        text: value,
        styles: exifTableValueStyle,
    });

    row.appendChild(keyCell);
    row.appendChild(valueCell);
    tbody.appendChild(row);
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Format EXIF value for display
 * @param {*} value
 * @returns {string}
 */
function formatExifValue(value) {
    if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
    }

    return String(value);
}

/**
 * Create loading indicator
 * @returns {HTMLElement}
 */
export function createLoadingIndicator() {
    const container = createElement('div', {
        styles: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px',
        },
    });

    const spinner = createElement('div', { styles: loadingSpinnerStyle });
    const text = createElement('p', {
        text: chrome.i18n.getMessage('loadingExifData'),
        styles: {
            marginTop: '16px',
            color: v.textMuted,
            fontSize: '13.5px',
        },
    });

    container.appendChild(spinner);
    container.appendChild(text);

    return container;
}

/**
 * Create error message
 * @param {string} message
 * @returns {HTMLElement}
 */
export function createErrorMessage(message) {
    return createElement('div', {
        styles: errorMessageStyle,
        html: `
            <strong>${escapeHtml(chrome.i18n.getMessage('errorLabel'))}</strong>
            <p style="margin: 8px 0 0 0;">${escapeHtml(message)}</p>
        `,
    });
}

/**
 * Create EXIF summary info
 * @param {Object} exifData
 * @returns {HTMLElement}
 */
export function createExifSummary(exifData) {
    const summary = createElement('div', {
        styles: {
            padding: '16px 18px',
            backgroundColor: v.bgSubtle,
            border: `1px solid ${v.border}`,
            borderRadius: '10px',
            marginBottom: '18px',
        },
    });

    const items = [];

    // Camera info
    if (exifData.Make || exifData.Model) {
        const camera = [exifData.Make, exifData.Model].filter(Boolean).join(' ');
        items.push({ label: chrome.i18n.getMessage('summaryCamera'), value: camera });
    }

    // Date taken
    if (exifData.DateTimeOriginal || exifData.DateTime) {
        const date = exifData.DateTimeOriginal || exifData.DateTime;
        items.push({ label: chrome.i18n.getMessage('summaryDateTaken'), value: date });
    }

    // Exposure settings
    if (exifData.ExposureTime && exifData.FNumber && exifData.ISO) {
        const exposure = `${exifData.ExposureTime}s, f/${exifData.FNumber}, ISO ${exifData.ISO}`;
        items.push({ label: chrome.i18n.getMessage('summaryExposure'), value: exposure });
    }

    // Focal length
    if (exifData.FocalLength) {
        items.push({ label: chrome.i18n.getMessage('summaryFocalLength'), value: exifData.FocalLength + 'mm' });
    }

    // GPS
    if (exifData.GPSLatitude && exifData.GPSLongitude) {
        const gps = `${exifData.GPSLatitude}, ${exifData.GPSLongitude}`;
        items.push({ label: chrome.i18n.getMessage('summaryGpsCoordinates'), value: gps });
    }

    if (items.length === 0) {
        return null; // No summary to show
    }

    items.forEach(item => {
        const row = createElement('div', {
            styles: {
                display: 'flex',
                marginBottom: '8px',
            },
        });

        const label = createElement('span', {
            text: item.label + ':',
            styles: {
                fontWeight: '600',
                marginRight: '8px',
                minWidth: '100px',
                color: v.textMuted,
            },
        });

        const value = createElement('span', {
            text: item.value,
            styles: {
                color: v.text,
            },
        });

        row.appendChild(label);
        row.appendChild(value);
        summary.appendChild(row);
    });

    return summary;
}

/**
 * Create JPEG comment display
 * @param {string} comment
 * @returns {HTMLElement}
 */
export function createCommentDisplay(comment) {
    const commentBox = createElement('div', {
        styles: {
            padding: '16px 18px',
            backgroundColor: v.infoBg,
            border: `1px solid ${v.infoBorder}`,
            borderRadius: '10px',
            marginBottom: '18px',
        },
    });

    const header = createElement('div', {
        text: chrome.i18n.getMessage('commentLabel'),
        styles: {
            fontWeight: '600',
            color: v.infoText,
            marginBottom: '8px',
            fontSize: '0.9em',
        },
    });

    const text = createElement('div', {
        text: comment,
        styles: {
            color: v.text,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
        },
    });

    commentBox.appendChild(header);
    commentBox.appendChild(text);

    return commentBox;
}

/**
 * Create complete EXIF display
 * @param {Object} exifData
 * @returns {HTMLElement}
 */
export function createExifDisplay(exifData) {
    const container = createElement('div', {
        className: 'exif-viewer-scrollbar',
        styles: {
            height: '100%',
            overflowY: 'auto',
        },
    });

    // Add JPEG comment if available (support both Comment and JPEG_Comment)
    const comment = exifData.JPEG_Comment || exifData.Comment;
    if (comment) {
        const commentDisplay = createCommentDisplay(comment);
        container.appendChild(commentDisplay);
    }

    // Add summary if available
    const summary = createExifSummary(exifData);
    if (summary) {
        container.appendChild(summary);
    }

    // Add full table
    const table = createExifTable(exifData);
    container.appendChild(table);

    return container;
}
