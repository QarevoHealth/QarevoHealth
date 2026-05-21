output "secret_arn" {
  description = "The unique Amazon Resource Name (ARN) of the created secret container"
  value       = aws_secretsmanager_secret.this.arn
}

output "secret_id" {
  description = "The logical ID tracking string of the secret container"
  value       = aws_secretsmanager_secret.this.id
}