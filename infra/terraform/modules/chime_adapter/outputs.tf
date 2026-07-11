output "chime_app_id" {
  description = "The unique application identifier for the video/voice adapter engine"
  value       = aws_chime_sdkvoice_sip_media_application.this.id
}