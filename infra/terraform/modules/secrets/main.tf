locals {
  name_prefix = "${var.project}-${var.env}"
}

# 1. Create the logical container vault inside AWS Secrets Manager
resource "aws_secretsmanager_secret" "this" {
  name        = "${local.name_prefix}-${var.secret_purpose}"
  description = "Managed credential storage for QarevoHealth ${var.env} - ${var.secret_purpose}"

  # Forces secret destruction protection window (7 to 30 days) if accidentally targeted for removal
  recovery_window_in_days = var.env == "prod" ? 30 : 7

  tags = {
    Name        = "${local.name_prefix}-${var.secret_purpose}"
    Environment = var.env
    SecurityClass = "Restricted-Credentials"
  }
}

# 2. Establish a default placeholder structure inside the vault
# This prevents application bootstrap failures while waiting for manual populating
resource "aws_secretsmanager_secret_version" "placeholder" {
  secret_id     = aws_secretsmanager_secret.this.id
  secret_string = jsonencode({
    CREATED_BY = "Terraform-Infrastructure-Engine"
    INITIALIZED_AT = timestamp()
  })

  # Ignore future manual dashboard updates to this secret data so Terraform doesn't overwrite live keys on next runs
  lifecycle {
    ignore_changes = [
      secret_string,
    ]
  }
}