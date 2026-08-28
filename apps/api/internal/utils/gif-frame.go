package utils

import (
	"bytes"
	"image/gif"
	"image/png"
)

// FirstGifFrameAsPNG decodes the first frame of an animated (or static) gif
// and re-encodes it as PNG. Used before sending a gif attachment to a vision
// model: sending the raw animated gif would either confuse the model or
// burn far more tokens than a single representative frame needs to.
func FirstGifFrameAsPNG(data []byte) ([]byte, error) {
	img, err := gif.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}

	var out bytes.Buffer
	if err := png.Encode(&out, img); err != nil {
		return nil, err
	}
	return out.Bytes(), nil
}
