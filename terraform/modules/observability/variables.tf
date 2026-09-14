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

variable "api_gateway_id" {
  description = "Target HTTP API Gateway identifier for metric monitoring and access logging"
  type        = string
}

variable "lambda_function_name" {
  description = "Target Lambda function name for error metric monitoring and log group binding"
  type        = string
}

variable "log_retention_days" {
  description = "Days to retain CloudWatch logs before automatic expiration"
  type        = number
  default     = 30
}

variable "alarm_sns_topic_arn" {
  description = "Optional SNS topic ARN for routing high-priority operational alarm notifications"
  type        = string
  default     = null
}

variable "tags" {
  description = "Custom resource tags merged with standard module telemetry tags"
  type        = map(string)
  default     = {}
}

