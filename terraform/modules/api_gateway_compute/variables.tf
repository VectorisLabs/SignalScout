variable "environment" {
  description = "Target deployment tier used in naming prefixes and resource tagging"
  type        = string

  validation {
    condition     = contains(["prod", "uat", "staging", "dev"], var.environment)
    error_message = "Environment must be one of: prod, uat, staging, dev."
  }
}

variable "project_name" {
  description = "Application identifier used for standard naming conventions across cloud resources"
  type        = string
  default     = "signalscout"
}

variable "lambda_execution_role_arn" {
  description = "IAM role ARN assumed by the webhook handler Lambda function during execution"
  type        = string
}

variable "raw_market_news_bucket_id" {
  description = "Target S3 bucket name passed to Lambda environment for attempt storage"
  type        = string
}

variable "market_themes_table_name" {
  description = "DynamoDB table name for storing final display theme records"
  type        = string
}

variable "pipeline_state_table_name" {
  description = "DynamoDB table name for atomic retry count tracking and pipeline run status"
  type        = string
}

variable "langfuse_webhook_secret_name" {
  description = "Secrets Manager secret name retrieved by Lambda to verify HMAC signatures"
  type        = string
}

variable "max_retry" {
  description = "Maximum automated retry attempts permitted before flagging run for human review"
  type        = number
  default     = 2
}

variable "tags" {
  description = "Custom resource tags merged with standard module telemetry tags"
  type        = map(string)
  default     = {}
}

