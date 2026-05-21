locals {
  name_prefix = "${var.project}-${var.env}"
}

# Centralized log stream group for the backend applications
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/qarevo/${var.env}/application-logs"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "${local.name_prefix}-log-group"
    Environment = var.env
    Purpose     = "Audit-Logging"
  }
}