package utils

import (
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"

	"github.com/buckket/go-blurhash"
	_ "golang.org/x/image/webp"
)

func GetImageMetadata(img image.Image) (width, height int, hash string, err error) {

	width, height = img.Bounds().Min.X+img.Bounds().Max.X, img.Bounds().Min.Y+img.Bounds().Max.Y

	hash, err = blurhash.Encode(4, 3, img)
	if err != nil {
		return width, height, "", err
	}

	return width, height, hash, nil
}
