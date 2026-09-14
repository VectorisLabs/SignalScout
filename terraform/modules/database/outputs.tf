output "market_themes_table_name" {
  description = "Display table identifier used by AppSync and compute workers"
  value       = aws_dynamodb_table.market_themes.name
}

output "market_themes_table_arn" {
  description = "Display table Amazon Resource Name used for scoped IAM execution policies"
  value       = aws_dynamodb_table.market_themes.arn
}

output "pipeline_state_table_name" {
  description = "Operational state table identifier used by webhook handler for retry tracking"
  value       = aws_dynamodb_table.pipeline_state.name
}

output "pipeline_state_table_arn" {
  description = "Operational state table Amazon Resource Name used for scoped IAM execution policies"
  value       = aws_dynamodb_table.pipeline_state.arn
}

