output "lambda_log_group_arn" {
  description = "CloudWatch log group ARN storing webhook handler execution logs"
  value       = aws_cloudwatch_log_group.lambda.arn
}

output "api_gateway_log_group_arn" {
  description = "CloudWatch log group ARN storing API Gateway access logs"
  value       = aws_cloudwatch_log_group.api_gateway.arn
}

output "api_5xx_alarm_arn" {
  description = "CloudWatch metric alarm ARN monitoring API Gateway 5XX server errors"
  value       = aws_cloudwatch_metric_alarm.api_5xx_errors.arn
}

output "lambda_error_alarm_arn" {
  description = "CloudWatch metric alarm ARN monitoring webhook Lambda function errors"
  value       = aws_cloudwatch_metric_alarm.lambda_errors.arn
}

output "cloudtrail_arn" {
  description = "Amazon Resource Name of the CloudTrail trail providing audit governance"
  value       = var.enable_cloudtrail ? aws_cloudtrail.main[0].arn : null
}

