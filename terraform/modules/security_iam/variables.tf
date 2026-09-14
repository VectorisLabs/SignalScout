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

variable "raw_market_news_bucket_arn" {
  description = "S3 bucket Amazon Resource Name for scoping object-level permissions"
  type        = string
}

variable "market_themes_table_arn" {
  description = "MarketThemes DynamoDB table Amazon Resource Name for scoping write permissions"
  type        = string
}

variable "pipeline_state_table_arn" {
  description = "PipelineState DynamoDB table Amazon Resource Name for scoping atomic counter updates"
  type        = string
}

variable "tags" {
  description = "Custom resource tags merged with standard module telemetry tags"
  type        = map(string)
  default     = {}
}

