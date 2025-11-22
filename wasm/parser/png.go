package parser

import "fmt"

// PNGParser handles PNG format images
// Currently a stub for future implementation
type PNGParser struct{}

// Parse extracts EXIF/metadata from PNG images
// TODO: Implement PNG chunk parsing for EXIF data
func (p *PNGParser) Parse(data []byte) (ExifData, error) {
	return nil, fmt.Errorf("PNG format not yet implemented")
}

// SupportsFormat checks if this parser supports the given format
func (p *PNGParser) SupportsFormat(format ImageFormat) bool {
	return format == FormatPNG
}
