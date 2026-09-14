mock_provider "aws" {}

variables {
  environment  = "prod"
  project_name = "signalscout"
}

run "verify_production_infrastructure_orchestration" {
  command = plan

  assert {
    condition     = module.storage.bucket_id == "signalscout-prod-raw-market-news"
    error_message = "Storage bucket identifier does not match expected naming convention"
  }

  assert {
    condition     = module.database.market_themes_table_name == "signalscout-prod-MarketThemes"
    error_message = "MarketThemes table name does not match expected convention"
  }

  assert {
    condition     = module.database.pipeline_state_table_name == "signalscout-prod-PipelineState"
    error_message = "PipelineState table name does not match expected convention"
  }

  assert {
    condition     = module.security_iam.crawler_role_name == "signalscout-prod-crawler-role"
    error_message = "Crawler role name does not match expected convention"
  }

  assert {
    condition     = module.security_iam.management_role_name == "signalscout-prod-management-role"
    error_message = "Management role name does not match expected convention"
  }

  assert {
    condition     = module.security_iam.analysis_role_name == "signalscout-prod-analysis-role"
    error_message = "Analysis role name does not match expected convention"
  }

  assert {
    condition     = module.security_iam.webhook_lambda_role_name == "signalscout-prod-webhook-lambda-role"
    error_message = "Webhook Lambda role name does not match expected convention"
  }

  assert {
    condition     = module.api_gateway_compute.lambda_function_name == "signalscout-prod-webhook-handler"
    error_message = "Webhook Lambda function name does not match expected convention"
  }
}

