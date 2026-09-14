module "storage" {
  source = "../../modules/storage"

  environment   = var.environment
  project_name  = var.project_name
  force_destroy = var.force_destroy
  tags          = var.tags
}

module "database" {
  source = "../../modules/database"

  environment  = var.environment
  project_name = var.project_name
  tags         = var.tags
}

module "security_iam" {
  source = "../../modules/security_iam"

  environment                = var.environment
  project_name               = var.project_name
  raw_market_news_bucket_arn = module.storage.bucket_arn
  market_themes_table_arn    = module.database.market_themes_table_arn
  pipeline_state_table_arn   = module.database.pipeline_state_table_arn
  tags                       = var.tags
}

module "api_gateway_compute" {
  source = "../../modules/api_gateway_compute"

  environment                  = var.environment
  project_name                 = var.project_name
  lambda_execution_role_arn    = module.security_iam.webhook_lambda_role_arn
  raw_market_news_bucket_id    = module.storage.bucket_id
  market_themes_table_name     = module.database.market_themes_table_name
  pipeline_state_table_name    = module.database.pipeline_state_table_name
  langfuse_webhook_secret_name = module.security_iam.langfuse_webhook_secret_name
  max_retry                    = var.max_retry
  tags                         = var.tags
}

module "observability" {
  source = "../../modules/observability"

  environment          = var.environment
  project_name         = var.project_name
  api_gateway_id       = module.api_gateway_compute.api_gateway_id
  lambda_function_name = module.api_gateway_compute.lambda_function_name
  alarm_sns_topic_arn  = var.alarm_sns_topic_arn
  tags                 = var.tags
}

