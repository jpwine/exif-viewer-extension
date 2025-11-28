package parser

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"io"
)

// SimpleExifParser is a basic EXIF parser without external dependencies
// Uses only Go standard library for TinyGo compatibility
type SimpleExifParser struct{}

// EXIF tag IDs
const (
	// IFD0 tags (basic image info)
	tagImageDescription  = 0x010E
	tagMake              = 0x010F
	tagModel             = 0x0110
	tagOrientation       = 0x0112
	tagXResolution       = 0x011A
	tagYResolution       = 0x011B
	tagResolutionUnit    = 0x0128
	tagSoftware          = 0x0131
	tagDateTime          = 0x0132
	tagArtist            = 0x013B
	tagCopyright         = 0x8298
	tagExifIFDPointer    = 0x8769
	tagGPSInfoIFDPointer = 0x8825

	// EXIF Sub-IFD tags
	tagExposureTime       = 0x829A
	tagFNumber            = 0x829D
	tagISOSpeedRatings    = 0x8827
	tagDateTimeOriginal   = 0x9003
	tagDateTimeDigitized  = 0x9004
	tagFocalLength        = 0x920A
	tagFlash              = 0x9209
	tagUserComment        = 0x9286
	tagImageUniqueID      = 0xA420
	tagWhiteBalance       = 0xA403
	tagCameraOwnerName    = 0xA430
	tagBodySerialNumber   = 0xA431
	tagLensMake           = 0xA433
	tagLensModel          = 0xA434
	tagLensSerialNumber   = 0xA435

	// GPS tags
	tagGPSLatitudeRef  = 0x0001
	tagGPSLatitude     = 0x0002
	tagGPSLongitudeRef = 0x0003
	tagGPSLongitude    = 0x0004
)

// Parse implements the Parser interface for SimpleExifParser
func (p *SimpleExifParser) Parse(data []byte) (ExifData, error) {
	// Extract all JPEG metadata (EXIF, JFIF, XMP, ICC Profile, Comments, etc.)
	exifData := make(ExifData)

	reader := bytes.NewReader(data)

	// Check JPEG header
	var header [2]byte
	if _, err := reader.Read(header[:]); err != nil {
		return nil, fmt.Errorf("failed to read JPEG header: %w", err)
	}

	if header[0] != 0xFF || header[1] != 0xD8 {
		return nil, fmt.Errorf("not a valid JPEG file (header: %02X %02X)", header[0], header[1])
	}

	// Parse all segments
	for {
		var marker [2]byte
		if _, err := reader.Read(marker[:]); err != nil {
			if err == io.EOF {
				break
			}
			return nil, fmt.Errorf("failed to read marker: %w", err)
		}

		// Skip non-marker bytes
		if marker[0] != 0xFF {
			continue
		}

		// Start of scan - no more metadata
		if marker[1] == 0xDA {
			break
		}

		// Read segment size
		var size uint16
		if err := binary.Read(reader, binary.BigEndian, &size); err != nil {
			break
		}
		if size < 2 {
			break
		}

		// Read segment data
		segmentData := make([]byte, size-2)
		if _, err := reader.Read(segmentData); err != nil {
			break
		}

		// Process different segment types
		switch marker[1] {
		case 0xFE: // COM - Comment
			exifData["JPEG_Comment"] = string(segmentData)

		case 0xE0: // APP0 - JFIF/JFXX
			if len(segmentData) >= 5 && string(segmentData[0:5]) == "JFIF\x00" {
				exifData["JFIF_Version"] = fmt.Sprintf("%d.%02d", segmentData[5], segmentData[6])
			} else if len(segmentData) >= 5 && string(segmentData[0:5]) == "JFXX\x00" {
				exifData["JFXX_Extension"] = "present"
			} else if len(segmentData) > 0 {
				// Other APP0 data
				exifData["APP0_Data"] = fmt.Sprintf("(%d bytes)", len(segmentData))
			}

		case 0xE1: // APP1 - EXIF or XMP
			if len(segmentData) >= 6 && string(segmentData[0:4]) == "Exif" {
				// Parse EXIF
				if err := p.ParseTIFF(segmentData[6:], exifData); err != nil {
					exifData["EXIF_ParseError"] = err.Error()
				}
			} else if len(segmentData) >= 29 && string(segmentData[0:29]) == "http://ns.adobe.com/xap/1.0/\x00" {
				// XMP metadata
				xmpData := string(segmentData[29:])
				exifData["XMP_Metadata"] = xmpData
			} else if len(segmentData) > 0 {
				exifData["APP1_Data"] = fmt.Sprintf("(%d bytes)", len(segmentData))
			}

		case 0xE2: // APP2 - ICC Profile or FlashPix
			if len(segmentData) >= 14 && string(segmentData[0:12]) == "ICC_PROFILE\x00" {
				exifData["ICC_Profile"] = fmt.Sprintf("present (%d bytes)", len(segmentData))
			} else if len(segmentData) >= 6 && string(segmentData[0:6]) == "FPXR\x00\x00" {
				exifData["FlashPix"] = "present"
			} else if len(segmentData) > 0 {
				exifData["APP2_Data"] = fmt.Sprintf("(%d bytes)", len(segmentData))
			}

		case 0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xEB, 0xEC: // APP3-APP12
			// Generic APP marker
			appNum := marker[1] - 0xE0
			key := fmt.Sprintf("APP%d_Data", appNum)
			// Try to detect text content
			if p.isPrintable(segmentData) && len(segmentData) > 0 {
				exifData[key] = string(segmentData)
			} else {
				exifData[key] = fmt.Sprintf("(%d bytes binary)", len(segmentData))
			}

		case 0xED: // APP13 - Photoshop IRB
			if len(segmentData) >= 14 && string(segmentData[0:14]) == "Photoshop 3.0\x00" {
				exifData["Photoshop_IRB"] = fmt.Sprintf("present (%d bytes)", len(segmentData))
			} else if len(segmentData) > 0 {
				exifData["APP13_Data"] = fmt.Sprintf("(%d bytes)", len(segmentData))
			}

		case 0xEE: // APP14 - Adobe
			if len(segmentData) >= 5 && string(segmentData[0:5]) == "Adobe" {
				exifData["Adobe_APP14"] = "present"
			} else if len(segmentData) > 0 {
				exifData["APP14_Data"] = fmt.Sprintf("(%d bytes)", len(segmentData))
			}

		case 0xEF: // APP15
			if p.isPrintable(segmentData) && len(segmentData) > 0 {
				exifData["APP15_Data"] = string(segmentData)
			} else {
				exifData["APP15_Data"] = fmt.Sprintf("(%d bytes binary)", len(segmentData))
			}
		}
	}

	// Return data even if no EXIF found
	if len(exifData) == 0 {
		return nil, fmt.Errorf("no metadata found in JPEG")
	}

	return exifData, nil
}

// isPrintable checks if data is mostly printable text
func (p *SimpleExifParser) isPrintable(data []byte) bool {
	if len(data) == 0 {
		return false
	}
	printable := 0
	for _, b := range data {
		if (b >= 32 && b <= 126) || b == 9 || b == 10 || b == 13 {
			printable++
		}
	}
	return float64(printable)/float64(len(data)) > 0.8
}

// ParseTIFF parses TIFF-formatted EXIF data
// This is exported so other parsers (like WebPParser) can reuse it
func (p *SimpleExifParser) ParseTIFF(data []byte, exifData ExifData) error {
	if len(data) < 8 {
		return fmt.Errorf("TIFF header too short")
	}

	// Determine byte order
	var byteOrder binary.ByteOrder
	if data[0] == 'I' && data[1] == 'I' {
		byteOrder = binary.LittleEndian
	} else if data[0] == 'M' && data[1] == 'M' {
		byteOrder = binary.BigEndian
	} else {
		return fmt.Errorf("invalid TIFF byte order")
	}

	// Get IFD offset
	ifdOffset := byteOrder.Uint32(data[4:8])

	// Parse IFD
	p.parseIFD(data, int(ifdOffset), byteOrder, exifData)

	return nil
}

func (p *SimpleExifParser) parseIFD(data []byte, offset int, byteOrder binary.ByteOrder, exifData ExifData) {
	if offset+2 > len(data) {
		return
	}

	numEntries := byteOrder.Uint16(data[offset : offset+2])
	offset += 2

	for i := 0; i < int(numEntries); i++ {
		entryOffset := offset + i*12
		if entryOffset+12 > len(data) {
			break
		}

		tag := byteOrder.Uint16(data[entryOffset : entryOffset+2])
		dataType := byteOrder.Uint16(data[entryOffset+2 : entryOffset+4])
		count := byteOrder.Uint32(data[entryOffset+4 : entryOffset+8])
		valueOffset := entryOffset + 8

		p.parseTag(tag, dataType, count, valueOffset, data, byteOrder, exifData)
	}
}

func (p *SimpleExifParser) parseTag(tag uint16, dataType uint16, count uint32, offset int, data []byte, byteOrder binary.ByteOrder, exifData ExifData) {
	var value string

	switch dataType {
	case 2: // ASCII string
		if count <= 4 {
			value = string(bytes.TrimRight(data[offset:offset+int(count)], "\x00"))
		} else {
			valueOffset := int(byteOrder.Uint32(data[offset : offset+4]))
			if valueOffset+int(count) <= len(data) {
				value = string(bytes.TrimRight(data[valueOffset:valueOffset+int(count)], "\x00"))
			}
		}

	case 3: // SHORT (2 bytes)
		if count == 1 {
			value = fmt.Sprintf("%d", byteOrder.Uint16(data[offset:offset+2]))
		}

	case 4: // LONG (4 bytes)
		if count == 1 {
			value = fmt.Sprintf("%d", byteOrder.Uint32(data[offset:offset+4]))
		}

	case 5: // RATIONAL (8 bytes)
		if count == 1 {
			valueOffset := int(byteOrder.Uint32(data[offset : offset+4]))
			if valueOffset+8 <= len(data) {
				num := byteOrder.Uint32(data[valueOffset : valueOffset+4])
				den := byteOrder.Uint32(data[valueOffset+4 : valueOffset+8])
				if den != 0 {
					value = fmt.Sprintf("%.2f", float64(num)/float64(den))
				}
			}
		}

	case 7: // UNDEFINED (used by UserComment)
		// Special handling for UserComment tag (0x9286)
		if tag == tagUserComment && count > 8 {
			valueOffset := int(byteOrder.Uint32(data[offset : offset+4]))
			if valueOffset+int(count) <= len(data) {
				commentData := data[valueOffset : valueOffset+int(count)]
				// First 8 bytes indicate character code
				// "ASCII\x00\x00\x00" = ASCII
				// "JIS\x00\x00\x00\x00\x00" = JIS
				// "UNICODE\x00" = Unicode
				// "\x00\x00\x00\x00\x00\x00\x00\x00" = Undefined
				if len(commentData) > 8 {
					charset := string(bytes.TrimRight(commentData[0:8], "\x00"))
					commentText := commentData[8:]

					// Remove null bytes and convert to string
					value = string(bytes.TrimRight(commentText, "\x00"))

					// Add charset info if not ASCII or undefined
					if charset != "" && charset != "ASCII" {
						value = fmt.Sprintf("%s (charset: %s)", value, charset)
					}
				}
			}
		}
	}

	if value == "" {
		return
	}

	// Map tag to name
	var tagName string
	switch tag {
	// IFD0 tags
	case tagImageDescription:
		tagName = "ImageDescription"
	case tagMake:
		tagName = "Make"
	case tagModel:
		tagName = "Model"
	case tagOrientation:
		tagName = "Orientation"
	case tagSoftware:
		tagName = "Software"
	case tagDateTime:
		tagName = "DateTime"
	case tagArtist:
		tagName = "Artist"
	case tagCopyright:
		tagName = "Copyright"
	// EXIF Sub-IFD tags
	case tagExposureTime:
		tagName = "ExposureTime"
	case tagFNumber:
		tagName = "FNumber"
	case tagISOSpeedRatings:
		tagName = "ISO"
	case tagDateTimeOriginal:
		tagName = "DateTimeOriginal"
	case tagDateTimeDigitized:
		tagName = "DateTimeDigitized"
	case tagFocalLength:
		tagName = "FocalLength"
	case tagFlash:
		tagName = "Flash"
	case tagUserComment:
		tagName = "UserComment"
	case tagImageUniqueID:
		tagName = "ImageUniqueID"
	case tagWhiteBalance:
		tagName = "WhiteBalance"
	case tagCameraOwnerName:
		tagName = "CameraOwnerName"
	case tagBodySerialNumber:
		tagName = "BodySerialNumber"
	case tagLensMake:
		tagName = "LensMake"
	case tagLensModel:
		tagName = "LensModel"
	case tagLensSerialNumber:
		tagName = "LensSerialNumber"
	case tagExifIFDPointer:
		// Parse EXIF sub-IFD
		valueOffset := int(byteOrder.Uint32(data[offset : offset+4]))
		p.parseIFD(data, valueOffset, byteOrder, exifData)
		return
	default:
		return
	}

	exifData[tagName] = value
}

// SupportsFormat returns true for JPEG format
func (p *SimpleExifParser) SupportsFormat(format ImageFormat) bool {
	return format == FormatJPEG
}
