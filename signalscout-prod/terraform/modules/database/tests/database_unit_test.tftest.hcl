mock_provider "aws" {}

variables {
  environment = "prod"
}

run "verify_database_configuration" {
  command = plan

  assert {
    condition     = aws_dynamodb_table.market_themes.tags["Name"] == "signalscout-prod-MarketThemes"
    error_message = "MarketThemes Name tag does not match standard naming convention"
  }

  assert {
    condition     = aws_dynamodb_table.pipeline_state.tags["Name"] == "signalscout-prod-PipelineState"
    error_message = "PipelineState Name tag does not match standard naming convention"
  }

  assert {
    condition     = aws_dynamodb_table.market_themes.billing_mode == "PAY_PER_REQUEST"
    error_message = "MarketThemes billing mode must be PAY_PER_REQUEST"
  }

  assert {
    condition     = aws_dynamodb_table.pipeline_state.billing_mode == "PAY_PER_REQUEST"
    error_message = "PipelineState billing mode must be PAY_PER_REQUEST"
  }

  assert {
    condition     = aws_dynamodb_table.market_themes.hash_key == "theme_id"
    error_message = "MarketThemes hash key must be theme_id"
  }

  assert {
    condition     = aws_dynamodb_table.pipeline_state.hash_key == "run_id"
    error_message = "PipelineState hash key must be run_id"
  }

  assert {
    condition     = aws_dynamodb_table.market_themes.point_in_time_recovery[0].enabled == true
    error_message = "Point-in-time recovery must be enabled on MarketThemes"
  }

  assert {
    condition     = aws_dynamodb_table.pipeline_state.point_in_time_recovery[0].enabled == true
    error_message = "Point-in-time recovery must be enabled on PipelineState"
  }
}

run "verify_custom_table_overrides" {
  command = plan

  variables {
    market_themes_table_name  = "custom-market-themes"
    pipeline_state_table_name = "custom-pipeline-state"
  }

  assert {
    condition     = aws_dynamodb_table.market_themes.name == "custom-market-themes"
    error_message = "Custom MarketThemes table name override was not applied"
  }

  assert {
    condition     = aws_dynamodb_table.pipeline_state.name == "custom-pipeline-state"
    error_message = "Custom PipelineState table name override was not applied"
  }
}

