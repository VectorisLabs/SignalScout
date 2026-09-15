output "bucket_id" {
  description = "Target bucket identifier used by compute workers for object ingestion"
  value       = aws_s3_bucket.raw_market_news.bucket
}

output "bucket_arn" {
  description = "Target bucket Amazon Resource Name used for least-privilege IAM policy scoping"
  value       = aws_s3_bucket.raw_market_news.arn
}

output "bucket_domain_name" {
  description = "Target bucket regional domain name used for presigned URL generation"
  value       = aws_s3_bucket.raw_market_news.bucket_domain_name
}

