mock_provider "aws" {}

variables {
  environment                = "prod"
  raw_market_news_bucket_arn = "arn:aws:s3:::signalscout-prod-raw-market-news"
  market_themes_table_arn    = "arn:aws:dynamodb:ap-southeast-1:123456789012:table/signalscout-prod-MarketThemes"
  pipeline_state_table_arn   = "arn:aws:dynamodb:ap-southeast-1:123456789012:table/signalscout-prod-PipelineState"
}

run "verify_iam_roles_and_secrets" {
  command = plan

  assert {
    condition     = aws_iam_role.crawler.name == "signalscout-prod-crawler-role"
    error_message = "Crawler role name does not match expected naming convention"
  }

  assert {
    condition     = aws_iam_role.crawler.tags["Name"] == "signalscout-prod-crawler-role"
    error_message = "Crawler role Name tag does not match expected convention"
  }

  assert {
    condition     = aws_iam_role.management.name == "signalscout-prod-management-role"
    error_message = "Management role name does not match expected naming convention"
  }

  assert {
    condition     = aws_iam_role.analysis.name == "signalscout-prod-analysis-role"
    error_message = "Analysis role name does not match expected naming convention"
  }

  assert {
    condition     = aws_iam_role.webhook_lambda.name == "signalscout-prod-webhook-lambda-role"
    error_message = "Webhook Lambda role name does not match expected naming convention"
  }

  assert {
    condition     = aws_secretsmanager_secret.langfuse_webhook.name == "signalscout-prod-langfuse-webhook-secret"
    error_message = "Langfuse webhook secret name does not match expected convention"
  }
}

