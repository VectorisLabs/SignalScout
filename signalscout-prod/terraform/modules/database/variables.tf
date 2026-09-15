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

variable "market_themes_table_name" {
  description = "Explicit table name override for market themes display storage"
  type        = string
  default     = null
}

variable "pipeline_state_table_name" {
  description = "Explicit table name override for pipeline operational state tracking"
  type        = string
  default     = null
}

variable "point_in_time_recovery" {
  description = "Controls continuous automated backups for disaster recovery and compliance"
  type        = bool
  default     = true
}

variable "kms_key_arn" {
  description = "Customer managed KMS key ARN for encryption at rest, defaulting to AWS managed key when null"
  type        = string
  default     = null
}

variable "tags" {
  description = "Custom resource tags merged with standard module telemetry tags"
  type        = map(string)
  default     = {}
}

