"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CheckCircle, X } from "phosphor-react";
import { type MfaLockInfo, type MfaOtpResult } from "@/lib/auth/mfa-lock";

const RESEND_COOLDOWN_MS = 30_000;

const digitInputCls =
    "h-12 w-12 rounded-lg border-2 border-q-azure-200 bg-q-azure-50 text-center text-lg font-semibold text-q-heading outline-none transition-[border-color,background-color,box-shadow] [color-scheme:light] placeholder:text-q-muted-text/35 focus:border-q-accent focus:bg-white focus:ring-2 focus:ring-q-accent/20";

type DoctorMfaOtpModalProps = {
    open: boolean;
    kind: "email" | "phone";
    maskedDestination: string;
    onClose: () => void;
    onVerify: (code: string) => Promise<MfaOtpResult>;
    onResend?: () => Promise<MfaOtpResult>;
    /** MFA channel locked (rate limit); parent shows full-page lock screen. */
    onLocked?: (lock: MfaLockInfo) => void;
};

export function DoctorMfaOtpModal({
    open,
    kind,
    maskedDestination,
    onClose,
    onVerify,
    onResend,
    onLocked,
}: DoctorMfaOtpModalProps) {
    const [codeDigits, setCodeDigits] = useState<string[]>(() => Array(6).fill(""));
    const [error, setError] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(false);
    const [resending, setResending] = useState(false);
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const verifyAttemptedForCodeRef = useRef<string>("");
    const resendCooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const verifyRef = useRef(onVerify);
    const closeRef = useRef(onClose);
    const onLockedRef = useRef(onLocked);

    useEffect(() => {
        verifyRef.current = onVerify;
        closeRef.current = onClose;
        onLockedRef.current = onLocked;
    }, [onVerify, onClose, onLocked]);

    useEffect(() => {
        if (!open) return;
        const id = window.setTimeout(() => {
            setCodeDigits(Array(6).fill(""));
            setError("");
            verifyAttemptedForCodeRef.current = "";
            setVerifying(false);
            setResendCooldown(false);
            setResending(false);
            if (resendCooldownTimerRef.current) {
                clearTimeout(resendCooldownTimerRef.current);
                resendCooldownTimerRef.current = null;
            }
        }, 0);
        return () => window.clearTimeout(id);
    }, [open, kind]);

    useEffect(() => {
        return () => {
            if (resendCooldownTimerRef.current) {
                clearTimeout(resendCooldownTimerRef.current);
                resendCooldownTimerRef.current = null;
            }
        };
    }, []);

    function updateDigitAtIndex(index: number, rawValue: string) {
        const value = rawValue.replace(/\s/g, "");
        setCodeDigits((prev) => {
            const next = [...prev];
            next[index] = value.slice(0, 1);
            return next;
        });
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
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
        inputRefs.current[Math.min(5, normalized.length - 1)]?.focus();
    }

    useEffect(() => {
        if (!open) return;
        const code = codeDigits.join("").replace(/\s/g, "");
        if (code.length !== 6) return;
        if (verifyAttemptedForCodeRef.current === code) return;

        verifyAttemptedForCodeRef.current = code;
        let cancelled = false;
        setVerifying(true);
        setError("");

        void (async () => {
            try {
                const result = await verifyRef.current(code);
                if (cancelled) return;
                if (result.ok) {
                    closeRef.current();
                } else if ("lock" in result && result.lock) {
                    verifyAttemptedForCodeRef.current = "";
                    onLockedRef.current?.(result.lock);
                    closeRef.current();
                } else {
                    verifyAttemptedForCodeRef.current = "";
                    setError(("error" in result && result.error) || "Invalid code. Try again.");
                    setCodeDigits(Array(6).fill(""));
                    inputRefs.current[0]?.focus();
                }
            } finally {
                if (!cancelled) setVerifying(false);
            }
        })();

        return () => {
            cancelled = true;
            verifyAttemptedForCodeRef.current = "";
        };
    }, [codeDigits, open]);

    async function handleResend() {
        if (!onResend || resendCooldown || resending) return;
        setResending(true);
        setError("");
        const r = await onResend();
        setResending(false);
        if (r.ok) {
            if (resendCooldownTimerRef.current) clearTimeout(resendCooldownTimerRef.current);
            setResendCooldown(true);
            resendCooldownTimerRef.current = setTimeout(() => {
                setResendCooldown(false);
                resendCooldownTimerRef.current = null;
            }, RESEND_COOLDOWN_MS);
        } else if ("lock" in r && r.lock) {
            onLockedRef.current?.(r.lock);
            closeRef.current();
        } else setError(("error" in r && r.error) || "Could not resend code.");
    }

    if (!open) return null;

    const title = kind === "email" ? "We emailed you a code" : "Phone number verification";
    const lead = `Enter the 6-digit verification code sent to ${maskedDestination}.`;
    const resendSentLabel =
        kind === "email" ? "Verification code sent." : "Verification code sent to your phone.";

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 border-0 bg-q-heading/35 backdrop-blur-[2px]"
                aria-label="Close"
                onClick={onClose}
            />
            <div className="relative z-[1] w-full max-w-[400px] overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_rgba(20,52,93,0.28)]">
                <div className="border-b border-q-azure-100 px-6 pb-4 pt-5">
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-1 text-q-muted-text hover:bg-q-azure-50 hover:text-q-heading"
                            aria-label="Close"
                        >
                            <X size={22} />
                        </button>
                    </div>
                    <h2 className="-mt-1 text-xl font-bold leading-snug text-q-heading sm:text-2xl">{title}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-q-muted-text">{lead}</p>
                </div>

                <div className="px-6 pb-6 pt-2">
                    <p className="text-sm font-semibold text-q-label">Confirmation code</p>
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-0.5 sm:justify-center">
                        {codeDigits.slice(0, 3).map((char, idx) => (
                            <input
                                key={`a-${idx}`}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                disabled={verifying}
                                aria-label={`Digit ${idx + 1}`}
                                ref={(el) => {
                                    inputRefs.current[idx] = el;
                                }}
                                className={digitInputCls}
                                value={char}
                                maxLength={1}
                                placeholder="·"
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
                                key={`b-${idx}`}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                disabled={verifying}
                                aria-label={`Digit ${idx + 4}`}
                                ref={(el) => {
                                    inputRefs.current[idx + 3] = el;
                                }}
                                className={digitInputCls}
                                value={char}
                                maxLength={1}
                                placeholder="·"
                                onKeyDown={(e) => onKeyDown(idx + 3, e.key)}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    onPaste(e.clipboardData.getData("text"));
                                }}
                                onChange={(e) => updateDigitAtIndex(idx + 3, e.target.value)}
                            />
                        ))}
                    </div>

                    {kind === "email" ? (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <a
                                href="https://mail.google.com"
                                target="_blank"
                                rel="noreferrer"
                                className="block w-full rounded-lg border border-q-azure-200 bg-white px-3 py-2 text-center text-xs font-semibold text-q-heading hover:bg-q-azure-50 sm:text-sm"
                            >
                                Open Gmail
                            </a>
                            <a
                                href="https://outlook.live.com/mail/0/"
                                target="_blank"
                                rel="noreferrer"
                                className="block w-full rounded-lg border border-q-azure-200 bg-white px-3 py-2 text-center text-xs font-semibold text-q-heading hover:bg-q-azure-50 sm:text-sm"
                            >
                                Open Outlook
                            </a>
                        </div>
                    ) : null}

                    <div className="mt-5 min-h-[44px] text-center">
                        {onResend ? (
                            resendCooldown ? (
                                <div
                                    className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-emerald-200 bg-white px-4 py-3.5 text-sm font-semibold text-emerald-800 shadow-[0_6px_20px_rgba(5,150,105,0.12)]"
                                    role="status"
                                    aria-live="polite"
                                >
                                    <CheckCircle size={22} weight="fill" className="shrink-0 text-emerald-600" aria-hidden />
                                    <span>{resendSentLabel}</span>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    disabled={resending}
                                    onClick={() => void handleResend()}
                                    className="text-sm font-semibold text-q-link hover:underline disabled:cursor-wait disabled:opacity-60"
                                >
                                    {resending ? "Sending…" : "Resend code"}
                                </button>
                            )
                        ) : null}
                    </div>

                    {error ? <p className="mt-3 text-center text-sm text-q-danger">{error}</p> : null}
                    {verifying ? (
                        <p className="mt-2 text-center text-xs text-q-muted-text" role="status">
                            Verifying…
                        </p>
                    ) : null}
                </div>

                <div className="flex items-center justify-center gap-2 border-t border-q-azure-100 px-6 py-4">
                    <Image src="/logo-symbol.png" alt="" width={22} height={22} />
                    <span className="text-lg font-semibold text-q-heading">Qarevo Health</span>
                </div>
            </div>
        </div>
    );
}
