locals {
  name_prefix = "${var.project}-${var.env}"
}

resource "aws_s3_bucket" "this" {
  bucket = "${local.name_prefix}-${var.bucket_purpose}"
  
  # Prevent accidental deletion of the bucket
  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name    = "${local.name_prefix}-${var.bucket_purpose}"
    Purpose = var.bucket_purpose
  }
}

# Enable versioning so we can recover deleted medical records/recordings
resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Ensure all data is encrypted at rest (AES256)
resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block all public access (Crucial for HealthTech compliance)
resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}