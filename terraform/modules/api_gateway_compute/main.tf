data "archive_file" "lambda_dummy" {
  type        = "zip"
  output_path = "${path.module}/lambda_dummy.zip"

  source {
    content  = "def handler(event, context):\n    return {'statusCode': 200, 'body': 'OK'}\n"
    filename = "index.py"
  }
}

resource "aws_lambda_function" "webhook_handler" {
  function_name    = "${local.name_prefix}-webhook-handler"
  description      = "Processes Langfuse evaluation webhooks and orchestrates retry or final persistence"
  filename         = data.archive_file.lambda_dummy.output_path
  source_code_hash = data.archive_file.lambda_dummy.output_base64sha256
  role             = var.lambda_execution_role_arn
  handler          = "index.handler"
  runtime          = "python3.12"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      MARKET_THEMES_TABLE   = var.market_themes_table_name
      PIPELINE_STATE_TABLE  = var.pipeline_state_table_name
      RAW_MARKET_NEWS_BUCKET = var.raw_market_news_bucket_id
      LANGFUSE_SECRET_NAME  = var.langfuse_webhook_secret_name
      MAX_RETRY             = tostring(var.max_retry)
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-webhook-handler"
    }
  )
}

resource "aws_apigatewayv2_api" "main" {
  name          = "${local.name_prefix}-http-api"
  protocol_type = "HTTP"
  description   = "HTTP API Gateway for Langfuse webhook ingestion"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-http-api"
    }
  )
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-default-stage"
    }
  )
}

resource "aws_apigatewayv2_integration" "langfuse_webhook" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.webhook_handler.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "langfuse_webhook" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "POST /webhooks/langfuse"
  target             = "integrations/${aws_apigatewayv2_integration.langfuse_webhook.id}"
  authorization_type = "NONE"
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.webhook_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_bedrock_guardrail" "analysis" {
  name                      = "${local.name_prefix}-analysis-guardrail"
  description               = "Bedrock guardrail protecting analysis worker reasoning from prompt injection"
  blocked_input_messaging   = "Request blocked by SignalScout prompt injection security policy"
  blocked_outputs_messaging = "Response blocked by SignalScout prompt injection security policy"

  content_policy_config {
    filters_config {
      input_strength  = "HIGH"
      output_strength = "NONE"
      type            = "PROMPT_ATTACK"
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-analysis-guardrail"
    }
  )
}

