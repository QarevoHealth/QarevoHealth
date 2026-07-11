locals {
  name_prefix = "${var.project}-${var.env}"
}

# Provisions a secure Amazon Chime SDK Media Application workspace
resource "aws_chime_sdkvoice_sip_media_application" "this" {
  name     = "${local.name_prefix}-chime-engine"
  aws_region = "eu-central-1" # Kept in alignment with the staging footprint

  endpoints {
    # Points directly to the upcoming Chime orchestration Lambda function
    lambda_arn = "arn:aws:lambda:eu-central-1:123456789012:function:placeholder-chime-handler"
  }
}