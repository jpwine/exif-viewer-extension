// +build js,wasm

package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"

	"exif-viewer-wasm/parser"
)

func main() {
	js.Global().Set("parseExif", js.FuncOf(parseExif))
	js.Global().Set("detectImageFormat", js.FuncOf(detectImageFormat))
	js.Global().Set("getSupportedFormats", js.FuncOf(getSupportedFormats))

	select {}
}

func parseExif(this js.Value, args []js.Value) interface{} {
	handler := js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
		resolve := promiseArgs[0]
		reject := promiseArgs[1]

		go func() {
			defer func() {
				if r := recover(); r != nil {
					reject.Invoke(js.ValueOf(fmt.Sprintf("panic: %v", r)))
				}
			}()

			if len(args) < 1 {
				reject.Invoke(js.ValueOf("missing image data argument"))
				return
			}

			jsArray := args[0]
			length := jsArray.Get("length").Int()
			data := make([]byte, length)
			js.CopyBytesToGo(data, jsArray)

			exifData, err := parser.ParseImage(data)
			if err != nil {
				reject.Invoke(js.ValueOf(err.Error()))
				return
			}

			jsonData, err := json.Marshal(exifData)
			if err != nil {
				reject.Invoke(js.ValueOf("failed to encode JSON: " + err.Error()))
				return
			}

			resolve.Invoke(js.ValueOf(string(jsonData)))
		}()

		return nil
	})

	return js.Global().Get("Promise").New(handler)
}

func detectImageFormat(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return js.ValueOf("unknown")
	}

	jsArray := args[0]
	length := jsArray.Get("length").Int()
	if length > 12 {
		length = 12
	}

	data := make([]byte, length)
	js.CopyBytesToGo(data, jsArray)
	format := parser.DetectFormat(data)

	switch format {
	case parser.FormatJPEG:
		return js.ValueOf("JPEG")
	case parser.FormatTIFF:
		return js.ValueOf("TIFF")
	case parser.FormatPNG:
		return js.ValueOf("PNG")
	case parser.FormatWebP:
		return js.ValueOf("WebP")
	case parser.FormatHEIF:
		return js.ValueOf("HEIF")
	default:
		return js.ValueOf("Unknown")
	}
}

func getSupportedFormats(this js.Value, args []js.Value) interface{} {
	formats := []string{"JPEG", "TIFF"}
	jsArray := js.Global().Get("Array").New(len(formats))
	for i, format := range formats {
		jsArray.SetIndex(i, js.ValueOf(format))
	}
	return jsArray
}
