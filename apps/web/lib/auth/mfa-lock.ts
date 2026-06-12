export type MfaLockInfo = {
    error_code: string;
    message?: string;
    locked_until_iso?: string;
    lockedUntilIso?: string;
    retry_after_seconds?: number;
    retryAfterSeconds?: number;
    channel?: string;
};

export type MfaOtpResult =
    | { ok: true }
    | { ok: false; error?: string }
    | { ok: false; lock: MfaLockInfo };

export function parseMfaLockPayload(data: Record<string, unknown>): MfaLockInfo | null {
    if (!data || typeof data !== "object") return null;
    const detail = data.detail && typeof data.detail === "object" && !Array.isArray(data.detail)
        ? (data.detail as Record<string, unknown>)
        : null;
    const source = detail ?? data;
    const error_code = typeof source.error_code === "string"
        ? source.error_code
        : typeof source.status === "string"
            ? source.status
            : undefined;
    if (!error_code) return null;

    const message = typeof source.message === "string" ? source.message : undefined;
    const lockedUntilIso = typeof source.locked_until_iso === "string"
        ? source.locked_until_iso
        : typeof source.lockedUntilIso === "string"
            ? source.lockedUntilIso
            : typeof source.locked_until === "string"
                ? source.locked_until
                : undefined;
    const retryAfterSeconds = typeof source.retry_after_seconds === "number"
        ? source.retry_after_seconds
        : typeof source.retryAfterSeconds === "number"
            ? source.retryAfterSeconds
            : undefined;
    const channel = typeof source.channel === "string" ? source.channel : undefined;

    return {
        error_code,
        message,
        locked_until_iso: lockedUntilIso,
        lockedUntilIso,
        retry_after_seconds: retryAfterSeconds,
        retryAfterSeconds,
        channel,
    };
}

export function initialLockCountdownSeconds(lock: MfaLockInfo): number {
    const retry = lock.retry_after_seconds ?? lock.retryAfterSeconds;
    if (retry != null) {
        return Math.max(0, retry);
    }
    const iso = lock.lockedUntilIso ?? lock.locked_until_iso;
    if (iso) {
        const end = new Date(iso).getTime();
        if (!Number.isNaN(end)) {
            return Math.max(0, Math.ceil((end - Date.now()) / 1000));
        }
    }
    return 0;
}
