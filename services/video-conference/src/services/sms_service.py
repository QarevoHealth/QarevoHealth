"""SMS via AWS SNS."""

import boto3
from botocore.exceptions import ClientError
from datetime import datetime, timezone

from src.config import config


def _classify_from_config_error(code: str | None, message: str | None) -> str | None:
    """Best-effort classification for sender/origination configuration issues."""
    msg = (message or "").lower()
    code_norm = (code or "").lower()
    patterns = [
        "origination",
        "senderid",
        "sender id",
        "pool",
        "sandbox",
        "not opted in",
        "no origination identities available",
        "phone has not been verified",
    ]
    if any(p in msg for p in patterns):
        return "SNS from-number/origination configuration issue detected"
    if code_norm in {"invalidparameter", "authorizationerror"} and (
        "sms" in msg or "sender" in msg or "origination" in msg
    ):
        return "Potential SNS sender/origination setup issue"
    return None


def get_sns_client():
    client_kwargs = {
        "service_name": "sns",
        "region_name": config.AWS_SNS_REGION,
    }
    if config.AWS_ACCESS_KEY_ID and config.AWS_SECRET_ACCESS_KEY:
        client_kwargs["aws_access_key_id"] = config.AWS_ACCESS_KEY_ID
        client_kwargs["aws_secret_access_key"] = config.AWS_SECRET_ACCESS_KEY
    print(
        f"[SMS][{datetime.now(timezone.utc).isoformat()}] creating SNS client "
        f"region={client_kwargs.get('region_name')} credentials={'explicit' if 'aws_access_key_id' in client_kwargs else 'default-chain'}"
    )
    return boto3.client(**client_kwargs)


def to_e164(country_code: str, phone_digits: str) -> str:
    cc = country_code.strip()
    if not cc.startswith("+"):
        cc = "+" + cc.lstrip("+")
    digits = "".join(c for c in phone_digits if c.isdigit())
    e164 = f"{cc}{digits}"
    print(
        f"[SMS][{datetime.now(timezone.utc).isoformat()}] to_e164 country_code={country_code!r} "
        f"raw_phone={phone_digits!r} normalized_to={e164!r}"
    )
    return e164


def send_sms(phone_e164: str, message: str) -> bool:
    print(
        f"[SMS][{datetime.now(timezone.utc).isoformat()}] send_sms start to={phone_e164!r} "
        f"region={config.AWS_SNS_REGION!r} msg_len={len(message)}"
    )
    if not config.AWS_ACCESS_KEY_ID or not config.AWS_SECRET_ACCESS_KEY:
        print(
            f"[SMS][{datetime.now(timezone.utc).isoformat()}] send_sms aborted: "
            "missing AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY"
        )
        return False
    try:
        client = get_sns_client()
        publish_kwargs = {
            "PhoneNumber": phone_e164,
            "Message": message,
        }
        print(
            f"[SMS][{datetime.now(timezone.utc).isoformat()}] publish request "
            f"to={publish_kwargs['PhoneNumber']!r} "
            f"from=AWS-origination-identity(auto/account-config)"
        )
        response = client.publish(**publish_kwargs)
        print(
            f"[SMS][{datetime.now(timezone.utc).isoformat()}] publish success "
            f"message_id={response.get('MessageId')} http_status={response.get('ResponseMetadata', {}).get('HTTPStatusCode')}"
        )
        return True
    except ClientError as exc:
        error = exc.response.get("Error", {}) if hasattr(exc, "response") else {}
        err_code = error.get("Code")
        err_msg = error.get("Message")
        print(
            f"[SMS][{datetime.now(timezone.utc).isoformat()}] publish ClientError "
            f"code={err_code} message={err_msg}"
        )
        classification = _classify_from_config_error(err_code, err_msg)
        if classification:
            print(
                f"[SMS][{datetime.now(timezone.utc).isoformat()}] {classification}. "
                "Check AWS SNS/End User Messaging SMS: origination identities, Sender ID, "
                "country registration, and sandbox verification."
            )
        return False
    except Exception as exc:
        print(
            f"[SMS][{datetime.now(timezone.utc).isoformat()}] publish unexpected error "
            f"type={type(exc).__name__} message={exc}"
        )
        return False
