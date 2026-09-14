mock_provider "aws" {}

variables {
  environment          = "prod"
  api_gateway_id       = "test-api-id"
  lambda_function_name = "signalscout-prod-webhook-handler"
}

run "verify_observability_configuration" {
  command = plan

  assert {
    condition     = aws_cloudwatch_log_group.lambda.name == "/aws/lambda/signalscout-prod-webhook-handler"
    error_message = "Lambda log group name does not match expected convention"
  }

  assert {
    condition     = aws_cloudwatch_log_group.lambda.retention_in_days == 30
    error_message = "Lambda log retention must be 30 days"
  }

  assert {
    condition     = aws_cloudwatch_log_group.api_gateway.name == "/aws/apigateway/test-api-id"
    error_message = "API Gateway log group name does not match expected convention"
  }

  assert {
    condition     = aws_cloudwatch_metric_alarm.api_5xx_errors.alarm_name == "signalscout-prod-apigw-5xx-errors"
    error_message = "API 5XX metric alarm name does not match expected convention"
  }

  assert {
    condition     = aws_cloudwatch_metric_alarm.lambda_errors.alarm_name == "signalscout-prod-lambda-webhook-errors"
    error_message = "Lambda error metric alarm name does not match expected convention"
  }

  assert {
    condition     = aws_cloudtrail.main.name == "signalscout-prod-audit-trail"
    error_message = "CloudTrail trail name does not match expected convention"
  }

  assert {
    condition     = aws_cloudtrail.main.enable_logging == true
    error_message = "CloudTrail logging must be enabled"
  }
}

