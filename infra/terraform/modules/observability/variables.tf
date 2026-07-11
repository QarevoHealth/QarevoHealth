variable "project" {
  type        = string
}

variable "env" {
  type        = string
}

variable "log_retention_days" {
  type        = number
  description = "Specifies the number of days you want to retain log events"
  default     = 90 # Sufficient for audit baselines
}