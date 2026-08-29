package storage

import (
	"context"
	"os"
	"sync"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var (
	s3ClientMu sync.Mutex
	s3Client   *s3.Client
)

func NewS3Client() (*s3.Client, error) {
	s3ClientMu.Lock()
	defer s3ClientMu.Unlock()

	if s3Client != nil {
		return s3Client, nil
	}

	// log.Println("S3_BUCKET_NAME", os.Getenv("S3_BUCKET_NAME"))
	// log.Println("S3_REGION", os.Getenv("S3_REGION"))
	// log.Println("S3_ENDPOINT_URL", os.Getenv("S3_ENDPOINT_URL"))
	// log.Println("S3_ACCESS_KEY_ID", os.Getenv("S3_ACCESS_KEY_ID"))
	// log.Println("S3_SECRET_ACCESS_KEY", os.Getenv("S3_SECRET_ACCESS_KEY"))

	cfg, err := config.LoadDefaultConfig(
		context.Background(),
		config.WithRegion(os.Getenv("S3_REGION")),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(
				os.Getenv("S3_ACCESS_KEY_ID"),
				os.Getenv("S3_SECRET_ACCESS_KEY"),
				"",
			),
		),
	)
	if err != nil {
		return nil, err
	}
	endpoint := os.Getenv("S3_ENDPOINT_URL")

	s3Client = s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = &endpoint
		o.UsePathStyle = true
	})

	return s3Client, nil
}

func GetBucketName() string {
	return os.Getenv("S3_BUCKET_NAME")
}
