export type AuthLockoutDetail = {
    error_code: string;
    message?: string;
    locked_until?: string;
    retry_after_seconds?: number;
    lock_duration_seconds?: number;
    attempts_limit?: number;
};

export function extractEmailVerificationLockout(data: Record<string, unknown>): AuthLockoutDetail | null {
    if (!data || typeof data !== "object") return null;
    const detail = (data.detail && typeof data.detail === "object" && !Array.isArray(data.detail))
        ? (data.detail as Record<string, unknown>)
        : null;

    if (detail && (detail.error_code === "EMAIL_VERIFICATION_LOCKED" || detail.status === "EMAIL_VERIFICATION_LOCKED")) {
        return {
            error_code: "EMAIL_VERIFICATION_LOCKED",
            message: typeof detail.message === "string" ? detail.message : undefined,
            locked_until: typeof detail.locked_until === "string" ? detail.locked_until : undefined,
            retry_after_seconds: typeof detail.retry_after_seconds === "number" ? detail.retry_after_seconds : undefined,
            lock_duration_seconds: typeof detail.lock_duration_seconds === "number" ? detail.lock_duration_seconds : undefined,
            attempts_limit: typeof detail.attempts_limit === "number" ? detail.attempts_limit : undefined,
        };
    }

    if (data.error_code === "EMAIL_VERIFICATION_LOCKED" || data.status === "EMAIL_VERIFICATION_LOCKED") {
        return {
            error_code: "EMAIL_VERIFICATION_LOCKED",
            message: typeof data.message === "string" ? data.message : undefined,
            locked_until: typeof data.locked_until === "string" ? data.locked_until : undefined,
            retry_after_seconds: typeof data.retry_after_seconds === "number" ? data.retry_after_seconds : undefined,
            lock_duration_seconds: typeof data.lock_duration_seconds === "number" ? data.lock_duration_seconds : undefined,
            attempts_limit: typeof data.attempts_limit === "number" ? data.attempts_limit : undefined,
        };
    }

    return null;
}

export function retrySecondsFromPayload(data: Record<string, unknown>): number {
    if (!data || typeof data !== "object") return 0;
    if (typeof data.retry_after_seconds === "number") return data.retry_after_seconds;
    if (typeof data.locked_until === "string") {
        const end = new Date(data.locked_until).getTime();
        if (!Number.isNaN(end)) {
            return Math.max(0, Math.ceil((end - Date.now()) / 1000));
        }
    }
    return 0;
}
