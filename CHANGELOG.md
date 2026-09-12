# Changelog

All notable changes to the EXIF Viewer Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-09-12

### Added
- **i18n scaffolding (English + Japanese)**: added `_locales/en/messages.json` and `_locales/ja/messages.json`, and set `"default_locale": "en"` in `manifest.json`. All user-facing strings (popup labels/buttons/states, context menu title, modal aria-labels, EXIF section headers and summary labels, error messages) now go through `chrome.i18n.getMessage()` instead of being hard-coded in Japanese. Chrome's built-in locale matching means the browser's Japanese UI language shows Japanese, and any other UI language falls back to English — no custom language-switch logic needed.
- `packing.sh` now bundles `_locales/` into `extension.zip`.

### Fixed (design issues)
- **Cross-origin image fetch could fail on most sites**: `background.js` fetches image bytes directly in the service worker, but `manifest.json` declared no `host_permissions`. Without it, `fetch()` there is bound by the same CORS rules as a normal page and errors out on any image host that doesn't send permissive CORS headers — silently defeating the extension's core purpose on much of the web. Added `"host_permissions": ["<all_urls>"]`.
- **Overly broad `tabs` permission**: nothing in the code needs more than `activeTab` (tab access is always initiated by a user gesture — a popup click or the context menu). Removed `tabs`, ironic to request given the extension's own "everything stays local" positioning.
- **Dead `content_security_policy.sandbox` entry**: no `sandbox` pages are declared anywhere in the manifest, so this CSP key was inert and misleading. Removed.
- **Modal had no CSS isolation**: the EXIF modal was appended straight into the host page's `document.body`, sharing its cascade — a page with global `button {}`/`table {}` resets or `!important` rules could visibly break it. The modal now renders inside a Shadow DOM (`ui/modal.js`), so host-page styles can no longer reach in.
- **Dead/duplicated list-rendering code**: `ui/image-list.js` exported `createImageList`/`createImageListItem`/`getSortTypeName`/`getNextSortType`, none of which were ever imported — the popup reimplemented its own list rendering independently. Removed the unused exports.
- **Hard-coded colors scattered outside the theme file**: `ui/exif-display.js` bypassed `ui/styles.js`'s centralized palette with ad hoc hex values throughout, defeating its own stated purpose. Now consistently uses the shared tokens.
- **`alert()` on fatal errors**: a failure to load the UI modules fell back to a blocking native `alert()`. Replaced with a small self-contained toast.

### Changed (modernization)
- New default palette (indigo accent, neutral grays) across the popup and the injected modal, both with automatic dark-mode support via `prefers-color-scheme`.
- Popup redesigned: card-style image rows with thumbnails, refined empty/loading states, consolidated duplicate `change` listener on the sort dropdown.
- Modal: backdrop blur, softer shadow/radius, `role="dialog"` + `aria-modal`, focus moved into the dialog on open and restored to the trigger on close, basic Tab focus trap.

## [1.1.0] - 2025-11-28

### Added
- **Complete PNG format support**: new `wasm/parser/png.go`, following the same parser pattern as the WebP parser.
  - **EXIF**: full TIFF-based tag extraction from `eXIf` chunks, reusing `ParseTIFF()`.
  - **Text metadata**: `tEXt` (Latin-1), `zTXt` (zlib-compressed Latin-1, auto-decompressed), and `iTXt` (UTF-8, with language tag/translated-keyword support), exposed as `PNG_<keyword>`.
  - **Image properties**: `IHDR` (`PNG_ImageWidth/Height`, `PNG_BitDepth`, `PNG_ColorType`, `PNG_Interlace`).
  - **Physical dimensions and timestamp**: `pHYs` (`PNG_PixelsPerUnitX/Y`, `PNG_PixelUnit`) and `tIME` (`PNG_ModifyDate`).
  - **Color management**: `iCCP` chunk (`PNG_ICCProfile`, `PNG_ICCCompression`) and `sPLT` (suggested palette) chunks.
  - **Data integrity**: CRC32 validation on every chunk, with warnings (not failures) on mismatches so remaining valid chunks still parse.
- No new dependencies (still TinyGo/standard-library only): `bytes`, `compress/zlib`, `encoding/binary`, `hash/crc32`, `io`.

### Changed
- WASM module size: 313KB → 362KB.
- `manifest.json` version bumped to `1.1.0`.

## [1.0.1] - 2025-11-23

### Added
- **EXIF Text Tags Support** (8 new tags)
  - ImageDescription (0x010E) - 画像の説明・タイトル
  - Artist (0x013B) - 作者名・撮影者名
  - Copyright (0x8298) - 著作権情報
  - **UserComment (0x9286)** - ユーザーコメント（**Unicode対応**）
  - ImageUniqueID (0xA420) - 画像固有ID
  - CameraOwnerName (0xA430) - カメラ所有者名
  - BodySerialNumber (0xA431) - カメラボディのシリアル番号
  - LensSerialNumber (0xA435) - レンズのシリアル番号

- **UserComment Special Processing**
  - UNDEFINED data type (type 7) support
  - Character encoding detection (ASCII, UNICODE, JIS)
  - Charset information display for non-ASCII comments
  - Example: `"これはテストです (charset: UNICODE)"`

- **WebP Format Support** (FULL)
  - RIFF container parsing
  - EXIF metadata extraction (TIFF-based)
  - XMP metadata extraction (XML format)
  - VP8X extended header parsing
  - ICC Profile detection
  - Animation parameters (ANIM chunk)
  - Format type detection (VP8 lossy vs VP8L lossless)

### Changed
- Enhanced EXIF tag coverage from 8 to 16 text tags
- Improved metadata display with comprehensive text field support

### Technical Details
- WASM module size: 312KB → 313KB (+1KB)
- No external dependencies added (TinyGo compatible)
- Character encoding: ASCII, UNICODE, JIS support

## [1.0.0] - 2025-11-22

### Added
- Initial release
- **WASM-based EXIF parser** (Go + TinyGo)
- **JPEG/TIFF format support**
- Basic EXIF tags (8 tags):
  - Make, Model, Software
  - DateTime, DateTimeOriginal, DateTimeDigitized
  - LensMake, LensModel
- **Context menu integration** ("View EXIF")
- **Popup image scanner**
  - Sort by area/height/width
  - User preference storage (`chrome.storage.sync`)
- **Modal display** with image preview
- **Offline processing** - No external servers
- **Privacy-focused** - All data processed locally

### Technical Details
- Chrome Extension Manifest V3
- Service Worker architecture
- WASM execution in background service worker
- Content Script for UI injection
- Modular UI components (`ui/` directory)
- WASM module size: 312KB

### Supported Metadata
- EXIF tags (basic camera info)
- JFIF version info
- XMP metadata (truncated)
- ICC Profile detection
- JPEG Comments (COM segment)
- Photoshop IRB data
- Adobe markers
- APP0-APP15 segments

## Future Enhancements

### Planned for v1.1.x
- More EXIF tags (SubjectArea, SceneType, CustomRendered)
- Extended GPS tags (Altitude, TimeStamp, DateStamp)
- Maker notes (Canon, Nikon, Sony)

### Planned for v1.2.x
- PNG format support (tEXt, iTXt, eXIf chunks)
- HEIF/HEIC format support

### Planned for v1.3.x
- Dark mode support
- Customizable themes
- Collapsible metadata sections
- Export to JSON/CSV

---

## Links
- [Repository](https://github.com/yourusername/exif-viewer-extension)
- [Chrome Web Store](https://chrome.google.com/webstore) (申請準備中)
- [Issues](https://github.com/yourusername/exif-viewer-extension/issues)

## Version Numbering
- **MAJOR**: Incompatible API changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)
