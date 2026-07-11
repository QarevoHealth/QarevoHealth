output "db_instance_id" {
  description = "The RDS instance identifier"
  value       = aws_db_instance.postgres.id
}

output "db_endpoint" {
  description = "The connection endpoint (address:port) for the PostgreSQL database"
  value       = aws_db_instance.postgres.endpoint
}

output "db_address" {
  description = "The hostname of the RDS instance"
  value       = aws_db_instance.postgres.address
}

output "db_port" {
  description = "The port the database is listening on"
  value       = aws_db_instance.postgres.port
}

output "db_name" {
  description = "The name of the default database created"
  value       = aws_db_instance.postgres.db_name
}

output "db_secret_arn" {
  description = "The ARN of the Secrets Manager secret containing the auto-generated master DB credentials"
  value       = aws_db_instance.postgres.master_user_secret[0].secret_arn
}

output "db_security_group_id" {
  description = "The ID of the Security Group attached to the PostgreSQL instance"
  value       = aws_security_group.postgres.id
}