resource "aws_dynamodb_table" "market_themes" {
  name         = var.market_themes_table_name != null ? var.market_themes_table_name : "${local.name_prefix}-MarketThemes"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "theme_id"

  attribute {
    name = "theme_id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.point_in_time_recovery
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-MarketThemes"
    }
  )
}

resource "aws_dynamodb_table" "pipeline_state" {
  name         = var.pipeline_state_table_name != null ? var.pipeline_state_table_name : "${local.name_prefix}-PipelineState"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "run_id"

  attribute {
    name = "run_id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.point_in_time_recovery
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-PipelineState"
    }
  )
}

