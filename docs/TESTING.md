# Manual Testing Checklist

Manual QA checklist for verifying metadata extraction and the extension UI in Chrome. Covers all currently supported formats (JPEG, PNG, WebP); extend it as new formats are added.

## 1. Load the Extension

```bash
# Ensure WASM is built
ls -lh wasm/exif-parser.wasm wasm/wasm_exec.js

# If not built, run:
./build.sh
```

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked" (or "Reload" if already loaded) on the Exif Viewer extension
4. Check for any load errors

## 2. Test With Metadata Present

**Sample images with EXIF/text metadata**: https://github.com/ianare/exif-samples, or create your own:

```bash
# Add EXIF with ExifTool (works on JPEG, PNG, WebP)
exiftool -Make="Canon" -Model="EOS 5D" -Artist="Test User" image.png

# Add text metadata with ImageMagick (PNG tEXt chunks)
convert input.png -set comment "Test Comment" -set copyright "Test Copyright" output.png
```

**Test steps**:
1. Open a webpage with the target image
2. Right-click the image → "View EXIF"
3. Verify the modal displays the expected metadata

**Expected results by format**:
- **JPEG**: EXIF Summary + EXIF Details table; JPEG Comment (COM segment) in a blue box if present; JFIF/XMP/ICC/Photoshop/Adobe metadata in the "Other Metadata" section if present.
- **PNG**: `PNG_ImageWidth`/`PNG_ImageHeight`, `PNG_ColorType`, `PNG_BitDepth` always shown; EXIF tags if an `eXIf` chunk is present; text metadata as `PNG_<keyword>` (e.g. `PNG_Author`, `PNG_Copyright`).
- **WebP**: `WebP_Features`, `WebP_Canvas_Width/Height`, `WebP_Format`; EXIF/XMP if present in EXIF/XMP chunks.

## 3. Test Without Metadata

Use a plain image with no metadata (e.g. a screenshot or basic export).

**Expected**: modal shows "No metadata found" for that format, or falls back to basic image info (file size, MIME type) per the [Fallback Behavior](../CLAUDE.md#fallback-behavior) rules.

## 4. Format-Specific Chunk/Segment Coverage

### PNG
- **tEXt**: Latin-1 keyword/value pairs (Title, Author, Description, Copyright, Software).
- **zTXt**: compressed text — verify it's transparently decompressed.
- **iTXt**: UTF-8 international text — key format `PNG_<keyword> (lang:xx, translated:yy)`.
- **iCCP**: `PNG_ICCProfile` name + `PNG_ICCCompression` shown.
- **tIME**: `PNG_ModifyDate` in `YYYY-MM-DD HH:MM:SS` format.

### WebP
- VP8X extended header: feature flags, canvas dimensions.
- ANIM chunk: `WebP_Animation_BgColor`, `WebP_Animation_LoopCount`.
- Format detection: `WebP_Format` reads "Lossy (VP8)" or "Lossless (VP8L)" correctly.

### JPEG
- UserComment charset detection (ASCII / UNICODE / JIS).
- Comprehensive APP0–APP15 segment dump (auto text/binary detection).

## 5. Console Checks

**Service Worker Console**: `chrome://extensions/` → "service worker" link under Exif Viewer.
- Expected: no Go panic messages, no WASM loading errors.

**Page Console**: DevTools (F12) on the test page after viewing an image's EXIF.
- Expected: no JavaScript errors, no CSP violations, modal renders correctly.

## 6. Edge Cases

- **Corrupted file** (e.g. PNG with CRC errors): expect a warning (e.g. "CRC mismatch for chunk `<type>`") and parsing to continue with remaining valid chunks — not a crash.
- **Truncated file**: expect graceful handling, partial metadata from whatever parsed, no browser crash.
- **Very large image** (>10MB): parser should complete without hanging or exhausting memory (may be slow).

## 7. Cross-Check Against ExifTool

```bash
exiftool -a -G1 image.png   # or .jpg / .webp
```

Compare dimensions, color type/bit depth, text metadata, and EXIF tags against the extension's modal output.

## 8. Multi-Format Page Test

Test a page with mixed formats: JPEG with EXIF, PNG with/without EXIF, WebP with EXIF, and an unsupported format (e.g. GIF).

**Expected**: each supported format parses correctly and independently; unsupported formats show an appropriate error instead of breaking the others.

## 9. Popup Scan Test

1. Click the extension icon → scan button
2. Verify images of all supported formats appear in the list
3. Try each sort option (area / height / width)
4. Click an image from the list → verify the metadata modal opens

## 10. Performance

Test a page with many images (50+): scan should complete in a reasonable time (a few seconds) without noticeable browser lag or excessive memory use.

## Regression Checklist

After any parser change, re-verify the formats you didn't touch still work:

- [ ] JPEG parsing unaffected
- [ ] PNG parsing unaffected
- [ ] WebP parsing unaffected
- [ ] TIFF-embedded EXIF (shared `ParseTIFF()` path) unaffected
- [ ] Modal / popup / scanning UI unaffected
- [ ] Service worker WASM loading unaffected
