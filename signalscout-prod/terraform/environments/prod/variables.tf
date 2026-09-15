variable "aws_region" {
  description = "Target AWS region for deploying all production regional resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "aws_profile" {
  description = "AWS CLI profile name matching target account authentication credentials"
  type        = string
  default     = "duykhiem"
}

variable "environment" {
  description = "Target deployment tier used in naming prefixes and resource tagging"
  type        = string
  default     = "prod"

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

variable "use_floci" {
  description = "Enables local Floci emulator routing instead of targeting live AWS cloud endpoints"
  type        = bool
  default     = false
}

variable "floci_endpoint" {
  description = "Local emulator endpoint URL servicing mocked AWS APIs"
  type        = string
  default     = "http://localhost:4566"
}

variable "alarm_sns_topic_arn" {
  description = "Target SNS topic ARN for routing high-priority operational alarm notifications"
  type        = string
  default     = null
}

variable "max_retry" {
  description = "Maximum automated retry attempts permitted before flagging run for human review"
  type        = number
  default     = 2
}

variable "force_destroy" {
  description = "Enables deletion of non-empty buckets during local automated testing cycles"
  type        = bool
  default     = false
}

variable "enable_intelligent_tiering" {
  description = "Controls whether to create S3 Intelligent-Tiering configuration, disabled in emulators lacking API support"
  type        = bool
  default     = true
}

variable "enable_guardrails" {
  description = "Controls whether to create Bedrock Guardrail, disabled in local emulators lacking API support"
  type        = bool
  default     = true
}

variable "enable_cloudtrail" {
  description = "Controls whether to create CloudTrail audit trail, disabled in local emulators lacking API support"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Custom resource tags merged with standard module telemetry tags"
  type        = map(string)
  default     = {}
}

