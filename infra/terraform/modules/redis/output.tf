output "redis_primary_endpoint" {
  description = "The primary connection endpoint for the Redis replication group"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "redis_port" {
  description = "The operational port number the cluster is running on"
  value       = aws_elasticache_replication_group.redis.port
}

output "redis_security_group_id" {
  description = "The security group ID assigned to the cache cluster"
  value       = aws_security_group.redis.id
}