variable "project" {
  type        = string
  description = "Project name prefix from root configuration"
}

variable "env" {
  type        = string
  description = "Target deployment environment (dev/staging/prod)"
}

variable "vpc_id" {
  type        = string
  description = "The target VPC ID from the network module"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs where the Redis replication group will live"
}

variable "node_type" {
  type        = string
  description = "The compute instance sizing for the Redis cache cluster"
  default     = "cache.t4g.micro" # Cost-effective AWS Graviton engine
}

variable "num_cache_clusters" {
  type        = number
  description = "Number of cache replica nodes (1 for dev/staging, 2+ for high-availability prod)"
  default     = 1
}