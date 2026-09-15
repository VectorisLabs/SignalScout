resource "aws_secretsmanager_secret" "langfuse_webhook" {
  name        = "${local.name_prefix}-langfuse-webhook-secret"
  description = "Secret used to verify Langfuse incoming webhook signatures"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-langfuse-webhook-secret"
    }
  )
}

resource "aws_iam_role" "crawler" {
  name        = "${local.name_prefix}-crawler-role"
  description = "Execution role for crawler worker with write-only S3 permissions"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "bedrock.amazonaws.com",
            "lambda.amazonaws.com",
          ]
        }
      },
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-crawler-role"
    }
  )
}

resource "aws_iam_role_policy" "crawler" {
  name = "${local.name_prefix}-crawler-policy"
  role = aws_iam_role.crawler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "WriteOnlyRawMarketNews"
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = ["${var.raw_market_news_bucket_arn}/*"]
      },
      {
        Sid    = "CloudWatchLogging"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = [
          "arn:aws:logs:*:*:log-group:/aws/bedrock/*",
          "arn:aws:logs:*:*:log-group:/aws/lambda/*",
        ]
      },
    ]
  })
}

resource "aws_iam_role" "management" {
  name        = "${local.name_prefix}-management-role"
  description = "Execution role for supervisor worker coordinating pipeline stages"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "bedrock.amazonaws.com",
            "lambda.amazonaws.com",
          ]
        }
      },
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-management-role"
    }
  )
}

resource "aws_iam_role_policy" "management" {
  name = "${local.name_prefix}-management-policy"
  role = aws_iam_role.management.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ReadRawMarketNews"
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = ["${var.raw_market_news_bucket_arn}/*"]
      },
      {
        Sid    = "BedrockInvocation"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:ApplyGuardrail",
        ]
        Resource = ["*"]
      },
      {
        Sid    = "CloudWatchLogging"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = [
          "arn:aws:logs:*:*:log-group:/aws/bedrock/*",
          "arn:aws:logs:*:*:log-group:/aws/lambda/*",
        ]
      },
    ]
  })
}

resource "aws_iam_role" "analysis" {
  name        = "${local.name_prefix}-analysis-role"
  description = "Execution role for analysis worker reasoning with guardrails"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "bedrock.amazonaws.com",
            "lambda.amazonaws.com",
          ]
        }
      },
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-analysis-role"
    }
  )
}

resource "aws_iam_role_policy" "analysis" {
  name = "${local.name_prefix}-analysis-policy"
  role = aws_iam_role.analysis.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ReadRawMarketNews"
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = ["${var.raw_market_news_bucket_arn}/*"]
      },
      {
        Sid    = "BedrockInvocationWithGuardrails"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:ApplyGuardrail",
        ]
        Resource = ["*"]
      },
      {
        Sid    = "CloudWatchLogging"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = [
          "arn:aws:logs:*:*:log-group:/aws/bedrock/*",
          "arn:aws:logs:*:*:log-group:/aws/lambda/*",
        ]
      },
    ]
  })
}

resource "aws_iam_role" "webhook_lambda" {
  name        = "${local.name_prefix}-webhook-lambda-role"
  description = "Execution role for Langfuse webhook processing Lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
          ]
        }
      },
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-webhook-lambda-role"
    }
  )
}

resource "aws_iam_role_policy" "webhook_lambda" {
  name = "${local.name_prefix}-webhook-lambda-policy"
  role = aws_iam_role.webhook_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "WriteRawMarketNews"
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = ["${var.raw_market_news_bucket_arn}/*"]
      },
      {
        Sid    = "MarketThemesTableAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem",
        ]
        Resource = [var.market_themes_table_arn]
      },
      {
        Sid    = "PipelineStateAtomicCounterAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
        ]
        Resource = [var.pipeline_state_table_arn]
      },
      {
        Sid      = "SecretsManagerAccess"
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = [aws_secretsmanager_secret.langfuse_webhook.arn]
      },
      {
        Sid    = "CloudWatchLogging"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = ["arn:aws:logs:*:*:log-group:/aws/lambda/*"]
      },
    ]
  })
}

