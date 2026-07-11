output "log_group_name" {
  description = "The name of the centralized CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.name
}