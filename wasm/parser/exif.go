package parser

// ExifParser handles JPEG and TIFF formats with EXIF data
// This is an alias for SimpleExifParser (standard library only)
type ExifParser struct {
	SimpleExifParser
}

// Parse extracts EXIF data from JPEG or TIFF images
func (p *ExifParser) Parse(data []byte) (ExifData, error) {
	return p.SimpleExifParser.Parse(data)
}

// SupportsFormat checks if this parser supports the given format
func (p *ExifParser) SupportsFormat(format ImageFormat) bool {
	return format == FormatJPEG || format == FormatTIFF
}
