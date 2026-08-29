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

// SaveBytesToTempFile is the []byte counterpart of SaveToTempFile, for
// callers that already hold the file in memory (e.g. after downloading it
// from S3) instead of a multipart.File. Same cleanup contract: on success
// the caller owns removing the returned path.
func SaveBytesToTempFile(data []byte) (string, error) {
	tmp, err := os.CreateTemp("", "download-*")
	if err != nil {
		return "", err
	}

	_, err = tmp.Write(data)
	if err != nil {
		tmp.Close()
		os.Remove(tmp.Name())
		return "", err
	}

	tmp.Close()
	return tmp.Name(), nil
}

// SaveReaderToTempFile streams reader contents to a temporary file without
// materializing the whole object in memory.
func SaveReaderToTempFile(reader io.Reader) (string, error) {
	tmp, err := os.CreateTemp("", "download-*")
	if err != nil {
		return "", err
	}

	if _, err := io.Copy(tmp, reader); err != nil {
		tmp.Close()
		os.Remove(tmp.Name())
		return "", err
	}
	if err := tmp.Close(); err != nil {
		os.Remove(tmp.Name())
		return "", err
	}
	return tmp.Name(), nil
}
