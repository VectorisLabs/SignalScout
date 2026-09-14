output "api_gateway_id" {
  description = "HTTP API Gateway identifier used for metric alarms and log configuration"
  value       = aws_apigatewayv2_api.main.id
}

output "api_gateway_endpoint" {
  description = "Base HTTPS endpoint URL of the provisioned HTTP API Gateway"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "webhook_url" {
  description = "Full URL endpoint for Langfuse webhook notifications"
  value       = "${aws_apigatewayv2_api.main.api_endpoint}/webhooks/langfuse"
}

output "lambda_function_name" {
  description = "Name of the webhook handler Lambda function"
  value       = aws_lambda_function.webhook_handler.function_name
}

output "lambda_function_arn" {
  description = "Amazon Resource Name of the webhook handler Lambda function"
  value       = aws_lambda_function.webhook_handler.arn
}

output "guardrail_id" {
  description = "Bedrock Guardrail identifier attached to analysis model runtime"
  value       = aws_bedrock_guardrail.analysis.guardrail_id
}

output "guardrail_arn" {
  description = "Amazon Resource Name of the Bedrock Guardrail"
  value       = aws_bedrock_guardrail.analysis.guardrail_arn
}

