"""Email service - AWS SES integration. Generic send, reusable from any API."""

import boto3
from botocore.exceptions import ClientError

from src.config import config


def get_ses_client():
    """Get AWS SES client."""
    client_kwargs = {
        "service_name": "ses",
        "region_name": config.AWS_SES_REGION,
    }
    if config.AWS_ACCESS_KEY_ID and config.AWS_SECRET_ACCESS_KEY:
        client_kwargs["aws_access_key_id"] = config.AWS_ACCESS_KEY_ID
        client_kwargs["aws_secret_access_key"] = config.AWS_SECRET_ACCESS_KEY
    return boto3.client(**client_kwargs)


def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str | None = None,
    from_email: str | None = None,
    reply_to: list[str] | None = None,
) -> bool:
    """
    Generic email send via AWS SES. Reusable from any API/use case.
    All content passed as params - no hardcoded values.

    Args:
        to_email: Recipient email
        subject: Email subject
        html_body: HTML body content
        text_body: Plain text body (optional)
        from_email: Sender (optional, default from config)
        reply_to: Reply-To addresses (optional)

    Returns:
        True on success, False on failure.
    """
    if not config.AWS_ACCESS_KEY_ID or not config.AWS_SECRET_ACCESS_KEY:
        return False
    try:
        client = get_ses_client()
        body = {"Html": {"Data": html_body, "Charset": "UTF-8"}}
        if text_body:
            body["Text"] = {"Data": text_body, "Charset": "UTF-8"}

        send_kwargs = {
            "Source": from_email or config.AWS_SES_FROM_EMAIL,
            "Destination": {"ToAddresses": [to_email]},
            "Message": {
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": body,
            },
        }
        if reply_to:
            send_kwargs["ReplyToAddresses"] = reply_to

        client.send_email(**send_kwargs)
        return True
    except ClientError:
       return False
