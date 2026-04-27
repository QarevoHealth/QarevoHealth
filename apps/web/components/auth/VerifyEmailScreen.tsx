"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { AuthCard } from "./AuthCard";
import { AuthHeader } from "./AuthHeader";
import { AuthHero } from "./AuthHero";
import { GmailMailIcon, OutlookMailIcon } from "./icons/BrandIcons";

const CODE_LEN = 6;
const INITIAL_RESEND_DELAY_SECONDS = 30;
const RESEND_COOLDOWN_SECONDS = 120;
const RESEND_SENT_MESSAGE_SECONDS = 30;

export function VerifyEmailScreen() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") ?? "";
    const role = searchParams.get("role") ?? "patient";

    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
    const [digits, setDigits] = useState<string[]>(() =>
        Array.from({ length: CODE_LEN }, () => "")
    );
    const [focusIdx, setFocusIdx] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [resendCooldownSeconds, setResendCooldownSeconds] = useState(
        INITIAL_RESEND_DELAY_SECONDS
    );
    const [showResendSent, setShowResendSent] = useState(false);

    useEffect(() => {
        if (resendCooldownSeconds <= 0) return;
        const timer = window.setInterval(() => {
            setResendCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [resendCooldownSeconds]);

    useEffect(() => {
        if (!showResendSent) return;
        const timer = window.setTimeout(() => {
            setShowResendSent(false);
        }, RESEND_SENT_MESSAGE_SECONDS * 1000);
        return () => window.clearTimeout(timer);
    }, [showResendSent]);

    const setDigit = (index: number, value: string) => {
        const v = value.replace(/\D/g, "").slice(-1);
        const next = [...digits];
        next[index] = v;
        setDigits(next);
        if (v && index < CODE_LEN - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const text = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, CODE_LEN);
        if (!text) return;
        e.preventDefault();
        const next = text.split("");
        while (next.length < CODE_LEN) next.push("");
        setDigits(next);
        const last = Math.min(text.length, CODE_LEN) - 1;
        if (last >= 0) inputsRef.current[last]?.focus();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const code = digits.join("");
        if (code.length !== CODE_LEN) {
            setError(`Enter the ${CODE_LEN}-digit code`);
            return;
        }
        if (isNavigating) return;
        setIsNavigating(true);
        router.push(
            `/complete-profile?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`
        );
    };

    useEffect(() => {
        if (digits.join("").length !== CODE_LEN) return;
        if (isNavigating) return;
        setError(null);
        setIsNavigating(true);
        router.push(
            `/complete-profile?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`
        );
    }, [digits, email, isNavigating, role, router]);

    const handleResend = () => {
        if (resendCooldownSeconds > 0) return;
        setError(null);
        setShowResendSent(true);
        setResendCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    };

    const displayEmail = email || "email@domain.com";
    const canResend = resendCooldownSeconds === 0;
    const mm = Math.floor(resendCooldownSeconds / 60)
        .toString()
        .padStart(1, "0");
    const ss = (resendCooldownSeconds % 60).toString().padStart(2, "0");

    const codeInputs = (
        <div
            className="flex flex-nowrap items-center gap-2"
            onPaste={handlePaste}
            role="group"
            aria-label="Confirmation code"
        >
            {digits.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                    <input
                        ref={(el) => {
                            inputsRef.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={d}
                        onChange={(e) => setDigit(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        onFocus={() => setFocusIdx(i)}
                        className={cn(
                            "box-border h-14 w-10 rounded-xl border-2 bg-surface-muted text-center text-lg font-semibold text-primary outline-none transition-[box-shadow,border-color] sm:h-16 sm:w-14 sm:text-xl",
                            focusIdx === i
                                ? "border-brand-ring ring-2 ring-brand-ring"
                                : "border-otp-border"
                        )}
                        aria-label={`Digit ${i + 1}`}
                    />
                    {i === 2 ? (
                        <span className="px-1 text-lg font-semibold text-muted-foreground" aria-hidden>
                            -
                        </span>
                    ) : null}
                </div>
            ))}
        </div>
    );

    const form = (
        <div className="flex w-full max-w-[430px] flex-col">
            <div className="flex flex-col gap-3">
                <h1 className="whitespace-nowrap text-[22px] font-extrabold leading-[1.05] tracking-[-0.02em] text-primary">
                    We emailed you a code
                </h1>
                <p className="text-sm font-medium leading-5 text-muted-foreground">
                    We sent an email to email@domain.com Enter
                    the code or tap the button in the email to continue.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                    <p className="text-sm font-semibold leading-5 text-primary">
                        Confirmation code
                    </p>
                    {codeInputs}
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <p className="text-sm font-medium leading-5 text-muted-foreground">
                    If you don&apos;t see the email, check your spam or junk
                    folder.
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        className="flex h-11 items-center justify-center gap-3 rounded-lg border border-secondary bg-white px-4 text-base font-semibold text-gray-700 shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] transition hover:bg-slate-50"
                    >
                        <GmailMailIcon size={28} />
                        Open Gmail
                    </button>
                    <button
                        type="button"
                        className="flex h-11 items-center justify-center gap-3 rounded-lg border border-secondary bg-white px-4 text-base font-semibold text-gray-700 shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] transition hover:bg-slate-50"
                    >
                        <OutlookMailIcon size={28} />
                        Open Outlook
                    </button>
                </div>

                <div className="flex items-center gap-2" aria-hidden>
                    <div className="h-px flex-1 bg-border-subtle" />
                    <div className="h-px flex-1 bg-border-subtle" />
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    {!canResend ? (
                        <p>A new code can be requested in {mm}:{ss}</p>
                    ) : null}
                </div>

                {showResendSent ? (
                    <p className="text-center text-sm font-semibold text-emerald-600">
                        Verification code sent
                    </p>
                ) : null}

                <div className="text-center">
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={!canResend}
                        className={cn(
                            "text-sm font-semibold",
                            canResend
                                ? "text-secondary hover:underline"
                                : "cursor-not-allowed text-muted-foreground"
                        )}
                    >
                        Resend code
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <AuthHeader />
            <main className="mx-auto flex min-h-[calc(100dvh-72px)] w-full items-center justify-center px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
                <AuthCard form={form} hero={<AuthHero />} />
            </main>
        </div>
    );
}
