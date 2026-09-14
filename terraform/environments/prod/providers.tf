provider "aws" {
  region  = var.aws_region
  profile = var.use_floci ? null : var.aws_profile

  access_key = var.use_floci ? "test" : null
  secret_key = var.use_floci ? "test" : null

  s3_use_path_style           = var.use_floci ? true : false
  skip_credentials_validation = var.use_floci ? true : false
  skip_metadata_api_check     = var.use_floci ? true : false
  skip_requesting_account_id  = var.use_floci ? true : false

  dynamic "endpoints" {
    for_each = var.use_floci ? [1] : []
    content {
      apigateway     = var.floci_endpoint
      apigatewayv2   = var.floci_endpoint
      bedrock        = var.floci_endpoint
      bedrockagent   = var.floci_endpoint
      cloudtrail     = var.floci_endpoint
      cloudwatch     = var.floci_endpoint
      cloudwatchlogs = var.floci_endpoint
      dynamodb       = var.floci_endpoint
      iam            = var.floci_endpoint
      lambda         = var.floci_endpoint
      s3             = var.floci_endpoint
      secretsmanager = var.floci_endpoint
    }
  }

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
    }
  }
}

