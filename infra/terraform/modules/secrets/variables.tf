variable "project" {
  type        = string
  description = "Project name prefix from root configuration"
}

variable "env" {
  type        = string
  description = "Target deployment environment (dev/staging/prod)"
}

variable "secret_purpose" {
  type        = string
  description = "The specific application grouping for this secret vault (e.g., app-env-vars, core-db)"
}