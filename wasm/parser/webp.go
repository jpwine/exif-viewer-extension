package parser

import (
	"fmt"
)

// WebPParser handles WebP format images
// Parses RIFF-based WebP container for EXIF and XMP metadata
type WebPParser struct {
	exifParser *SimpleExifParser
}

// Parse extracts EXIF/metadata from WebP images
func (p *WebPParser) Parse(data []byte) (ExifData, error) {
	// Initialize embedded parser
	if p.exifParser == nil {
		p.exifParser = &SimpleExifParser{}
	}

	exifData := make(ExifData)

	// Verify WebP signature (RIFF....WEBP)
	if len(data) < 12 {
		return nil, fmt.Errorf("file too small to be WebP")
	}

	if string(data[0:4]) != "RIFF" {
		return nil, fmt.Errorf("not a valid RIFF file")
	}

	if string(data[8:12]) != "WEBP" {
		return nil, fmt.Errorf("not a valid WebP file")
	}

	// Read file size from RIFF header (little-endian)
	fileSize := uint32(data[4]) | uint32(data[5])<<8 | uint32(data[6])<<16 | uint32(data[7])<<24

	// Parse chunks starting at offset 12
	offset := 12

	for offset < len(data) && offset < int(fileSize)+8 {
		// Read chunk header (8 bytes minimum: 4-byte FourCC + 4-byte size)
		if offset+8 > len(data) {
			break
		}

		chunkID := string(data[offset : offset+4])
		chunkSize := uint32(data[offset+4]) | uint32(data[offset+5])<<8 |
		             uint32(data[offset+6])<<16 | uint32(data[offset+7])<<24

		offset += 8

		// Validate chunk size
		if offset+int(chunkSize) > len(data) {
			break
		}

		chunkData := data[offset : offset+int(chunkSize)]

		// Process metadata chunks
		switch chunkID {
		case "EXIF":
			// WebP EXIF chunk contains raw TIFF data (same as JPEG APP1 EXIF)
			// Parse using existing TIFF parser
			if err := p.exifParser.ParseTIFF(chunkData, exifData); err != nil {
				exifData["EXIF_ParseError"] = err.Error()
			}

		case "XMP ":
			// XMP metadata (XML format)
			xmpData := string(chunkData)
			exifData["XMP_Metadata"] = xmpData

		case "VP8X":
			// Extended header - contains feature flags
			if len(chunkData) >= 10 {
				flags := chunkData[0]
				hasICC := (flags & 0x20) != 0
				hasAlpha := (flags & 0x10) != 0
				hasEXIF := (flags & 0x08) != 0
				hasXMP := (flags & 0x04) != 0
				hasAnimation := (flags & 0x02) != 0

				features := ""
				if hasICC {
					features += "ICC "
				}
				if hasAlpha {
					features += "Alpha "
				}
				if hasEXIF {
					features += "EXIF "
				}
				if hasXMP {
					features += "XMP "
				}
				if hasAnimation {
					features += "Animation "
				}

				if features != "" {
					exifData["WebP_Features"] = features
				}

				// Canvas dimensions (24-bit, 1-based)
				canvasWidth := (uint32(chunkData[4]) | uint32(chunkData[5])<<8 | uint32(chunkData[6])<<16) + 1
				canvasHeight := (uint32(chunkData[7]) | uint32(chunkData[8])<<8 | uint32(chunkData[9])<<16) + 1
				exifData["WebP_Canvas_Width"] = fmt.Sprintf("%d", canvasWidth)
				exifData["WebP_Canvas_Height"] = fmt.Sprintf("%d", canvasHeight)
			}

		case "ICCP":
			// ICC color profile
			exifData["ICC_Profile"] = fmt.Sprintf("present (%d bytes)", len(chunkData))

		case "ANIM":
			// Animation parameters
			if len(chunkData) >= 6 {
				bgColor := uint32(chunkData[0]) | uint32(chunkData[1])<<8 |
				           uint32(chunkData[2])<<16 | uint32(chunkData[3])<<24
				loopCount := uint16(chunkData[4]) | uint16(chunkData[5])<<8
				exifData["WebP_Animation_BgColor"] = fmt.Sprintf("0x%08X", bgColor)
				exifData["WebP_Animation_LoopCount"] = fmt.Sprintf("%d", loopCount)
			}

		case "VP8 ", "VP8L":
			// Image data chunks - record format type
			if chunkID == "VP8 " {
				exifData["WebP_Format"] = "Lossy (VP8)"
			} else {
				exifData["WebP_Format"] = "Lossless (VP8L)"
			}
		}

		// Move to next chunk (add padding if chunk size is odd)
		offset += int(chunkSize)
		if chunkSize%2 == 1 {
			offset++ // Skip padding byte
		}
	}

	// If no metadata found, return basic info
	if len(exifData) == 0 {
		return nil, fmt.Errorf("no metadata found in WebP file")
	}

	return exifData, nil
}

// SupportsFormat checks if this parser supports the given format
func (p *WebPParser) SupportsFormat(format ImageFormat) bool {
	return format == FormatWebP
}
