output "crawler_role_arn" {
  description = "IAM execution role ARN for crawler worker with write-only S3 access"
  value       = aws_iam_role.crawler.arn
}

output "crawler_role_name" {
  description = "IAM execution role name for crawler worker"
  value       = aws_iam_role.crawler.name
}

output "management_role_arn" {
  description = "IAM execution role ARN for supervisor worker coordinating pipeline"
  value       = aws_iam_role.management.arn
}

output "management_role_name" {
  description = "IAM execution role name for supervisor worker"
  value       = aws_iam_role.management.name
}

output "analysis_role_arn" {
  description = "IAM execution role ARN for analysis worker with Bedrock Guardrails enforcement"
  value       = aws_iam_role.analysis.arn
}

output "analysis_role_name" {
  description = "IAM execution role name for analysis worker"
  value       = aws_iam_role.analysis.name
}

output "webhook_lambda_role_arn" {
  description = "IAM execution role ARN for webhook handler Lambda function"
  value       = aws_iam_role.webhook_lambda.arn
}

output "webhook_lambda_role_name" {
  description = "IAM execution role name for webhook handler Lambda function"
  value       = aws_iam_role.webhook_lambda.name
}

output "langfuse_webhook_secret_arn" {
  description = "Secrets Manager secret ARN storing webhook signature verification token"
  value       = aws_secretsmanager_secret.langfuse_webhook.arn
}

output "langfuse_webhook_secret_name" {
  description = "Secrets Manager secret name storing webhook signature verification token"
  value       = aws_secretsmanager_secret.langfuse_webhook.name
}

