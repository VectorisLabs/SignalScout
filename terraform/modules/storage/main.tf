resource "aws_s3_bucket" "raw_market_news" {
  bucket        = var.bucket_name != null ? var.bucket_name : "${local.name_prefix}-raw-market-news"
  force_destroy = var.force_destroy

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-raw-market-news"
    }
  )
}

resource "aws_s3_bucket_versioning" "raw_market_news" {
  bucket = aws_s3_bucket.raw_market_news.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "raw_market_news" {
  bucket = aws_s3_bucket.raw_market_news.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "raw_market_news" {
  bucket = aws_s3_bucket.raw_market_news.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_intelligent_tiering_configuration" "raw_market_news" {
  count  = var.enable_intelligent_tiering ? 1 : 0
  bucket = aws_s3_bucket.raw_market_news.id
  name   = "EntireBucket"
  status = "Enabled"

  tiering {
    access_tier = "ARCHIVE_ACCESS"
    days        = var.archive_access_days
  }

  tiering {
    access_tier = "DEEP_ARCHIVE_ACCESS"
    days        = var.deep_archive_access_days
  }
}

data "aws_iam_policy_document" "deny_insecure_transport" {
  statement {
    sid     = "DenyNonTLSRequests"
    effect  = "Deny"
    actions = ["s3:*"]

    resources = [
      aws_s3_bucket.raw_market_news.arn,
      "${aws_s3_bucket.raw_market_news.arn}/*",
    ]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "raw_market_news" {
  bucket = aws_s3_bucket.raw_market_news.id
  policy = data.aws_iam_policy_document.deny_insecure_transport.json

  depends_on = [
    aws_s3_bucket_public_access_block.raw_market_news,
  ]
}

