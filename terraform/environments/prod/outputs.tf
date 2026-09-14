output "api_gateway_endpoint" {
  description = "Base HTTPS endpoint URL of the provisioned HTTP API Gateway"
  value       = module.api_gateway_compute.api_gateway_endpoint
}

output "webhook_url" {
  description = "Full URL endpoint for Langfuse webhook notifications"
  value       = module.api_gateway_compute.webhook_url
}

output "raw_market_news_bucket_id" {
  description = "Identifier of the S3 bucket storing raw collector market news attempts"
  value       = module.storage.bucket_id
}

output "raw_market_news_bucket_arn" {
  description = "Amazon Resource Name of the raw market news S3 bucket"
  value       = module.storage.bucket_arn
}

output "market_themes_table_name" {
  description = "DynamoDB table name storing processed display market themes"
  value       = module.database.market_themes_table_name
}

output "pipeline_state_table_name" {
  description = "DynamoDB table name tracking pipeline retry state and execution metrics"
  value       = module.database.pipeline_state_table_name
}

output "crawler_role_arn" {
  description = "IAM role ARN assumed by crawler worker with write-only S3 permissions"
  value       = module.security_iam.crawler_role_arn
}

output "management_role_arn" {
  description = "IAM role ARN assumed by management worker coordinating execution"
  value       = module.security_iam.management_role_arn
}

output "analysis_role_arn" {
  description = "IAM role ARN assumed by analysis worker with Guardrails enforcement"
  value       = module.security_iam.analysis_role_arn
}

output "webhook_lambda_role_arn" {
  description = "IAM role ARN assumed by webhook processing Lambda function"
  value       = module.security_iam.webhook_lambda_role_arn
}

output "guardrail_arn" {
  description = "Amazon Resource Name of the Bedrock prompt injection defense guardrail"
  value       = module.api_gateway_compute.guardrail_arn
}

output "cloudtrail_arn" {
  description = "Amazon Resource Name of the CloudTrail audit governance trail"
  value       = module.observability.cloudtrail_arn
}

