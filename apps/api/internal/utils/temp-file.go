package utils

import (
	"io"
	"mime/multipart"
	"os"
)

func SaveToTempFile(file multipart.File) (string, error) {
	tmp, err := os.CreateTemp("", "upload-*")
	if err != nil {
		return "", err
	}

	_, err = io.Copy(tmp, file)
	if err != nil {
		tmp.Close()
		os.Remove(tmp.Name())
		return "", err
	}

	tmp.Close()
	return tmp.Name(), nil
}
