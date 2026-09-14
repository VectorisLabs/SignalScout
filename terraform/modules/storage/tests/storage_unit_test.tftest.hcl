mock_provider "aws" {}

variables {
  environment = "prod"
}

run "verify_bucket_configuration" {
  command = plan

  assert {
    condition     = aws_s3_bucket.raw_market_news.tags["Name"] == "signalscout-prod-raw-market-news"
    error_message = "Bucket Name tag does not match standard naming convention"
  }

  assert {
    condition     = aws_s3_bucket.raw_market_news.tags["Environment"] == "prod"
    error_message = "Environment tag does not match configured environment variable"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.raw_market_news.block_public_acls == true
    error_message = "Public ACLs must be blocked"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.raw_market_news.block_public_policy == true
    error_message = "Public bucket policies must be blocked"
  }

  assert {
    condition     = one(aws_s3_bucket_server_side_encryption_configuration.raw_market_news.rule).apply_server_side_encryption_by_default[0].sse_algorithm == "AES256"
    error_message = "Bucket default server-side encryption algorithm must be AES256"
  }

  assert {
    condition     = aws_s3_bucket_intelligent_tiering_configuration.raw_market_news.status == "Enabled"
    error_message = "S3 Intelligent-Tiering configuration must be enabled"
  }
}

run "verify_custom_bucket_override" {
  command = plan

  variables {
    bucket_name = "custom-override-bucket-name"
  }

  assert {
    condition     = aws_s3_bucket.raw_market_news.bucket == "custom-override-bucket-name"
    error_message = "Custom bucket name override was not applied"
  }
}

