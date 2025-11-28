package parser

import (
	"bytes"
	"compress/zlib"
	"encoding/binary"
	"fmt"
	"hash/crc32"
	"io"
	"strconv"
	"strings"
)

// PNGParser handles PNG format images
// Parses PNG chunks for EXIF and text metadata
type PNGParser struct {
	exifParser *SimpleExifParser
}

// PNG signature: 89 50 4E 47 0D 0A 1A 0A
var pngSignature = []byte{137, 80, 78, 71, 13, 10, 26, 10}

// Parse extracts EXIF/metadata from PNG images
func (p *PNGParser) Parse(data []byte) (ExifData, error) {
	// Initialize embedded parser
	if p.exifParser == nil {
		p.exifParser = &SimpleExifParser{}
	}

	exifData := make(ExifData)

	// Verify PNG signature
	if len(data) < 8 {
		return nil, fmt.Errorf("file too small to be PNG")
	}

	if !bytes.Equal(data[0:8], pngSignature) {
		return nil, fmt.Errorf("not a valid PNG file")
	}

	// Parse chunks starting at offset 8
	offset := 8

	for offset < len(data) {
		// Read chunk header (8 bytes: 4-byte length + 4-byte type)
		if offset+8 > len(data) {
			break
		}

		// Read chunk length (big-endian)
		chunkLength := binary.BigEndian.Uint32(data[offset : offset+4])
		chunkType := string(data[offset+4 : offset+8])

		offset += 8

		// Validate chunk length
		if offset+int(chunkLength)+4 > len(data) {
			break
		}

		chunkData := data[offset : offset+int(chunkLength)]
		chunkCRC := binary.BigEndian.Uint32(data[offset+int(chunkLength) : offset+int(chunkLength)+4])

		// Verify CRC (chunk type + chunk data)
		crcData := append([]byte(chunkType), chunkData...)
		calculatedCRC := crc32.ChecksumIEEE(crcData)
		if calculatedCRC != chunkCRC {
			exifData["PNG_Warning"] = fmt.Sprintf("CRC mismatch for chunk %s", chunkType)
		}

		// Process metadata chunks
		switch chunkType {
		case "IHDR":
			// Image header - width, height, bit depth, color type
			p.parseIHDR(chunkData, exifData)

		case "tEXt":
			// Latin-1 text chunk
			p.parseTEXt(chunkData, exifData)

		case "zTXt":
			// Compressed text chunk
			p.parseZTXt(chunkData, exifData)

		case "iTXt":
			// International text chunk (UTF-8)
			p.parseITXt(chunkData, exifData)

		case "eXIf":
			// EXIF metadata (TIFF format)
			if err := p.exifParser.ParseTIFF(chunkData, exifData); err != nil {
				exifData["EXIF_ParseError"] = err.Error()
			}

		case "pHYs":
			// Physical pixel dimensions
			p.parsePHYs(chunkData, exifData)

		case "tIME":
			// Last modification time
			p.parseTIME(chunkData, exifData)

		case "iCCP":
			// ICC color profile
			p.parseICCP(chunkData, exifData)

		case "sPLT":
			// Suggested palette
			if len(chunkData) > 0 {
				nullPos := bytes.IndexByte(chunkData, 0)
				if nullPos > 0 {
					exifData["PNG_Palette"] = string(chunkData[:nullPos])
				}
			}

		case "IEND":
			// End of PNG data stream
			break
		}

		// Move to next chunk
		offset += int(chunkLength) + 4 // data + CRC
	}

	if len(exifData) == 0 {
		return nil, fmt.Errorf("no metadata found in PNG")
	}

	return exifData, nil
}

// parseIHDR extracts image header information
func (p *PNGParser) parseIHDR(data []byte, exifData ExifData) {
	if len(data) < 13 {
		return
	}

	width := binary.BigEndian.Uint32(data[0:4])
	height := binary.BigEndian.Uint32(data[4:8])
	bitDepth := data[8]
	colorType := data[9]
	compressionMethod := data[10]
	filterMethod := data[11]
	interlaceMethod := data[12]

	exifData["PNG_ImageWidth"] = strconv.FormatUint(uint64(width), 10)
	exifData["PNG_ImageHeight"] = strconv.FormatUint(uint64(height), 10)
	exifData["PNG_BitDepth"] = strconv.Itoa(int(bitDepth))

	// Color type descriptions
	colorTypes := map[byte]string{
		0: "Grayscale",
		2: "RGB",
		3: "Indexed (Palette)",
		4: "Grayscale with Alpha",
		6: "RGB with Alpha",
	}
	if desc, ok := colorTypes[colorType]; ok {
		exifData["PNG_ColorType"] = desc
	} else {
		exifData["PNG_ColorType"] = strconv.Itoa(int(colorType))
	}

	exifData["PNG_Compression"] = strconv.Itoa(int(compressionMethod))
	exifData["PNG_Filter"] = strconv.Itoa(int(filterMethod))

	if interlaceMethod == 0 {
		exifData["PNG_Interlace"] = "None"
	} else if interlaceMethod == 1 {
		exifData["PNG_Interlace"] = "Adam7"
	}
}

// parseTEXt extracts Latin-1 text metadata
func (p *PNGParser) parseTEXt(data []byte, exifData ExifData) {
	// Find null separator
	nullPos := bytes.IndexByte(data, 0)
	if nullPos < 0 || nullPos >= len(data)-1 {
		return
	}

	keyword := string(data[:nullPos])
	text := string(data[nullPos+1:])

	exifData["PNG_"+keyword] = text
}

// parseZTXt extracts compressed text metadata
func (p *PNGParser) parseZTXt(data []byte, exifData ExifData) {
	// Find null separator
	nullPos := bytes.IndexByte(data, 0)
	if nullPos < 0 || nullPos+2 >= len(data) {
		return
	}

	keyword := string(data[:nullPos])
	compressionMethod := data[nullPos+1]

	// Only deflate (method 0) is supported
	if compressionMethod != 0 {
		return
	}

	// Decompress the text
	compressedData := data[nullPos+2:]
	reader, err := zlib.NewReader(bytes.NewReader(compressedData))
	if err != nil {
		return
	}
	defer reader.Close()

	var buf bytes.Buffer
	if _, err := io.Copy(&buf, reader); err != nil {
		return
	}

	text := buf.String()

	exifData["PNG_"+keyword] = text
}

// parseITXt extracts international text metadata (UTF-8)
func (p *PNGParser) parseITXt(data []byte, exifData ExifData) {
	// Find first null separator (after keyword)
	nullPos1 := bytes.IndexByte(data, 0)
	if nullPos1 < 0 || nullPos1+2 >= len(data) {
		return
	}

	keyword := string(data[:nullPos1])
	compressionFlag := data[nullPos1+1]
	compressionMethod := data[nullPos1+2]

	// Find second null separator (after language tag)
	remaining := data[nullPos1+3:]
	nullPos2 := bytes.IndexByte(remaining, 0)
	if nullPos2 < 0 {
		return
	}

	languageTag := string(remaining[:nullPos2])

	// Find third null separator (after translated keyword)
	remaining = remaining[nullPos2+1:]
	nullPos3 := bytes.IndexByte(remaining, 0)
	if nullPos3 < 0 {
		return
	}

	translatedKeyword := string(remaining[:nullPos3])
	textData := remaining[nullPos3+1:]

	var text string

	// Handle compression
	if compressionFlag == 1 && compressionMethod == 0 {
		// Decompress using zlib
		reader, err := zlib.NewReader(bytes.NewReader(textData))
		if err != nil {
			return
		}
		defer reader.Close()

		var buf bytes.Buffer
		if _, err := io.Copy(&buf, reader); err != nil {
			return
		}
		text = buf.String()
	} else {
		text = string(textData)
	}

	// Build key with language and translated keyword if available
	key := "PNG_" + keyword
	if languageTag != "" || translatedKeyword != "" {
		details := []string{}
		if languageTag != "" {
			details = append(details, "lang:"+languageTag)
		}
		if translatedKeyword != "" {
			details = append(details, "translated:"+translatedKeyword)
		}
		key += " (" + strings.Join(details, ", ") + ")"
	}

	exifData[key] = text
}

// parsePHYs extracts physical pixel dimensions
func (p *PNGParser) parsePHYs(data []byte, exifData ExifData) {
	if len(data) < 9 {
		return
	}

	pixelsPerUnitX := binary.BigEndian.Uint32(data[0:4])
	pixelsPerUnitY := binary.BigEndian.Uint32(data[4:8])
	unit := data[8]

	unitStr := "unknown"
	if unit == 0 {
		unitStr = "aspect ratio"
	} else if unit == 1 {
		unitStr = "meter"
	}

	exifData["PNG_PixelsPerUnitX"] = strconv.FormatUint(uint64(pixelsPerUnitX), 10)
	exifData["PNG_PixelsPerUnitY"] = strconv.FormatUint(uint64(pixelsPerUnitY), 10)
	exifData["PNG_PixelUnit"] = unitStr
}

// parseTIME extracts last modification time
func (p *PNGParser) parseTIME(data []byte, exifData ExifData) {
	if len(data) < 7 {
		return
	}

	year := binary.BigEndian.Uint16(data[0:2])
	month := data[2]
	day := data[3]
	hour := data[4]
	minute := data[5]
	second := data[6]

	timeStr := fmt.Sprintf("%04d-%02d-%02d %02d:%02d:%02d",
		year, month, day, hour, minute, second)

	exifData["PNG_ModifyDate"] = timeStr
}

// parseICCP extracts ICC color profile name
func (p *PNGParser) parseICCP(data []byte, exifData ExifData) {
	// Find null separator
	nullPos := bytes.IndexByte(data, 0)
	if nullPos < 0 || nullPos+2 >= len(data) {
		return
	}

	profileName := string(data[:nullPos])
	compressionMethod := data[nullPos+1]

	exifData["PNG_ICCProfile"] = profileName

	// Only deflate (method 0) is supported for ICC profile
	if compressionMethod == 0 {
		// We could decompress and parse the ICC profile here
		// For now, just note that it exists
		exifData["PNG_ICCCompression"] = "deflate"
	}
}

// SupportsFormat checks if this parser supports the given format
func (p *PNGParser) SupportsFormat(format ImageFormat) bool {
	return format == FormatPNG
}
