"""Constants for token lockout and attempt tracking."""


class TokenType:
    """Token type for lockout/attempt scope."""

    EMAIL_VERIFICATION = "EMAIL_VERIFICATION"
    PASSWORD_RESET = "PASSWORD_RESET"


class AttemptType:
    """Type of failed attempt."""

    VERIFY_FAIL = "VERIFY_FAIL"
    RESET_FAIL = "RESET_FAIL"
