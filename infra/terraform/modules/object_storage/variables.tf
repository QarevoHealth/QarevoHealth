variable "project" {
  description = "The name of the project (e.g., qarevo)"
  type        = string
}

variable "env" {
  description = "The environment (e.g., dev, staging, prod)"
  type        = string
}

variable "bucket_purpose" {
  description = "The specific use for this bucket (e.g., medical-records, recordings)"
  type        = string
}