"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle, Info } from "phosphor-react";
import { MailProviderIcon } from "@/components/MailProviderIcon";
import {
    extractEmailVerificationLockout,
    retrySecondsFromPayload,
    type AuthLockoutDetail,
} from "@/lib/auth/email-verification-lockout";

const VERIFICATION_RESEND_COOLDOWN_SEC = 30;

type DoctorEmailVerificationProps = {
    email: string;
    /** e.g. API message after doctor register */
    registrationMessage?: string;
    /** Hide resend for this many seconds on first paint (after registration email was sent). */
    resendLockedSecondsOnMount?: number;
    onEmailVerified: () => void;
};

function formatCountdown(seconds: number) {
    const safe = Math.max(0, seconds);
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    return {
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(secs).padStart(2, "0"),
    };
}

export function DoctorEmailVerification({
    email,
    registrationMessage,
    resendLockedSecondsOnMount = 0,
    onEmailVerified,
}: DoctorEmailVerificationProps) {
    const [codeDigits, setCodeDigits] = useState<string[]>(Array(6).fill(""));
    const [isVerifying, setIsVerifying] = useState(false);
    const [lastAttemptCode, setLastAttemptCode] = useState("");
    const [error, setError] = useState("");
    const [initialResendGateSeconds, setInitialResendGateSeconds] = useState(
        () => Math.max(0, resendLockedSecondsOnMount)
    );
    const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const [showResendSuccess, setShowResendSuccess] = useState(false);
    const [lockedDetail, setLockedDetail] = useState<AuthLockoutDetail | null>(null);
    const [lockedRetrySeconds, setLockedRetrySeconds] = useState(0);
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    useEffect(() => {
        if (initialResendGateSeconds <= 0) return;
        const t = setInterval(() => {
            setInitialResendGateSeconds((p) => (p > 0 ? p - 1 : 0));
        }, 1000);
        return () => clearInterval(t);
    }, [initialResendGateSeconds]);

    useEffect(() => {
        if (!lockedDetail || lockedRetrySeconds <= 0) return;
        const t = setInterval(() => {
            setLockedRetrySeconds((p) => (p > 0 ? p - 1 : 0));
        }, 1000);
        return () => clearInterval(t);
    }, [lockedDetail, lockedRetrySeconds]);

    useEffect(() => {
        if (resendCooldownSeconds <= 0) return;
        const t = setInterval(() => {
            setResendCooldownSeconds((p) => (p > 0 ? p - 1 : 0));
        }, 1000);
        return () => clearInterval(t);
    }, [resendCooldownSeconds]);

    useEffect(() => {
        if (resendCooldownSeconds > 0) return;
        setShowResendSuccess(false);
    }, [resendCooldownSeconds]);

    function updateDigitAtIndex(index: number, rawValue: string) {
        const value = rawValue.replace(/\s/g, "");
        setCodeDigits((prev) => {
            const next = [...prev];
            next[index] = value.slice(0, 1);
            return next;
        });
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    }

    function onKeyDown(index: number, key: string) {
        if (key === "Backspace" && !codeDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }

    function onPaste(raw: string) {
        const normalized = raw.replace(/\s/g, "").slice(0, 6);
        if (!normalized) return;
        setCodeDigits((prev) => {
            const next = [...prev];
            for (let i = 0; i < 6; i += 1) next[i] = normalized[i] ?? "";
            return next;
        });
        const last = Math.max(0, Math.min(5, normalized.length - 1));
        inputRefs.current[last]?.focus();
    }

    async function verifyCode(codeValue?: string) {
        const code = (codeValue ?? codeDigits.join("")).replace(/\s/g, "");
        if (!email) {
            setError("Missing email for verification.");
            return;
        }
        if (code.length !== 6) {
            setError("Please enter the 6-digit code from your email.");
            return;
        }

        setIsVerifying(true);
        setLastAttemptCode(code);
        setError("");

        try {
            const res = await fetch("/api/v1/auth/verify-email-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            });

            const text = await res.text();
            let data: Record<string, unknown>;
            try {
                data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
            } catch {
                throw new Error("Email verification failed.");
            }

            const lockout = extractEmailVerificationLockout(data);
            if (lockout && (res.status === 429 || res.status === 403)) {
                setLockedDetail(lockout);
                setLockedRetrySeconds(Math.max(0, lockout.retry_after_seconds ?? 0));
                return;
            }

            if (res.status === 429) {
                const nested =
                    data.detail && typeof data.detail === "object" && !Array.isArray(data.detail)
                        ? (data.detail as Record<string, unknown>)
                        : null;
                const flat = nested ?? data;
                const retry = retrySecondsFromPayload(flat);
                setLockedDetail({
                    error_code: "EMAIL_VERIFICATION_LOCKED",
                    message: typeof flat.message === "string" ? flat.message : undefined,
                    locked_until: typeof flat.locked_until === "string" ? flat.locked_until : undefined,
                    retry_after_seconds: retry,
                    lock_duration_seconds:
                        typeof flat.lock_duration_seconds === "number" ? flat.lock_duration_seconds : undefined,
                    attempts_limit: typeof flat.attempts_limit === "number" ? flat.attempts_limit : undefined,
                });
                setLockedRetrySeconds(retry);
                return;
            }

            if (res.status === 403) {
                const detail403 =
                    data.detail && typeof data.detail === "object" && !Array.isArray(data.detail)
                        ? (data.detail as Record<string, unknown>)
                        : null;
                setError(
                    (typeof detail403?.message === "string" ? detail403.message : undefined) ??
                        (typeof data.message === "string" ? data.message : undefined) ??
                        (typeof data.error === "string" ? data.error : undefined) ??
                        "Verify your email before continuing."
                );
                return;
            }

            if (!res.ok) {
                const detail = data.detail;
                const detailText = Array.isArray(detail)
                    ? detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(", ")
                    : typeof detail === "string"
                      ? detail
                      : "";
                throw new Error(
                    (typeof data.error === "string" ? data.error : undefined) ||
                        detailText ||
                        "Email verification failed"
                );
            }

            onEmailVerified();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Email verification failed");
        } finally {
            setIsVerifying(false);
        }
    }

    useEffect(() => {
        if (isVerifying) return;
        const code = codeDigits.join("").replace(/\s/g, "");
        if (code.length !== 6) return;
        if (code === lastAttemptCode) return;
        void verifyCode(code);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- submit when 6 digits change; verifyCode is stable enough for this flow
    }, [codeDigits, isVerifying, lastAttemptCode]);

    async function resend() {
        if (!email || initialResendGateSeconds > 0 || resendCooldownSeconds > 0 || isResending) return;
        setIsResending(true);
        setError("");
        setShowResendSuccess(false);

        try {
            const res = await fetch("/api/v1/auth/resend-verification-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const text = await res.text();
            let data: Record<string, unknown>;
            try {
                data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
            } catch {
                throw new Error("Failed to resend verification email.");
            }

            if (res.status === 429) {
                const lockout = extractEmailVerificationLockout(data);
                if (lockout) {
                    setLockedDetail(lockout);
                    setLockedRetrySeconds(Math.max(0, lockout.retry_after_seconds ?? 0));
                    return;
                }
                const nested =
                    data.detail && typeof data.detail === "object" && !Array.isArray(data.detail)
                        ? (data.detail as Record<string, unknown>)
                        : null;
                const flat = nested ?? data;
                const retry = retrySecondsFromPayload(flat);
                setLockedDetail({
                    error_code: "EMAIL_VERIFICATION_LOCKED",
                    message: typeof flat.message === "string" ? flat.message : undefined,
                    locked_until: typeof flat.locked_until === "string" ? flat.locked_until : undefined,
                    retry_after_seconds: retry,
                });
                setLockedRetrySeconds(retry);
                return;
            }

            if (!res.ok) {
                const detail = data.detail;
                const detailText = Array.isArray(detail)
                    ? detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(", ")
                    : typeof detail === "string"
                      ? detail
                      : "";
                throw new Error(
                    (typeof data.error === "string" ? data.error : undefined) ||
                        detailText ||
                        "Failed to resend verification email"
                );
            }

            setLockedDetail(null);
            setLockedRetrySeconds(0);
            setShowResendSuccess(true);
            setResendCooldownSeconds(VERIFICATION_RESEND_COOLDOWN_SEC);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to resend verification email");
        } finally {
            setIsResending(false);
        }
    }

    if (lockedDetail) {
        const countdown = formatCountdown(lockedRetrySeconds);
        return (
            <div className="rounded-2xl border border-q-azure-200 bg-white p-8 shadow-[0_2px_12px_rgba(20,52,93,0.06)]">
                <h2 className="text-[30px] font-bold leading-tight text-q-heading">Too many attempts</h2>
                <div className="mt-4 flex gap-3 rounded-lg bg-q-danger-bg px-4 py-3 text-sm leading-snug text-q-danger">
                    <Info size={22} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
                    <span>
                        {lockedDetail.message ??
                            "This email has been temporarily blocked due to multiple verification attempts. Please try again later."}
                    </span>
                </div>
                <p className="mt-8 text-left text-base font-semibold text-q-heading sm:text-lg">
                    You can request a new code in
                </p>
                <div className="mt-4 flex items-start justify-start gap-1.5 sm:gap-2">
                    <div className="flex w-[3.75rem] flex-col items-center sm:w-16">
                        <div className="flex h-14 w-full items-center justify-center rounded-xl border-2 border-q-azure-200 bg-q-azure-50 px-2 sm:h-16">
                            <span className="text-2xl font-semibold tabular-nums leading-none text-q-heading sm:text-3xl">
                                {countdown.hours}
                            </span>
                        </div>
                        <p className="mt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-q-heading sm:text-xs">
                            HOURS
                        </p>
                    </div>
                    <span className="pt-3 text-2xl font-light text-q-azure-400 sm:pt-4 sm:text-3xl">:</span>
                    <div className="flex w-[3.75rem] flex-col items-center sm:w-16">
                        <div className="flex h-14 w-full items-center justify-center rounded-xl border-2 border-q-azure-200 bg-q-azure-50 px-2 sm:h-16">
                            <span className="text-2xl font-semibold tabular-nums leading-none text-q-heading sm:text-3xl">
                                {countdown.minutes}
                            </span>
                        </div>
                        <p className="mt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-q-heading sm:text-xs">
                            MINUTES
                        </p>
                    </div>
                    <span className="pt-3 text-2xl font-light text-q-azure-400 sm:pt-4 sm:text-3xl">:</span>
                    <div className="flex w-[3.75rem] flex-col items-center sm:w-16">
                        <div className="flex h-14 w-full items-center justify-center rounded-xl border-2 border-q-azure-200 bg-q-azure-50 px-2 sm:h-16">
                            <span className="text-2xl font-semibold tabular-nums leading-none text-q-heading sm:text-3xl">
                                {countdown.seconds}
                            </span>
                        </div>
                        <p className="mt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-q-heading sm:text-xs">
                            SECONDS
                        </p>
                    </div>
                </div>
                <Link
                    href="/doctor/login"
                    className="mt-8 inline-block text-sm font-semibold text-q-link hover:underline"
                >
                    Back to doctor log in
                </Link>
            </div>
        );
    }

    const digitInputCls =
        "h-12 w-12 rounded-lg border-2 border-q-azure-200 bg-q-azure-50 text-center text-lg font-semibold text-q-heading outline-none transition-[border-color,background-color,box-shadow] [color-scheme:light] placeholder:text-q-muted-text/35 focus:border-q-accent focus:bg-white focus:ring-2 focus:ring-q-accent/20";

    return (
        <div className="overflow-visible rounded-2xl border border-q-azure-200 bg-white p-6 shadow-[0_2px_12px_rgba(20,52,93,0.06)] sm:p-8 lg:p-10">
            <h2 className="text-[28px] font-bold leading-tight text-q-heading sm:text-[30px]">We emailed you a code</h2>
           
            <p className="mt-4 text-base leading-relaxed text-q-muted-text">
                We sent an email to <span className="font-semibold text-q-heading">{email}</span>. Enter the code or tap
                the button in the email to continue.
            </p>

            <p className="mt-6 text-sm font-semibold text-q-label">Confirmation code</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-0.5 sm:justify-start">
                {codeDigits.slice(0, 3).map((char, idx) => (
                    <input
                        key={idx}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        aria-label={`Verification code digit ${idx + 1}`}
                        ref={(el) => {
                            inputRefs.current[idx] = el;
                        }}
                        className={digitInputCls}
                        value={char}
                        maxLength={1}
                        onKeyDown={(e) => onKeyDown(idx, e.key)}
                        onPaste={(e) => {
                            e.preventDefault();
                            onPaste(e.clipboardData.getData("text"));
                        }}
                        onChange={(e) => updateDigitAtIndex(idx, e.target.value)}
                    />
                ))}
                <span className="px-1 text-q-muted-text">-</span>
                {codeDigits.slice(3, 6).map((char, idx) => (
                    <input
                        key={idx + 3}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        aria-label={`Verification code digit ${idx + 4}`}
                        ref={(el) => {
                            inputRefs.current[idx + 3] = el;
                        }}
                        className={digitInputCls}
                        value={char}
                        maxLength={1}
                        onKeyDown={(e) => onKeyDown(idx + 3, e.key)}
                        onPaste={(e) => {
                            e.preventDefault();
                            onPaste(e.clipboardData.getData("text"));
                        }}
                        onChange={(e) => updateDigitAtIndex(idx + 3, e.target.value)}
                    />
                ))}
            </div>

            <p className="mt-4 text-sm text-q-muted-text">
                If you don&apos;t see the email, check your spam or junk folder.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
                <a
                    href="https://mail.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-q-azure-200 bg-white px-3 py-2.5 text-center text-xs font-semibold text-q-heading shadow-sm transition-colors hover:bg-q-azure-50 sm:text-sm"
                >
                    <MailProviderIcon provider="gmail" />
                    Open Gmail
                </a>
                <a
                    href="https://outlook.live.com/mail/0/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-q-azure-200 bg-white px-3 py-2.5 text-center text-xs font-semibold text-q-heading shadow-sm transition-colors hover:bg-q-azure-50 sm:text-sm"
                >
                    <MailProviderIcon provider="outlook" />
                    Open Outlook
                </a>
            </div>

            <div className="mt-6 min-h-[48px]">
                {initialResendGateSeconds > 0 ? (
                    <div
                        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-emerald-200 bg-white px-4 py-3.5 text-sm font-semibold text-emerald-800 shadow-[0_6px_20px_rgba(5,150,105,0.15)]"
                        role="status"
                    >
                        <CheckCircle size={22} weight="fill" className="shrink-0 text-emerald-600" aria-hidden />
                        <span>Verification email sent</span>
                    </div>
                ) : showResendSuccess && resendCooldownSeconds > 0 ? (
                    <div
                        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-emerald-200 bg-white px-4 py-3.5 text-sm font-semibold text-emerald-800 shadow-[0_6px_20px_rgba(5,150,105,0.15)]"
                        role="status"
                    >
                        <CheckCircle size={22} weight="fill" className="shrink-0 text-emerald-600" aria-hidden />
                        <span>Verification code sent</span>
                    </div>
                ) : (
                    <button
                        type="button"
                        disabled={isResending}
                        onClick={() => void resend()}
                        className="w-full py-2 text-sm font-semibold text-q-link transition-opacity hover:underline disabled:cursor-wait disabled:opacity-55"
                    >
                        Resend code
                    </button>
                )}
            </div>

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </div>
    );
}
