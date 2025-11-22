/**
 * Style definitions for UI components
 * CSS-in-JS approach for easy maintenance
 */

export const colors = {
    primary: '#4a90e2',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    white: '#ffffff',
    black: '#000000',

    // Grays
    gray100: '#f8f9fa',
    gray200: '#e9ecef',
    gray300: '#dee2e6',
    gray400: '#ced4da',
    gray500: '#adb5bd',
    gray600: '#6c757d',
    gray700: '#495057',
    gray800: '#343a40',
    gray900: '#212529',

    // Semantic colors
    text: '#333333',
    textLight: '#666666',
    border: '#dddddd',
    background: '#ffffff',
    backgroundDark: '#f5f5f5',
    overlay: 'rgba(0, 0, 0, 0.5)',
};

export const zIndex = {
    modal: 10000,
    modalOverlay: 9999,
    dropdown: 1000,
    fixed: 1030,
    sticky: 1020,
};

export const transitions = {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
};

export const breakpoints = {
    mobile: 576,
    tablet: 768,
    desktop: 992,
    wide: 1200,
};

// Modal overlay styles
export const modalOverlayStyle = {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: colors.overlay,
    zIndex: zIndex.modalOverlay.toString(),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    animation: 'fadeIn 0.3s ease',
};

// Modal container styles
export const modalContainerStyle = {
    backgroundColor: colors.background,
    borderRadius: '8px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    maxWidth: '90vw',
    maxHeight: '90vh',
    width: '1200px',
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
    zIndex: zIndex.modal.toString(),
    animation: 'slideIn 0.3s ease',
};

// Modal container styles (portrait/mobile)
export const modalContainerPortraitStyle = {
    ...modalContainerStyle,
    flexDirection: 'column',
    width: '90vw',
    height: '90vh',
};

// Modal section styles
export const modalSectionStyle = {
    flex: '1',
    padding: '24px',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
};

// Image container styles
export const imageContainerStyle = {
    ...modalSectionStyle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray100,
    borderRight: `1px solid ${colors.border}`,
};

export const imageContainerPortraitStyle = {
    ...imageContainerStyle,
    borderRight: 'none',
    borderBottom: `1px solid ${colors.border}`,
    maxHeight: '50%',
};

// Image styles
export const imageStyle = {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    display: 'block',
};

// EXIF data container styles
export const exifContainerStyle = {
    ...modalSectionStyle,
};

// EXIF table styles
export const exifTableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
};

export const exifTableRowStyle = {
    borderBottom: `1px solid ${colors.gray200}`,
};

export const exifTableRowHoverStyle = {
    backgroundColor: colors.gray100,
};

export const exifTableCellStyle = {
    padding: '12px 8px',
    textAlign: 'left',
    verticalAlign: 'top',
};

export const exifTableKeyStyle = {
    ...exifTableCellStyle,
    fontWeight: '600',
    color: colors.gray700,
    width: '40%',
    wordBreak: 'break-word',
};

export const exifTableValueStyle = {
    ...exifTableCellStyle,
    color: colors.text,
    wordBreak: 'break-all',
};

// Close button styles
export const closeButtonStyle = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: colors.gray200,
    color: colors.gray700,
    fontSize: '20px',
    lineHeight: '1',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: transitions.fast,
    zIndex: '1',
};

export const closeButtonHoverStyle = {
    backgroundColor: colors.gray300,
    transform: 'scale(1.1)',
};

// Loading spinner styles
export const loadingSpinnerStyle = {
    border: '4px solid ' + colors.gray200,
    borderTop: '4px solid ' + colors.primary,
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    animation: 'spin 1s linear infinite',
};

// Error message styles
export const errorMessageStyle = {
    color: colors.danger,
    padding: '16px',
    backgroundColor: colors.gray100,
    borderRadius: '4px',
    marginTop: '16px',
};

// Image list item styles
export const imageListItemStyle = {
    padding: '12px 16px',
    borderBottom: `1px solid ${colors.gray200}`,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: transitions.fast,
};

export const imageListItemHoverStyle = {
    backgroundColor: colors.gray100,
};

// Add CSS animations
export function injectStyles() {
    if (document.getElementById('exif-viewer-styles')) {
        return; // Already injected
    }

    const style = document.createElement('style');
    style.id = 'exif-viewer-styles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .exif-viewer-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        .exif-viewer-scrollbar::-webkit-scrollbar-track {
            background: ${colors.gray100};
        }

        .exif-viewer-scrollbar::-webkit-scrollbar-thumb {
            background: ${colors.gray400};
            border-radius: 4px;
        }

        .exif-viewer-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${colors.gray500};
        }
    `;

    document.head.appendChild(style);
}
