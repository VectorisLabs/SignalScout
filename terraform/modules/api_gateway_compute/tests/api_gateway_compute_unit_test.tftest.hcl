mock_provider "aws" {}

variables {
  environment                  = "prod"
  lambda_execution_role_arn    = "arn:aws:iam::123456789012:role/signalscout-prod-webhook-lambda-role"
  raw_market_news_bucket_id    = "signalscout-prod-raw-market-news"
  market_themes_table_name     = "signalscout-prod-MarketThemes"
  pipeline_state_table_name    = "signalscout-prod-PipelineState"
  langfuse_webhook_secret_name = "signalscout-prod-langfuse-webhook-secret"
  max_retry                    = 2
}

run "verify_api_and_compute_configuration" {
  command = plan

  assert {
    condition     = aws_apigatewayv2_api.main.name == "signalscout-prod-http-api"
    error_message = "API Gateway name does not match expected naming convention"
  }

  assert {
    condition     = aws_apigatewayv2_api.main.protocol_type == "HTTP"
    error_message = "API Gateway protocol type must be HTTP"
  }

  assert {
    condition     = aws_apigatewayv2_route.langfuse_webhook.route_key == "POST /webhooks/langfuse"
    error_message = "Webhook route key must be POST /webhooks/langfuse"
  }

  assert {
    condition     = aws_lambda_function.webhook_handler.function_name == "signalscout-prod-webhook-handler"
    error_message = "Lambda function name does not match expected convention"
  }

  assert {
    condition     = aws_bedrock_guardrail.analysis.name == "signalscout-prod-analysis-guardrail"
    error_message = "Bedrock Guardrail name does not match expected convention"
  }
}

