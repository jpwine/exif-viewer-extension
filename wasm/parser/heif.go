package parser

import "fmt"

// HEIFParser handles HEIF/HEIC format images
// Currently a stub for future implementation
type HEIFParser struct{}

// Parse extracts EXIF/metadata from HEIF images
// TODO: Implement HEIF container parsing for EXIF data
func (p *HEIFParser) Parse(data []byte) (ExifData, error) {
	return nil, fmt.Errorf("HEIF format not yet implemented")
}

// SupportsFormat checks if this parser supports the given format
func (p *HEIFParser) SupportsFormat(format ImageFormat) bool {
	return format == FormatHEIF
}
