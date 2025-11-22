package parser

import "io"

// ImageFormat represents supported image formats
type ImageFormat int

const (
	FormatUnknown ImageFormat = iota
	FormatJPEG
	FormatTIFF
	FormatPNG    // Future support
	FormatWebP   // Future support
	FormatHEIF   // Future support
)

// ExifData represents extracted EXIF metadata
type ExifData map[string]string

// Parser is the interface for image format parsers
type Parser interface {
	// Parse extracts EXIF data from the image
	Parse(data []byte) (ExifData, error)

	// SupportsFormat checks if this parser supports the given format
	SupportsFormat(format ImageFormat) bool
}

// DetectFormat detects the image format from the first few bytes
func DetectFormat(data []byte) ImageFormat {
	if len(data) < 12 {
		return FormatUnknown
	}

	// JPEG: FF D8 FF
	if data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF {
		return FormatJPEG
	}

	// TIFF: Little-endian (II) or Big-endian (MM)
	if (data[0] == 0x49 && data[1] == 0x49 && data[2] == 0x2A && data[3] == 0x00) ||
	   (data[0] == 0x4D && data[1] == 0x4D && data[2] == 0x00 && data[3] == 0x2A) {
		return FormatTIFF
	}

	// PNG: 89 50 4E 47 0D 0A 1A 0A
	if data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47 {
		return FormatPNG
	}

	// WebP: RIFF....WEBP
	if data[0] == 0x52 && data[1] == 0x49 && data[2] == 0x46 && data[3] == 0x46 &&
	   data[8] == 0x57 && data[9] == 0x45 && data[10] == 0x42 && data[11] == 0x50 {
		return FormatWebP
	}

	// HEIF: ftyp heic/heix/mif1
	if len(data) >= 12 && data[4] == 0x66 && data[5] == 0x74 && data[6] == 0x79 && data[7] == 0x70 {
		return FormatHEIF
	}

	return FormatUnknown
}

// GetParser returns the appropriate parser for the given format
func GetParser(format ImageFormat) Parser {
	switch format {
	case FormatJPEG, FormatTIFF:
		return &ExifParser{}
	case FormatPNG:
		return &PNGParser{}
	case FormatWebP:
		return &WebPParser{}
	case FormatHEIF:
		return &HEIFParser{}
	default:
		return nil
	}
}

// ParseImage is a convenience function that detects format and parses EXIF data
func ParseImage(data []byte) (ExifData, error) {
	format := DetectFormat(data)
	parser := GetParser(format)

	if parser == nil {
		return nil, &UnsupportedFormatError{Format: format}
	}

	return parser.Parse(data)
}

// UnsupportedFormatError is returned when the image format is not supported
type UnsupportedFormatError struct {
	Format ImageFormat
}

func (e *UnsupportedFormatError) Error() string {
	return "unsupported image format"
}

// readerAt implements io.ReaderAt for byte slices
type readerAt struct {
	data []byte
}

func (r *readerAt) ReadAt(p []byte, off int64) (n int, err error) {
	if off < 0 || off >= int64(len(r.data)) {
		return 0, io.EOF
	}
	n = copy(p, r.data[off:])
	if n < len(p) {
		err = io.EOF
	}
	return
}

func newReaderAt(data []byte) io.ReaderAt {
	return &readerAt{data: data}
}
