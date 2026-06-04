"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { AuthImageSlider } from "@/components/AuthImageSlider";
import { AuthPageHeader } from "@/components/AuthPageHeader";
import { ArrowLeft, CaretDown, Eye, EyeSlash, FirstAidKit, Info, UserCircle, X } from "phosphor-react";

type AuthLockoutDetail = {
    error_code: string;
    message?: string;
    locked_until?: string;
    retry_after_seconds?: number;
    lock_duration_seconds?: number;
    attempts_limit?: number;
};

export default function PatientRegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [confirmationEmail, setConfirmationEmail] = useState("");
    const [verificationAfterRegistration, setVerificationAfterRegistration] = useState(false);
    const [showRegistrationCompleteStep, setShowRegistrationCompleteStep] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [apiError, setApiError] = useState("");
    const [showLoginRoleMenu, setShowLoginRoleMenu] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [selectedLoginRole, setSelectedLoginRole] = useState<"patient" | "doctor">("patient");
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [loginSuccess, setLoginSuccess] = useState("");
    const [showLoginEmailVerificationStep, setShowLoginEmailVerificationStep] = useState(false);
    const [loginEmailForVerification, setLoginEmailForVerification] = useState("");
    const [loginEmailVerificationCode, setLoginEmailVerificationCode] = useState<string[]>(Array(6).fill(""));
    const [isVerifyingEmailCode, setIsVerifyingEmailCode] = useState(false);
    const [lastVerificationAttemptCode, setLastVerificationAttemptCode] = useState("");
    const [resendCooldownSeconds, setResendCooldownSeconds] = useState(60);
    const [isResendingVerificationEmail, setIsResendingVerificationEmail] = useState(false);
    const verificationCodeInputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const [showResetPasswordStep, setShowResetPasswordStep] = useState(false);
    const [showResetPasswordEmailSentStep, setShowResetPasswordEmailSentStep] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState("");
    const [resetSuccess, setResetSuccess] = useState("");
    const [showResetPasswordLockedStep, setShowResetPasswordLockedStep] = useState(false);
    const [resetLockedDetail, setResetLockedDetail] = useState<AuthLockoutDetail | null>(null);
    const [resetRetryAfterSeconds, setResetRetryAfterSeconds] = useState(0);
    const [loginVerificationLockedDetail, setLoginVerificationLockedDetail] = useState<AuthLockoutDetail | null>(null);
    const [loginVerificationRetryAfterSeconds, setLoginVerificationRetryAfterSeconds] = useState(0);

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

    function retrySecondsFromPayload(data: Record<string, unknown>): number {
        let retry = typeof data.retry_after_seconds === "number" ? data.retry_after_seconds : 0;
        if (retry <= 0 && typeof data.locked_until === "string") {
            const end = new Date(data.locked_until).getTime();
            if (!Number.isNaN(end)) {
                retry = Math.max(0, Math.ceil((end - Date.now()) / 1000));
            }
        }
        return retry;
    }

    /** FastAPI often wraps errors as `{ detail: { error_code, message, retry_after_seconds, ... } }` */
    function extractEmailVerificationLockout(raw: Record<string, unknown>): AuthLockoutDetail | null {
        const nested =
            raw.detail && typeof raw.detail === "object" && !Array.isArray(raw.detail)
                ? (raw.detail as Record<string, unknown>)
                : null;

        const src =
            raw.error_code === "EMAIL_VERIFICATION_LOCKED"
                ? raw
                : nested?.error_code === "EMAIL_VERIFICATION_LOCKED"
                  ? nested
                  : null;

        if (!src) return null;

        const retry = retrySecondsFromPayload(src);
        return {
            error_code: "EMAIL_VERIFICATION_LOCKED",
            message: typeof src.message === "string" ? src.message : undefined,
            locked_until: typeof src.locked_until === "string" ? src.locked_until : undefined,
            retry_after_seconds: retry,
            lock_duration_seconds: typeof src.lock_duration_seconds === "number" ? src.lock_duration_seconds : undefined,
            attempts_limit: typeof src.attempts_limit === "number" ? src.attempts_limit : undefined,
        };
    }

    function applyEmailVerificationLockout(lockout: AuthLockoutDetail) {
        setLoginVerificationLockedDetail(lockout);
        setLoginVerificationRetryAfterSeconds(Math.max(0, lockout.retry_after_seconds ?? 0));
    }

    useEffect(() => {
        if (!showResetPasswordLockedStep || resetRetryAfterSeconds <= 0) return;

        const timer = setInterval(() => {
            setResetRetryAfterSeconds((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [showResetPasswordLockedStep, resetRetryAfterSeconds]);

    useEffect(() => {
        if (!loginVerificationLockedDetail || loginVerificationRetryAfterSeconds <= 0) return;

        const timer = setInterval(() => {
            setLoginVerificationRetryAfterSeconds((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [loginVerificationLockedDetail, loginVerificationRetryAfterSeconds]);

    function resetLoginFormState() {
        setLoginEmail("");
        setLoginPassword("");
        setShowLoginPassword(false);
        setLoginLoading(false);
        setLoginError("");
        setLoginSuccess("");
        setShowLoginEmailVerificationStep(false);
        setLoginEmailForVerification("");
        setLoginEmailVerificationCode(Array(6).fill(""));
        setIsVerifyingEmailCode(false);
        setLastVerificationAttemptCode("");
        setResendCooldownSeconds(60);
        setIsResendingVerificationEmail(false);
        setShowResetPasswordStep(false);
        setShowResetPasswordEmailSentStep(false);
        setShowResetPasswordLockedStep(false);
        setResetEmail("");
        setResetLoading(false);
        setResetError("");
        setResetSuccess("");
        setResetLockedDetail(null);
        setResetRetryAfterSeconds(0);
        setLoginVerificationLockedDetail(null);
        setLoginVerificationRetryAfterSeconds(0);
        setVerificationAfterRegistration(false);
        setShowRegistrationCompleteStep(false);
    }

    function isValidPassword(value: string) {
        if (value.length < 8 || value.length > 20) return false;
        if (!/[A-Z]/.test(value)) return false;
        if (!/[a-z]/.test(value)) return false;
        if (!/\d/.test(value)) return false;
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(value)) return false;
        return true;
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!isValidPassword(password)) {
            setPasswordError(
                "Password must be 8-20 characters with uppercase, lowercase, number, and special character."
            );
            return;
        }

        setLoading(true);
        setMessage("");
        setApiError("");
        setPasswordError("");
        setShowRegistrationCompleteStep(false);
        try {
            const res = await fetch("/api/v1/patient/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password,
                    consents: {
                        terms_privacy: true,
                        telehealth: true,
                        marketing: false,
                    },
                }),
            });

            const data = (await res.json().catch(() => ({}))) as {
                message?: string;
                detail?: string | { msg?: string }[];
                error?: string;
            };

            if (!res.ok) {
                const detailText = Array.isArray(data.detail)
                    ? data.detail.map((item) => item.msg).filter(Boolean).join(", ")
                    : data.detail;
                throw new Error(data.error || detailText || "Patient registration failed");
            }

            setMessage("");
            setConfirmationEmail(email);
            setLoginEmailForVerification(email);
            setShowLoginEmailVerificationStep(true);
            setVerificationAfterRegistration(true);
            setLoginVerificationLockedDetail(null);
            setLoginVerificationRetryAfterSeconds(0);
            setLoginEmailVerificationCode(Array(6).fill(""));
            setResendCooldownSeconds(60);
            setLoginError("");
            setLoginSuccess("");
            setPassword("");
        } catch (error) {
            setApiError(error instanceof Error ? error.message : "Patient registration failed");
        } finally {
            setLoading(false);
        }
    }

    async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoginError("");
        setLoginSuccess("");

        if (selectedLoginRole !== "patient") {
            setLoginError("Doctor login API is not wired in this form yet.");
            return;
        }

        setLoginLoading(true);
        try {
            const res = await fetch("/api/v1/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: loginEmail,
                    password: loginPassword,
                }),
            });

            const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
                message?: string;
                access_token?: string;
                refresh_token?: string;
            };

            if (!res.ok) {
                const lockout = extractEmailVerificationLockout(data);
                if (lockout) {
                    setLoginEmailForVerification(loginEmail);
                    setShowLoginEmailVerificationStep(true);
                    applyEmailVerificationLockout(lockout);
                    setResendCooldownSeconds(60);
                    setLoginError("");
                    setLoginSuccess("");
                    setLoginPassword("");
                    setShowLoginModal(false);
                    return;
                }

                const detailObj =
                    data?.detail && typeof data.detail === "object" && !Array.isArray(data.detail)
                        ? (data.detail as { status?: string; error_code?: string })
                        : null;
                const isVerificationPending =
                    detailObj?.status === "EMAIL_VERIFICATION_PENDING" ||
                    detailObj?.error_code === "EMAIL_VERIFICATION_PENDING";

                if (isVerificationPending) {
                    setLoginEmailForVerification(loginEmail);
                    setShowLoginEmailVerificationStep(true);
                    setLoginVerificationLockedDetail(null);
                    setLoginVerificationRetryAfterSeconds(0);
                    setResendCooldownSeconds(60);
                    setLoginError("");
                    setLoginSuccess("");
                    setLoginPassword("");
                    setShowLoginModal(false);
                    return;
                }

                const detailText = Array.isArray(data.detail)
                    ? data.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(", ")
                    : typeof data.detail === "string"
                      ? data.detail
                      : "";

                throw new Error(
                    (typeof data.error === "string" ? data.error : "") || detailText || "Login failed"
                );
            }

            setLoginSuccess(typeof data.message === "string" ? data.message : "Login successful.");
        } catch (error) {
            setLoginError(error instanceof Error ? error.message : "Login failed");
        } finally {
            setLoginLoading(false);
        }
    }

    function updateVerificationCodeAtIndex(index: number, rawValue: string) {
        const value = rawValue.replace(/\s/g, "");
        setLoginEmailVerificationCode((prev) => {
            const next = [...prev];
            next[index] = value.slice(0, 1);
            return next;
        });

        if (value && index < verificationCodeInputRefs.current.length - 1) {
            verificationCodeInputRefs.current[index + 1]?.focus();
        }
    }

    function handleVerificationCodeKeyDown(index: number, key: string) {
        if (key === "Backspace" && !loginEmailVerificationCode[index] && index > 0) {
            verificationCodeInputRefs.current[index - 1]?.focus();
        }
    }

    function handleVerificationCodePaste(rawValue: string) {
        const normalized = rawValue.replace(/\s/g, "").slice(0, 6);
        if (!normalized) return;

        setLoginEmailVerificationCode((prev) => {
            const next = [...prev];
            for (let i = 0; i < 6; i += 1) {
                next[i] = normalized[i] ?? "";
            }
            return next;
        });

        const lastIndex = Math.max(0, Math.min(5, normalized.length - 1));
        verificationCodeInputRefs.current[lastIndex]?.focus();
    }

    async function verifyLoginEmailCode(codeValue?: string) {
        const code = (codeValue ?? loginEmailVerificationCode.join("")).replace(/\s/g, "");
        if (!loginEmailForVerification) {
            setLoginError("Missing email for verification.");
            return;
        }
        if (!code || code.length < 6) {
            setLoginError("Please enter the 6-digit code from your email.");
            return;
        }

        setIsVerifyingEmailCode(true);
        setLastVerificationAttemptCode(code);
        setLoginError("");

        try {
            const res = await fetch("/api/v1/auth/verify-email-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: loginEmailForVerification,
                    code,
                }),
            });

            const text = await res.text();
            let data: Record<string, unknown>;
            try {
                data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
            } catch {
                throw new Error("Email verification failed.");
            }

            const lockoutVerify = extractEmailVerificationLockout(data);
            if (lockoutVerify && (res.status === 429 || res.status === 403)) {
                applyEmailVerificationLockout(lockoutVerify);
                return;
            }

            if (res.status === 429) {
                const nested =
                    data.detail && typeof data.detail === "object" && !Array.isArray(data.detail)
                        ? (data.detail as Record<string, unknown>)
                        : null;
                const flat = nested ?? data;
                const retry = retrySecondsFromPayload(flat);
                applyEmailVerificationLockout({
                    error_code: "EMAIL_VERIFICATION_LOCKED",
                    message: typeof flat.message === "string" ? flat.message : undefined,
                    locked_until: typeof flat.locked_until === "string" ? flat.locked_until : undefined,
                    retry_after_seconds: retry,
                    lock_duration_seconds:
                        typeof flat.lock_duration_seconds === "number" ? flat.lock_duration_seconds : undefined,
                    attempts_limit: typeof flat.attempts_limit === "number" ? flat.attempts_limit : undefined,
                });
                return;
            }

            if (res.status === 403) {
                const detail403 =
                    data.detail && typeof data.detail === "object" && !Array.isArray(data.detail)
                        ? (data.detail as Record<string, unknown>)
                        : null;
                const msg =
                    (typeof detail403?.message === "string" ? detail403.message : undefined) ??
                    (typeof data.message === "string" ? data.message : undefined) ??
                    (typeof data.error === "string" ? data.error : undefined) ??
                    "Verify your email before continuing.";
                setLoginError(msg);
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

            const verifiedEmail = loginEmailForVerification;

            if (verificationAfterRegistration) {
                setShowLoginEmailVerificationStep(false);
                setVerificationAfterRegistration(false);
                setLoginEmailVerificationCode(Array(6).fill(""));
                setLoginVerificationLockedDetail(null);
                setLoginVerificationRetryAfterSeconds(0);
                setLoginEmailForVerification("");
                setConfirmationEmail(verifiedEmail);
                setLoginEmail(verifiedEmail);
                setMessage(
                    typeof data.message === "string"
                        ? data.message
                        : "Email verified. Your account is ready."
                );
                setShowRegistrationCompleteStep(true);
                return;
            }

            setShowLoginEmailVerificationStep(false);
            setShowLoginModal(true);
            setLoginEmailVerificationCode(Array(6).fill(""));
            setLoginSuccess(
                typeof data.message === "string" ? data.message : "Email verified. You can log in now."
            );
        } catch (error) {
            setLoginError(error instanceof Error ? error.message : "Email verification failed");
        } finally {
            setIsVerifyingEmailCode(false);
        }
    }

    useEffect(() => {
        if (!showLoginEmailVerificationStep || isVerifyingEmailCode) return;
        const code = loginEmailVerificationCode.join("").replace(/\s/g, "");
        if (code.length !== 6) return;
        if (code === lastVerificationAttemptCode) return;
        void verifyLoginEmailCode(code);
    }, [
        showLoginEmailVerificationStep,
        isVerifyingEmailCode,
        loginEmailVerificationCode,
        lastVerificationAttemptCode,
    ]);

    useEffect(() => {
        if (!showLoginEmailVerificationStep || resendCooldownSeconds <= 0) return;
        const timer = setInterval(() => {
            setResendCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [showLoginEmailVerificationStep, resendCooldownSeconds]);

    async function resendVerificationEmail() {
        if (!loginEmailForVerification) {
            setLoginError("Missing email for verification.");
            return;
        }
        if (resendCooldownSeconds > 0 || isResendingVerificationEmail) return;

        setIsResendingVerificationEmail(true);
        setLoginError("");

        try {
            const res = await fetch("/api/v1/auth/resend-verification-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: loginEmailForVerification,
                }),
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
                    applyEmailVerificationLockout(lockout);
                    return;
                }
                const nested =
                    data.detail && typeof data.detail === "object" && !Array.isArray(data.detail)
                        ? (data.detail as Record<string, unknown>)
                        : null;
                const flat = nested ?? data;
                const retry = retrySecondsFromPayload(flat);
                applyEmailVerificationLockout({
                    error_code: "EMAIL_VERIFICATION_LOCKED",
                    message: typeof flat.message === "string" ? flat.message : undefined,
                    locked_until: typeof flat.locked_until === "string" ? flat.locked_until : undefined,
                    retry_after_seconds: retry,
                    lock_duration_seconds:
                        typeof flat.lock_duration_seconds === "number" ? flat.lock_duration_seconds : undefined,
                    attempts_limit: typeof flat.attempts_limit === "number" ? flat.attempts_limit : undefined,
                });
                return;
            }

            if (!res.ok) {
                const detail = data.detail;
                const detailText = Array.isArray(detail)
                    ? detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(", ")
                    : typeof detail === "string"
                      ? detail
                      : typeof detail === "object" && detail !== null && "message" in detail
                        ? String((detail as { message?: unknown }).message ?? "")
                        : "";
                throw new Error(
                    (typeof data.error === "string" ? data.error : undefined) ||
                        detailText ||
                        "Failed to resend verification email"
                );
            }

            setLoginVerificationLockedDetail(null);
            setLoginVerificationRetryAfterSeconds(0);
            setResendCooldownSeconds(60);
            setLoginSuccess(
                typeof data.message === "string" ? data.message : "Verification email sent again."
            );
        } catch (error) {
            setLoginError(error instanceof Error ? error.message : "Failed to resend verification email");
        } finally {
            setIsResendingVerificationEmail(false);
        }
    }

    async function requestForgotPassword(emailValue: string) {
        setResetError("");
        setResetSuccess("");
        setShowResetPasswordLockedStep(false);
        setResetLockedDetail(null);
        setResetRetryAfterSeconds(0);
        setResetLoading(true);

        try {
            const res = await fetch("/api/v1/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: emailValue,
                }),
            });

            const data = (await res.json().catch(() => ({}))) as {
                message?: string;
                detail?: string | { msg?: string }[] | AuthLockoutDetail;
                error?: string;
            };

            if (!res.ok) {
                const lockedDetail =
                    data.detail &&
                    typeof data.detail === "object" &&
                    !Array.isArray(data.detail) &&
                    "error_code" in data.detail &&
                    data.detail.error_code === "PASSWORD_RESET_LOCKED"
                        ? (data.detail as AuthLockoutDetail)
                        : null;

                if (lockedDetail) {
                    setResetLockedDetail(lockedDetail);
                    setResetRetryAfterSeconds(Math.max(0, lockedDetail.retry_after_seconds ?? 0));
                    setShowResetPasswordLockedStep(true);
                    return;
                }

                const detailText = Array.isArray(data.detail)
                    ? data.detail.map((item) => item.msg).filter(Boolean).join(", ")
                    : data.detail;
                throw new Error(data.error || detailText || "Failed to request password reset");
            }

            setResetSuccess(data.message || "Password reset link sent.");
            setShowResetPasswordEmailSentStep(true);
        } catch (error) {
            setResetError(error instanceof Error ? error.message : "Failed to request password reset");
        } finally {
            setResetLoading(false);
        }
    }

    async function handleForgotPasswordSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        await requestForgotPassword(resetEmail);
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-white">
            <AuthPageHeader>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowLoginRoleMenu((prev) => !prev)}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#16355e]"
                    >
                        Do you already have an account? <span className="underline">Log in</span> <CaretDown size={12} />
                    </button>

                    {showLoginRoleMenu ? (
                        <div className="absolute right-0 top-[34px] z-30 min-w-[170px] rounded-md border border-[#dce4ef] bg-white shadow-md">
                            <p className="px-3 pt-2 text-xs font-semibold uppercase text-[#7b8aa1]">Continue as:</p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedLoginRole("patient");
                                    resetLoginFormState();
                                    setShowLoginRoleMenu(false);
                                    setShowLoginModal(true);
                                }}
                                className="flex w-full items-center gap-2 border-t border-[#eef3f8] px-3 py-2 text-left text-sm font-medium text-[#1f3556] hover:bg-[#f7fbff]"
                            >
                                <UserCircle size={16} /> Patient
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedLoginRole("doctor");
                                    resetLoginFormState();
                                    setShowLoginRoleMenu(false);
                                    setShowLoginModal(true);
                                }}
                                className="flex w-full items-center gap-2 border-t border-[#eef3f8] px-3 py-2 text-left text-sm font-medium text-[#1f3556] hover:bg-[#f7fbff]"
                            >
                                <FirstAidKit size={16} /> Doctor
                            </button>
                        </div>
                    ) : null}
                </div>
            </AuthPageHeader>

            <main className="relative z-10 mx-auto mt-14 w-[92%] max-w-6xl rounded-2xl border border-[#e5ebf2] bg-white/70 p-6 backdrop-blur">
                <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[#e3e8ef] bg-white p-8 lg:grid-cols-2">
                    <section className="pr-0 lg:pr-8">
                        {showLoginEmailVerificationStep ? (
                            loginVerificationLockedDetail ? (
                                <div className="rounded-xl border border-[#dce4ef] p-8">
                                    <h2 className="text-[40px] font-bold leading-tight text-[#16355e] md:text-[46px]">
                                        Too many attempts
                                    </h2>
                                    <div className="mt-4 flex gap-3 rounded-lg bg-[#fef2f2] px-4 py-3 text-sm leading-snug text-[#cf5f5f]">
                                        <Info size={22} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
                                        <span>
                                            {loginVerificationLockedDetail.message ??
                                                "This email has been temporarily blocked due to multiple verification attempts. Please try again later."}
                                        </span>
                                    </div>
                                    <p className="mt-8 text-lg font-semibold text-[#16355e] md:text-xl">
                                        You can request a new code in
                                    </p>
                                    {(() => {
                                        const countdown = formatCountdown(loginVerificationRetryAfterSeconds);
                                        return (
                                            <div className="mt-4 flex items-start gap-2 md:gap-3">
                                                <div className="w-full min-w-0">
                                                    <div className="rounded-xl border border-[#c8d7e8] bg-[#f7fbff] px-2 py-3 text-center shadow-[0_2px_0_rgba(0,0,0,0.04)] md:px-4">
                                                        <span className="text-3xl font-semibold leading-none text-[#16355e] md:text-[50px]">
                                                            {countdown.hours}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-center text-xs font-semibold tracking-wide text-[#16355e] md:text-[18px]">
                                                        HOURS
                                                    </p>
                                                </div>
                                                <span className="pt-4 text-2xl font-semibold text-[#16355e] md:pt-7 md:text-[36px]">
                                                    :
                                                </span>
                                                <div className="w-full min-w-0">
                                                    <div className="rounded-xl border border-[#c8d7e8] bg-[#f7fbff] px-2 py-3 text-center shadow-[0_2px_0_rgba(0,0,0,0.04)] md:px-4">
                                                        <span className="text-3xl font-semibold leading-none text-[#16355e] md:text-[50px]">
                                                            {countdown.minutes}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-center text-xs font-semibold tracking-wide text-[#16355e] md:text-[18px]">
                                                        MINUTES
                                                    </p>
                                                </div>
                                                <span className="pt-4 text-2xl font-semibold text-[#16355e] md:pt-7 md:text-[36px]">
                                                    :
                                                </span>
                                                <div className="w-full min-w-0">
                                                    <div className="rounded-xl border border-[#c8d7e8] bg-[#f7fbff] px-2 py-3 text-center shadow-[0_2px_0_rgba(0,0,0,0.04)] md:px-4">
                                                        <span className="text-3xl font-semibold leading-none text-[#16355e] md:text-[50px]">
                                                            {countdown.seconds}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-center text-xs font-semibold tracking-wide text-[#16355e] md:text-[18px]">
                                                        SECONDS
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            ) : (
                            <div className="rounded-xl border border-[#dce4ef] p-8">
                                <h2 className="text-[46px] font-bold leading-tight text-[#16355e]">We emailed you a code</h2>
                                <p className="mt-3 text-base text-[#6f819a]">
                                    We sent an email to{" "}
                                    <span className="font-semibold text-[#1f3556]">{loginEmailForVerification || "your email"}</span>.
                                    {verificationAfterRegistration
                                        ? " Enter the 6-digit code below to finish creating your account."
                                        : " Enter the code or tap the button in the email to continue."}
                                </p>

                                <p className="mt-5 text-sm font-semibold text-[#3f5676]">Confirmation code</p>
                                <div className="mt-2 flex items-center gap-2">
                                    {loginEmailVerificationCode.slice(0, 3).map((char, idx) => (
                                        <input
                                            key={idx}
                                            inputMode="numeric"
                                            aria-label={`Verification code digit ${idx + 1}`}
                                            ref={(el) => {
                                                verificationCodeInputRefs.current[idx] = el;
                                            }}
                                            className="h-12 w-12 rounded-md border border-[#c8d7e8] bg-[#f7fbff] text-center text-lg font-semibold text-[#1f3556] outline-none focus:border-[#6fa9d5]"
                                            value={char}
                                            maxLength={1}
                                            onKeyDown={(e) => handleVerificationCodeKeyDown(idx, e.key)}
                                            onPaste={(e) => {
                                                e.preventDefault();
                                                handleVerificationCodePaste(e.clipboardData.getData("text"));
                                            }}
                                            onChange={(e) => updateVerificationCodeAtIndex(idx, e.target.value)}
                                        />
                                    ))}
                                    <span className="px-1 text-[#97a8bf]">-</span>
                                    {loginEmailVerificationCode.slice(3, 6).map((char, idx) => (
                                        <input
                                            key={idx + 3}
                                            inputMode="numeric"
                                            aria-label={`Verification code digit ${idx + 4}`}
                                            ref={(el) => {
                                                verificationCodeInputRefs.current[idx + 3] = el;
                                            }}
                                            className="h-12 w-12 rounded-md border border-[#c8d7e8] bg-[#f7fbff] text-center text-lg font-semibold text-[#1f3556] outline-none focus:border-[#6fa9d5]"
                                            value={char}
                                            maxLength={1}
                                            onKeyDown={(e) => handleVerificationCodeKeyDown(idx + 3, e.key)}
                                            onPaste={(e) => {
                                                e.preventDefault();
                                                handleVerificationCodePaste(e.clipboardData.getData("text"));
                                            }}
                                            onChange={(e) => updateVerificationCodeAtIndex(idx + 3, e.target.value)}
                                        />
                                    ))}
                                </div>

                                <p className="mt-4 text-sm text-[#6f819a]">
                                    If you don&apos;t see the email, check your spam or junk folder.
                                </p>

                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <a
                                        href="https://mail.google.com"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block w-full rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-center text-sm font-semibold text-[#2b466b]"
                                    >
                                        Open Gmail
                                    </a>
                                    <a
                                        href="https://outlook.live.com/mail/0/"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block w-full rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-center text-sm font-semibold text-[#2b466b]"
                                    >
                                        Open Outlook
                                    </a>
                                </div>

                                <div className="my-5 h-px bg-[#e2e8f0]" />

                                <button
                                    type="button"
                                    disabled={resendCooldownSeconds > 0 || isResendingVerificationEmail}
                                    onClick={() => {
                                        void resendVerificationEmail();
                                    }}
                                    className="w-full text-sm font-semibold text-[#2f7dbd] disabled:opacity-60"
                                >
                                    {isResendingVerificationEmail
                                        ? "Resending..."
                                        : resendCooldownSeconds > 0
                                          ? `Resend code in ${resendCooldownSeconds}s`
                                          : "Resend code"}
                                </button>

                                {loginError ? <p className="mt-3 text-sm text-red-600">{loginError}</p> : null}
                                {loginSuccess ? <p className="mt-3 text-sm text-emerald-700">{loginSuccess}</p> : null}
                            </div>
                            )
                        ) : showRegistrationCompleteStep ? (
                            <div className="rounded-xl border border-[#dce4ef] p-8">
                                <h2 className="text-[46px] font-bold leading-tight text-[#16355e]">You&apos;re all set</h2>
                                <p className="mt-3 text-base text-[#6f819a]">
                                    <span className="font-semibold text-[#1f3556]">{confirmationEmail || "Your email"}</span>{" "}
                                    is verified. You can log in with your password anytime.
                                </p>
                                {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedLoginRole("patient");
                                        setShowLoginModal(true);
                                    }}
                                    className="mt-8 w-full rounded-md bg-[#14528f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f467b]"
                                >
                                    Log in
                                </button>

                                <div className="my-5 h-px bg-[#e2e8f0]" />

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRegistrationCompleteStep(false);
                                        setConfirmationEmail("");
                                        setEmail("");
                                        setPassword("");
                                        setMessage("");
                                        setApiError("");
                                    }}
                                    className="w-full text-sm font-semibold text-[#2f7dbd]"
                                >
                                    Create another account
                                </button>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-5xl font-bold text-[#16355e]">Create your free account</h1>

                                <div className="mt-6 grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        className="rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-sm font-semibold text-[#2b466b]"
                                    >
                                        Google
                                    </button>
                                    <button
                                        type="button"
                                        className="rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-sm font-semibold text-[#2b466b]"
                                    >
                                        Apple
                                    </button>
                                    <button
                                        type="button"
                                        className="rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-sm font-semibold text-[#2b466b]"
                                    >
                                        Microsoft
                                    </button>
                                </div>

                                <div className="my-4 flex items-center gap-2 text-[#9aabc0]">
                                    <div className="h-px flex-1 bg-[#dbe4ef]" />
                                    <span className="text-xs font-medium">or</span>
                                    <div className="h-px flex-1 bg-[#dbe4ef]" />
                                </div>

                                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                                    <div>
                                        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#405676]">
                                            Email address
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="email@domain.com"
                                            className="w-full rounded-md border border-[#d6deea] px-4 py-3 text-[#1f3556] outline-none focus:border-[#6fa9d5]"
                                        />
                                    </div>

                                    <div className="relative">
                                        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#405676]">
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            minLength={8}
                                            maxLength={20}
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (passwordError) setPasswordError("");
                                            }}
                                            placeholder="********"
                                            className="w-full rounded-md border border-[#d6deea] px-4 py-3 pr-11 text-[#1f3556] outline-none focus:border-[#6fa9d5]"
                                        />
                                        <button
                                            type="button"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="absolute right-3 top-[38px] text-[#7b95b4]"
                                        >
                                            {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                                        </button>
                                        {passwordError ? <p className="mt-2 text-xs text-red-600">{passwordError}</p> : null}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full rounded-md bg-[#14528f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f467b] disabled:opacity-60"
                                    >
                                        {loading ? "Please wait..." : "Continue"}
                                    </button>
                                </form>

                                <p className="mt-4 text-sm text-[#6d7e95]">
                                    By continuing, you confirm that you have read and agree to our{" "}
                                    <span className="font-semibold text-[#16355e]">terms and conditions</span> and{" "}
                                    our <span className="font-semibold text-[#16355e]">privacy policy</span>.
                                </p>

                                {apiError ? <p className="mt-3 text-sm text-red-600">{apiError}</p> : null}
                                {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
                            </>
                        )}
                    </section>

                    <section className="mt-8 overflow-hidden rounded-2xl lg:mt-0">
                        <AuthImageSlider />
                    </section>
                </div>
            </main>

            {showLoginModal ? (
                <div className="absolute inset-0 z-40 flex items-center justify-center p-4">
                    <div className="absolute inset-0 backdrop-blur-[8px]" />
                    <div className="absolute inset-0 bg-[#6f8fb7]/30" />

                    <div className="relative w-full max-w-[430px] rounded-2xl border border-[#dce4ef] bg-white p-4 shadow-[0_20px_50px_rgba(20,52,93,0.25)]">
                        <button
                            type="button"
                            aria-label="Close login modal"
                            onClick={() => {
                                setShowLoginModal(false);
                                resetLoginFormState();
                            }}
                            className="absolute right-4 top-4 text-[#8a99ae]"
                        >
                            <X size={20} />
                        </button>

                        {showResetPasswordStep ? (
                            <>
                                {showResetPasswordLockedStep ? (
                                    <>
                                        {(() => {
                                            const countdown = formatCountdown(resetRetryAfterSeconds);
                                            return (
                                                <>
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowResetPasswordLockedStep(false)}
                                                            className="text-[#7f8da3]"
                                                            aria-label="Back"
                                                        >
                                                            <ArrowLeft size={20} />
                                                        </button>
                                                        <div className="flex items-center gap-2">
                                                            <Image src="/logo-symbol.png" alt="Qarevo symbol" width={20} height={20} />
                                                            <span className="text-[32px] font-semibold text-[#1f3556]">Qarevo Health</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowLoginModal(false);
                                                                resetLoginFormState();
                                                            }}
                                                            className="text-[#8a99ae]"
                                                            aria-label="Close"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    </div>

                                                    <h3 className="text-[44px] font-bold leading-tight text-[#1f3556]">Too many attempts</h3>
                                                    <div className="mt-2 text-[14px] leading-5 text-[#cf5f5f]">
                                                        <p>You&apos;ve requested a password reset too many times.</p>
                                                        <p>This email is temporarily blocked.</p>
                                                    </div>

                                                    <p className="mt-5 text-[30px] font-semibold leading-tight text-[#1f3556]">
                                                        You can request a new reset link in
                                                    </p>

                                                    <div className="mt-4 flex items-start gap-2">
                                                        <div className="w-full">
                                                            <div className="rounded-xl border border-[#b9cad9] bg-white px-4 py-3 text-center shadow-[0_2px_0_rgba(0,0,0,0.04)]">
                                                                <span className="text-[50px] font-semibold leading-none text-[#1f3556]">
                                                                    {countdown.hours}
                                                                </span>
                                                            </div>
                                                            <p className="mt-2 text-center text-[20px] font-semibold text-[#1f3556]">HOURS</p>
                                                        </div>
                                                        <span className="pt-4 text-[36px] font-semibold text-[#1f3556]">:</span>
                                                        <div className="w-full">
                                                            <div className="rounded-xl border border-[#b9cad9] bg-white px-4 py-3 text-center shadow-[0_2px_0_rgba(0,0,0,0.04)]">
                                                                <span className="text-[50px] font-semibold leading-none text-[#1f3556]">
                                                                    {countdown.minutes}
                                                                </span>
                                                            </div>
                                                            <p className="mt-2 text-center text-[20px] font-semibold text-[#1f3556]">MINUTES</p>
                                                        </div>
                                                        <span className="pt-4 text-[36px] font-semibold text-[#1f3556]">:</span>
                                                        <div className="w-full">
                                                            <div className="rounded-xl border border-[#b9cad9] bg-white px-4 py-3 text-center shadow-[0_2px_0_rgba(0,0,0,0.04)]">
                                                                <span className="text-[50px] font-semibold leading-none text-[#1f3556]">
                                                                    {countdown.seconds}
                                                                </span>
                                                            </div>
                                                            <p className="mt-2 text-center text-[20px] font-semibold text-[#1f3556]">SECONDS</p>
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </>
                                ) : showResetPasswordEmailSentStep ? (
                                    <>
                                        <div className="mb-3 flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => setShowResetPasswordEmailSentStep(false)}
                                                className="text-[#7f8da3]"
                                                aria-label="Back"
                                            >
                                                <ArrowLeft size={20} />
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <Image src="/logo-symbol.png" alt="Qarevo symbol" width={20} height={20} />
                                                <span className="text-[32px] font-semibold text-[#1f3556]">Qarevo Health</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowLoginModal(false);
                                                    resetLoginFormState();
                                                }}
                                                className="text-[#8a99ae]"
                                                aria-label="Close"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <h3 className="text-[40px] font-bold leading-tight text-[#1f3556]">Check your email</h3>
                                        <p className="mt-2 text-base text-[#6f819a]">
                                            Check your inbox for password reset email from no-reply@email.qarevo-health.com
                                        </p>

                                        <div className="mt-4 space-y-2">
                                            <a
                                                href="https://mail.google.com"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block w-full rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-center text-sm font-semibold text-[#2b466b]"
                                            >
                                                Open Gmail
                                            </a>
                                            <a
                                                href="https://outlook.live.com/mail/0/"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block w-full rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-center text-sm font-semibold text-[#2b466b]"
                                            >
                                                Open Outlook
                                            </a>
                                        </div>

                                        <div className="my-4 flex items-center gap-2 text-[#9aabc0]">
                                            <div className="h-px flex-1 bg-[#dbe4ef]" />
                                            <span className="text-xs font-medium">or</span>
                                            <div className="h-px flex-1 bg-[#dbe4ef]" />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                void requestForgotPassword(resetEmail);
                                            }}
                                            className="w-full text-sm font-semibold text-[#2f7dbd]"
                                        >
                                            Resend email
                                        </button>

                                        {resetError ? <p className="mt-3 text-sm text-red-600">{resetError}</p> : null}
                                        {resetSuccess ? <p className="mt-3 text-sm text-emerald-700">{resetSuccess}</p> : null}
                                    </>
                                ) : (
                                    <>
                                        <div className="mb-3 flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => setShowResetPasswordStep(false)}
                                                className="text-[#7f8da3]"
                                                aria-label="Back"
                                            >
                                                <ArrowLeft size={20} />
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <Image src="/logo-symbol.png" alt="Qarevo symbol" width={20} height={20} />
                                                <span className="text-[32px] font-semibold text-[#1f3556]">Qarevo Health</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowLoginModal(false);
                                                    resetLoginFormState();
                                                }}
                                                className="text-[#8a99ae]"
                                                aria-label="Close"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <h3 className="text-[40px] font-bold leading-tight text-[#1f3556]">
                                            First, enter your email address.
                                        </h3>
                                        <p className="mt-2 text-base text-[#6f819a]">
                                            We will send you a message with a link through which you can set your new password.
                                        </p>

                                        <form className="mt-4" onSubmit={handleForgotPasswordSubmit}>
                                            <label htmlFor="reset-email" className="mb-2 block text-sm font-semibold text-[#405676]">
                                                Your email
                                            </label>
                                            <input
                                                id="reset-email"
                                                type="email"
                                                required
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                placeholder="email@domain.com"
                                                className="w-full rounded-md border border-[#d6deea] px-4 py-3 text-[#1f3556] outline-none focus:border-[#6fa9d5]"
                                            />

                                            {resetError ? <p className="mt-3 text-sm text-red-600">{resetError}</p> : null}
                                            {resetSuccess ? <p className="mt-3 text-sm text-emerald-700">{resetSuccess}</p> : null}

                                            <button
                                                type="submit"
                                                disabled={resetLoading}
                                                className="mt-4 w-full rounded-md bg-[#14528f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f467b] disabled:opacity-60"
                                            >
                                                {resetLoading ? "Please wait..." : "Reset password"}
                                            </button>
                                        </form>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <h3 className="text-[32px] font-bold text-[#1f3556]">Log in to your account</h3>

                                <div className="mt-4 space-y-2">
                                    <button
                                        type="button"
                                        className="w-full rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-sm font-semibold text-[#2b466b]"
                                    >
                                        Continue with Google
                                    </button>
                                    <button
                                        type="button"
                                        className="w-full rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-sm font-semibold text-[#2b466b]"
                                    >
                                        Continue with Apple
                                    </button>
                                    <button
                                        type="button"
                                        className="w-full rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-sm font-semibold text-[#2b466b]"
                                    >
                                        Continue with Microsoft
                                    </button>
                                </div>

                                <div className="my-4 flex items-center gap-2 text-[#9aabc0]">
                                    <div className="h-px flex-1 bg-[#dbe4ef]" />
                                    <span className="text-xs font-medium">or</span>
                                    <div className="h-px flex-1 bg-[#dbe4ef]" />
                                </div>

                                <form onSubmit={handleLoginSubmit}>
                                    <div>
                                        <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-[#405676]">
                                            Email address
                                        </label>
                                        <input
                                            id="login-email"
                                            type="email"
                                            required
                                            value={loginEmail}
                                            onChange={(e) => setLoginEmail(e.target.value)}
                                            placeholder="email@domain.com"
                                            className="w-full rounded-md border border-[#d6deea] px-4 py-3 text-[#1f3556] outline-none focus:border-[#6fa9d5]"
                                        />
                                    </div>

                                    <div className="relative mt-3">
                                        <div className="mb-2 flex items-center justify-between">
                                            <label htmlFor="login-password" className="text-sm font-semibold text-[#405676]">
                                                Password
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowResetPasswordStep(true)}
                                                className="text-sm font-semibold text-[#2f7dbd]"
                                            >
                                                Reset password
                                            </button>
                                        </div>
                                        <input
                                            id="login-password"
                                            type={showLoginPassword ? "text" : "password"}
                                            required
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                            placeholder="********"
                                            className="w-full rounded-md border border-[#d6deea] px-4 py-3 pr-11 text-[#1f3556] outline-none focus:border-[#6fa9d5]"
                                        />
                                        <button
                                            type="button"
                                            aria-label={showLoginPassword ? "Hide password" : "Show password"}
                                            onClick={() => setShowLoginPassword((prev) => !prev)}
                                            className="absolute right-3 top-[38px] text-[#7b95b4]"
                                        >
                                            {showLoginPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>

                                    {loginError ? <p className="mt-3 text-sm text-red-600">{loginError}</p> : null}
                                    {loginSuccess ? <p className="mt-3 text-sm text-emerald-700">{loginSuccess}</p> : null}

                                    <button
                                        type="submit"
                                        disabled={loginLoading}
                                        className="mt-4 w-full rounded-md bg-[#14528f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f467b] disabled:opacity-60"
                                    >
                                        {loginLoading
                                            ? "Please wait..."
                                            : `Continue as ${selectedLoginRole === "patient" ? "Patient" : "Doctor"}`}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
