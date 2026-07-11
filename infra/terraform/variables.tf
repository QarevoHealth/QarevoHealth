variable "project_name" {
  description = "The name of the project"
  type        = string
  default     = "qarevo-health"
}

variable "aws_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "eu-central-1" # We will confirm this with Riya
}

variable "billing_code" {
  description = "Cost center for AWS tagging"
  type        = string
  default     = "qarevo-mvp-consolidation"
}