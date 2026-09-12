/**
 * Style definitions for UI components
 * CSS-in-JS approach for easy maintenance
 *
 * Color values are exposed as CSS custom properties (`--ev-*`) scoped under
 * `#exif-viewer-modal-container` (see injectStyles()) so the modal can react
 * to the *browser's* prefers-color-scheme regardless of the host page's own
 * theme. Inline styles below reference `var(--ev-*)` rather than hard-coded
 * hex values so every component (including exif-display.js) stays in sync
 * when the palette changes.
 */

// Raw hex values for the light palette (kept for callers that need a literal
// color, e.g. canvas/text APIs). Prefer the `var(--ev-*)` tokens below for
// anything rendered in the DOM.
export const colors = {
    bg: '#ffffff',
    bgSubtle: '#f8f9fc',
    bgMuted: '#f1f2f6',
    border: '#e6e8f0',
    borderStrong: '#d8dae3',
    text: '#1f2330',
    textMuted: '#6b7280',
    textFaint: '#9aa0ac',
    accent: '#6366f1',
    accentHover: '#4f46e5',
    accentSoft: '#eef0ff',
    danger: '#dc2626',
    dangerBg: '#fdecec',
    dangerText: '#c0392b',
    infoBg: '#eef6ff',
    infoBorder: '#93c5fd',
    infoText: '#1d4ed8',
    warnBg: '#fff8e6',
    warnText: '#92650a',
    overlay: 'rgba(15, 17, 23, 0.55)',
};

// CSS custom-property tokens. Use these (via var()) for anything that should
// automatically follow the viewer's light/dark preference.
export const v = {
    bg: 'var(--ev-bg)',
    bgSubtle: 'var(--ev-bg-subtle)',
    bgMuted: 'var(--ev-bg-muted)',
    border: 'var(--ev-border)',
    borderStrong: 'var(--ev-border-strong)',
    text: 'var(--ev-text)',
    textMuted: 'var(--ev-text-muted)',
    textFaint: 'var(--ev-text-faint)',
    accent: 'var(--ev-accent)',
    accentHover: 'var(--ev-accent-hover)',
    accentSoft: 'var(--ev-accent-soft)',
    danger: 'var(--ev-danger)',
    dangerBg: 'var(--ev-danger-bg)',
    dangerText: 'var(--ev-danger-text)',
    infoBg: 'var(--ev-info-bg)',
    infoBorder: 'var(--ev-info-border)',
    infoText: 'var(--ev-info-text)',
    warnBg: 'var(--ev-warn-bg)',
    warnText: 'var(--ev-warn-text)',
    overlay: 'var(--ev-overlay)',
    shadow: 'var(--ev-shadow)',
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
    normal: '0.25s ease',
    slow: '0.4s ease',
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
    backgroundColor: v.overlay,
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: zIndex.modalOverlay.toString(),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    animation: 'exif-viewer-fadeIn 0.2s ease',
};

// Modal container styles
export const modalContainerStyle = {
    position: 'relative',
    backgroundColor: v.bg,
    color: v.text,
    borderRadius: '16px',
    boxShadow: v.shadow,
    maxWidth: '90vw',
    maxHeight: '90vh',
    width: '1200px',
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
    zIndex: zIndex.modal.toString(),
    animation: 'exif-viewer-slideIn 0.25s ease',
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
    padding: '28px',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
};

// Image container styles
export const imageContainerStyle = {
    ...modalSectionStyle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: v.bgSubtle,
    borderRight: `1px solid ${v.border}`,
};

export const imageContainerPortraitStyle = {
    ...imageContainerStyle,
    borderRight: 'none',
    borderBottom: `1px solid ${v.border}`,
    maxHeight: '50%',
};

// Image styles
export const imageStyle = {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    display: 'block',
    borderRadius: '8px',
};

// EXIF data container styles
export const exifContainerStyle = {
    ...modalSectionStyle,
};

// EXIF table styles
export const exifTableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13.5px',
};

export const exifTableRowStyle = {
    borderBottom: `1px solid ${v.border}`,
    transition: `background-color ${transitions.fast}`,
};

export const exifTableRowHoverStyle = {
    backgroundColor: v.bgSubtle,
};

export const exifTableCellStyle = {
    padding: '10px 8px',
    textAlign: 'left',
    verticalAlign: 'top',
};

export const exifTableKeyStyle = {
    ...exifTableCellStyle,
    fontWeight: '600',
    color: v.textMuted,
    width: '38%',
    wordBreak: 'break-word',
};

export const exifTableValueStyle = {
    ...exifTableCellStyle,
    color: v.text,
    wordBreak: 'break-all',
};

// Section header (used for "画像情報" / "その他のメタデータ" separators)
export const sectionHeaderStyle = {
    padding: '10px 8px',
    fontWeight: '600',
    fontSize: '11.5px',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
    color: v.textFaint,
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
    backgroundColor: v.bgMuted,
    color: v.textMuted,
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
    backgroundColor: v.border,
    transform: 'scale(1.08)',
};

// Loading spinner styles
export const loadingSpinnerStyle = {
    border: `3px solid ${v.border}`,
    borderTop: `3px solid ${v.accent}`,
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'exif-viewer-spin 0.8s linear infinite',
};

// Error message styles
export const errorMessageStyle = {
    color: v.dangerText,
    padding: '14px 16px',
    backgroundColor: v.dangerBg,
    borderRadius: '10px',
    marginTop: '16px',
};

/**
 * Add CSS variables + keyframe animations (idempotent).
 *
 * `root` should be the modal's shadow root. Rendering the modal inside a
 * shadow tree keeps the host page's own stylesheets (resets, `button {}` /
 * `table {}` overrides, `!important` rules, etc.) from bleeding into it —
 * appending plain DOM nodes to `document.body` shares the page's cascade
 * and can visibly break the modal on sites with aggressive global CSS.
 * `root` defaults to `document` for callers that don't use a shadow root.
 */
export function injectStyles(root = document) {
    if (root.getElementById('exif-viewer-styles')) {
        return; // Already injected
    }

    const style = document.createElement('style');
    style.id = 'exif-viewer-styles';
    style.textContent = `
        #exif-viewer-modal-container {
            --ev-bg: ${colors.bg};
            --ev-bg-subtle: ${colors.bgSubtle};
            --ev-bg-muted: ${colors.bgMuted};
            --ev-border: ${colors.border};
            --ev-border-strong: ${colors.borderStrong};
            --ev-text: ${colors.text};
            --ev-text-muted: ${colors.textMuted};
            --ev-text-faint: ${colors.textFaint};
            --ev-accent: ${colors.accent};
            --ev-accent-hover: ${colors.accentHover};
            --ev-accent-soft: ${colors.accentSoft};
            --ev-danger: ${colors.danger};
            --ev-danger-bg: ${colors.dangerBg};
            --ev-danger-text: ${colors.dangerText};
            --ev-info-bg: ${colors.infoBg};
            --ev-info-border: ${colors.infoBorder};
            --ev-info-text: ${colors.infoText};
            --ev-warn-bg: ${colors.warnBg};
            --ev-warn-text: ${colors.warnText};
            --ev-overlay: ${colors.overlay};
            --ev-shadow: 0 20px 60px rgba(15, 17, 23, 0.25);
            display: block;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: var(--ev-text);
            text-align: left;
        }

        @media (prefers-color-scheme: dark) {
            #exif-viewer-modal-container {
                --ev-bg: #1c1f28;
                --ev-bg-subtle: #23262f;
                --ev-bg-muted: #2a2e3a;
                --ev-border: #333747;
                --ev-border-strong: #3d4152;
                --ev-text: #e6e8f0;
                --ev-text-muted: #9aa0ac;
                --ev-text-faint: #6b7280;
                --ev-accent: #818cf8;
                --ev-accent-hover: #a5b4fc;
                --ev-accent-soft: rgba(129, 140, 248, 0.18);
                --ev-danger: #f87171;
                --ev-danger-bg: rgba(220, 38, 38, 0.18);
                --ev-danger-text: #f87171;
                --ev-info-bg: rgba(59, 130, 246, 0.14);
                --ev-info-border: rgba(96, 165, 250, 0.4);
                --ev-info-text: #93c5fd;
                --ev-warn-bg: rgba(217, 164, 6, 0.14);
                --ev-warn-text: #eab308;
                --ev-overlay: rgba(0, 0, 0, 0.65);
                --ev-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }
        }

        #exif-viewer-modal-container *,
        #exif-viewer-modal-container *::before,
        #exif-viewer-modal-container *::after {
            box-sizing: border-box;
            font-family: inherit;
        }

        @keyframes exif-viewer-fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes exif-viewer-slideIn {
            from {
                opacity: 0;
                transform: translateY(-12px) scale(0.98);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        @keyframes exif-viewer-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .exif-viewer-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        .exif-viewer-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }

        .exif-viewer-scrollbar::-webkit-scrollbar-thumb {
            background: var(--ev-border-strong);
            border-radius: 4px;
        }

        .exif-viewer-scrollbar::-webkit-scrollbar-thumb:hover {
            background: var(--ev-text-faint);
        }
    `;

    // A ShadowRoot accepts children directly; plain `document` does not
    // (only <head>/<body> do), so route accordingly.
    (root === document ? document.head : root).appendChild(style);
}
