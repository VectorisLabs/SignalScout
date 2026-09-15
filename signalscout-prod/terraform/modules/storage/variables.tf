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

variable "bucket_name" {
  description = "Explicit S3 bucket name override when predictable domain naming is required"
  type        = string
  default     = null
}

variable "force_destroy" {
  description = "Enables deletion of non-empty bucket during automated teardown testing"
  type        = bool
  default     = false
}

variable "archive_access_days" {
  description = "Days of object inactivity before S3 Intelligent-Tiering moves objects to Archive Access tier"
  type        = number
  default     = 90
}

variable "deep_archive_access_days" {
  description = "Days of object inactivity before S3 Intelligent-Tiering moves objects to Deep Archive Access tier"
  type        = number
  default     = 180
}

variable "enable_intelligent_tiering" {
  description = "Controls whether to create S3 Intelligent-Tiering configuration, disabled in emulators lacking API support"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Custom resource tags merged with standard module telemetry tags"
  type        = map(string)
  default     = {}
}

