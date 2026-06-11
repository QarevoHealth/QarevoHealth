"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { AuthImageSlider } from "@/components/AuthImageSlider";
import { AuthLoginRoleMenu } from "@/components/AuthLoginRoleMenu";
import { AuthPageHeader } from "@/components/AuthPageHeader";
import { PasswordValidationHints } from "@/components/PasswordValidationHints";
import { ArrowLeft, CaretDown, CheckCircle, Eye, EyeSlash, FirstAidKit, Info, UserCircle, X } from "phosphor-react";

const VERIFICATION_RESEND_COOLDOWN_SEC = 60;

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
    const [showVerificationResendSuccess, setShowVerificationResendSuccess] = useState(false);
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
    const [showCompleteProfileStep, setShowCompleteProfileStep] = useState(false);
    const [profileFlowFromRegistration, setProfileFlowFromRegistration] = useState(false);
    const [profileFirstName, setProfileFirstName] = useState("");
    const [profileLastName, setProfileLastName] = useState("");
    const [profileError, setProfileError] = useState("");
    const router = useRouter();

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
                    setResendCooldownSeconds(0);
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
                    setResendCooldownSeconds(0);
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
                        : "Email verified. Complete your profile to finish signing up."
                );
                setProfileFlowFromRegistration(true);
                setProfileFirstName("");
                setProfileLastName("");
                setProfileError("");
                setShowCompleteProfileStep(true);
                return;
            }

            setShowLoginEmailVerificationStep(false);
            setLoginEmailVerificationCode(Array(6).fill(""));
            setLoginVerificationLockedDetail(null);
            setLoginVerificationRetryAfterSeconds(0);
            setLoginEmailForVerification("");
            setConfirmationEmail(verifiedEmail);
            setLoginEmail(verifiedEmail);
            setProfileFlowFromRegistration(false);
            setProfileFirstName("");
            setProfileLastName("");
            setProfileError("");
            setShowCompleteProfileStep(true);
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

    useEffect(() => {
        if (!showLoginEmailVerificationStep) return;
        if (resendCooldownSeconds > 0) return;
        setShowVerificationResendSuccess(false);
    }, [showLoginEmailVerificationStep, resendCooldownSeconds]);

    async function resendVerificationEmail() {
        if (!loginEmailForVerification) {
            setLoginError("Missing email for verification.");
            return;
        }
        if (resendCooldownSeconds > 0 || isResendingVerificationEmail) return;

        setIsResendingVerificationEmail(true);
        setLoginError("");
        setShowVerificationResendSuccess(false);

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
            setLoginSuccess("");
            setShowVerificationResendSuccess(true);
            setResendCooldownSeconds(VERIFICATION_RESEND_COOLDOWN_SEC);
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
                    : typeof data.detail === "string"
                      ? data.detail
                      : "";
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

    function handleCompleteProfileSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const first = profileFirstName.trim();
        const last = profileLastName.trim();
        if (!first || !last) {
            setProfileError("Please enter your first and last name.");
            return;
        }
        setProfileError("");
        // TODO: PATCH profile (first_name, last_name) when API is available
        setShowCompleteProfileStep(false);
        if (profileFlowFromRegistration) {
            setMessage("Your account is ready.");
            setShowRegistrationCompleteStep(true);
        } else {
            setShowLoginModal(true);
            setLoginSuccess("Profile saved. You can log in now.");
        }
    }

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[var(--color-primary-50)]">
            <AuthPageHeader className="sticky top-0 z-[100] !border-q-azure-200 !bg-white/95 shadow-sm backdrop-blur-md">
                <AuthLoginRoleMenu
                    onSelectPatient={() => {
                        setSelectedLoginRole("patient");
                        resetLoginFormState();
                        setShowLoginModal(true);
                    }}
                    onSelectDoctor={() => router.push("/doctor/login")}
                />
            </AuthPageHeader>

            <main className="relative z-10 mx-auto mt-10 w-[92%] max-w-6xl sm:mt-14">
                <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-q-azure-200 bg-white p-8 shadow-sm lg:grid-cols-2">
                    <section className="pr-0 lg:pr-8">
                        {showLoginEmailVerificationStep ? (
                            loginVerificationLockedDetail ? (
                                <div className="rounded-xl border border-q-border p-8">
                                    <h2 className="text-[30px] font-bold leading-tight text-q-heading">
                                        Too many attempts
                                    </h2>
                                    <div className="mt-4 flex gap-3 rounded-lg bg-q-danger-bg px-4 py-3 text-sm leading-snug text-q-danger">
                                        <Info size={22} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
                                        <span>
                                            {loginVerificationLockedDetail.message ??
                                                "This email has been temporarily blocked due to multiple verification attempts. Please try again later."}
                                        </span>
                                    </div>
                                    <p className="mt-8 text-left text-base font-semibold text-q-heading sm:text-lg">
                                        You can request a new code in
                                    </p>
                                    {(() => {
                                        const countdown = formatCountdown(loginVerificationRetryAfterSeconds);
                                        return (
                                            <div className="mt-4 flex items-start justify-start gap-1.5 sm:gap-2">
                                                <div className="flex w-[3.75rem] flex-col items-center sm:w-16">
                                                    <div className="flex h-14 w-full items-center justify-center rounded-xl border-2 border-q-azure-200 bg-q-azure-50 px-2 shadow-[0_2px_0_rgba(0,0,0,0.04)] sm:h-16">
                                                        <span className="text-2xl font-semibold tabular-nums leading-none text-q-heading sm:text-3xl">
                                                            {countdown.hours}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-q-heading sm:text-xs">
                                                        HOURS
                                                    </p>
                                                </div>
                                                <span className="pt-3 text-2xl font-light text-q-azure-400 sm:pt-4 sm:text-3xl">
                                                    :
                                                </span>
                                                <div className="flex w-[3.75rem] flex-col items-center sm:w-16">
                                                    <div className="flex h-14 w-full items-center justify-center rounded-xl border-2 border-q-azure-200 bg-q-azure-50 px-2 shadow-[0_2px_0_rgba(0,0,0,0.04)] sm:h-16">
                                                        <span className="text-2xl font-semibold tabular-nums leading-none text-q-heading sm:text-3xl">
                                                            {countdown.minutes}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-q-heading sm:text-xs">
                                                        MINUTES
                                                    </p>
                                                </div>
                                                <span className="pt-3 text-2xl font-light text-q-azure-400 sm:pt-4 sm:text-3xl">
                                                    :
                                                </span>
                                                <div className="flex w-[3.75rem] flex-col items-center sm:w-16">
                                                    <div className="flex h-14 w-full items-center justify-center rounded-xl border-2 border-q-azure-200 bg-q-azure-50 px-2 shadow-[0_2px_0_rgba(0,0,0,0.04)] sm:h-16">
                                                        <span className="text-2xl font-semibold tabular-nums leading-none text-q-heading sm:text-3xl">
                                                            {countdown.seconds}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-q-heading sm:text-xs">
                                                        SECONDS
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            ) : (
                            <div className="rounded-xl border border-q-border bg-white p-8 shadow-sm">
                                <h2 className="text-[30px] font-bold leading-tight text-q-heading">We emailed you the code</h2>
                                <p className="mt-4 text-base text-q-muted-text">
                                    Check{" "}
                                    <span className="font-semibold text-q-heading">{loginEmailForVerification || "your email"}</span>{" "}
                                    for a message from Qarevo Health with your verification code.
                                    {verificationAfterRegistration
                                        ? " Enter the 6-digit code below to finish creating your account."
                                        : " Enter the code below, or use the link in that email to continue."}
                                </p>

                                <p className="mt-5 text-sm font-semibold text-q-label">Confirmation code</p>
                                <div className="mt-2 flex items-center gap-2">
                                    {loginEmailVerificationCode.slice(0, 3).map((char, idx) => (
                                        <input
                                            key={idx}
                                            inputMode="numeric"
                                            aria-label={`Verification code digit ${idx + 1}`}
                                            ref={(el) => {
                                                verificationCodeInputRefs.current[idx] = el;
                                            }}
                                            className="h-12 w-12 rounded-md border border-q-border-strong bg-white text-center text-lg font-semibold text-q-heading outline-none transition-[border-color,background-color,box-shadow] hover:border-q-accent hover:bg-q-azure-50 hover:shadow-sm focus:border-q-accent focus:ring-2 focus:ring-q-accent/20"
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
                                    <span className="px-1 text-q-muted-text">-</span>
                                    {loginEmailVerificationCode.slice(3, 6).map((char, idx) => (
                                        <input
                                            key={idx + 3}
                                            inputMode="numeric"
                                            aria-label={`Verification code digit ${idx + 4}`}
                                            ref={(el) => {
                                                verificationCodeInputRefs.current[idx + 3] = el;
                                            }}
                                            className="h-12 w-12 rounded-md border border-q-border-strong bg-white text-center text-lg font-semibold text-q-heading outline-none transition-[border-color,background-color,box-shadow] hover:border-q-accent hover:bg-q-azure-50 hover:shadow-sm focus:border-q-accent focus:ring-2 focus:ring-q-accent/20"
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

                                <p className="mt-4 text-sm text-q-muted-text">
                                    If you don&apos;t see the email, check your spam or junk folder.
                                </p>

                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <a
                                        href="https://mail.google.com"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block w-full rounded-md border border-q-azure-200 bg-white px-3 py-2 text-center text-sm font-semibold text-q-heading hover:bg-q-azure-50"
                                    >
                                        Open Gmail
                                    </a>
                                    <a
                                        href="https://outlook.live.com/mail/0/"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block w-full rounded-md border border-q-azure-200 bg-white px-3 py-2 text-center text-sm font-semibold text-q-heading hover:bg-q-azure-50"
                                    >
                                        Open Outlook
                                    </a>
                                </div>

                                <div className="my-5 h-px bg-q-border" />

                                <div className="mt-1 min-h-[48px]">
                                    {showVerificationResendSuccess && resendCooldownSeconds > 0 ? (
                                        <div
                                            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-emerald-200 bg-white px-4 py-3.5 text-sm font-semibold text-emerald-800 shadow-[0_6px_20px_rgba(5,150,105,0.15)]"
                                            role="status"
                                        >
                                            <CheckCircle
                                                size={22}
                                                weight="fill"
                                                className="shrink-0 text-emerald-600"
                                                aria-hidden
                                            />
                                            <span>Verification code sent</span>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={isResendingVerificationEmail}
                                            onClick={() => {
                                                void resendVerificationEmail();
                                            }}
                                            className="w-full py-2.5 text-sm font-semibold text-q-link transition-opacity hover:underline disabled:cursor-wait disabled:opacity-55"
                                        >
                                            Resend code
                                        </button>
                                    )}
                                </div>

                            

                                {loginError ? <p className="mt-3 text-sm text-red-600">{loginError}</p> : null}
                                {loginSuccess ? <p className="mt-3 text-sm text-q-success">{loginSuccess}</p> : null}
                            </div>
                            )
                        ) : showCompleteProfileStep ? (
                            <div className="rounded-xl border border-q-border p-8">
                                <h2 className="text-[30px] font-bold leading-tight text-q-heading">Complete Your Profile</h2>
                                <p className="mt-3 text-base leading-relaxed text-q-muted-text">
                                    Please enter your first and last name to continue. This helps us personalize your
                                    experience on the platform.
                                </p>

                                <form className="mt-8 space-y-4" onSubmit={handleCompleteProfileSubmit}>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor="profile-first-name"
                                                className="mb-2 block text-sm font-semibold text-q-label"
                                            >
                                                First name
                                            </label>
                                            <input
                                                id="profile-first-name"
                                                type="text"
                                                autoComplete="given-name"
                                                required
                                                value={profileFirstName}
                                                onChange={(e) => {
                                                    setProfileFirstName(e.target.value);
                                                    if (profileError) setProfileError("");
                                                }}
                                                placeholder="First name"
                                                className="w-full rounded-md border border-q-border-input bg-white px-4 py-3 text-q-heading outline-none focus:border-q-accent"
                                            />
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="profile-last-name"
                                                className="mb-2 block text-sm font-semibold text-q-label"
                                            >
                                                Last name
                                            </label>
                                            <input
                                                id="profile-last-name"
                                                type="text"
                                                autoComplete="family-name"
                                                required
                                                value={profileLastName}
                                                onChange={(e) => {
                                                    setProfileLastName(e.target.value);
                                                    if (profileError) setProfileError("");
                                                }}
                                                placeholder="Last name"
                                                className="w-full rounded-md border border-q-border-input bg-white px-4 py-3 text-q-heading outline-none focus:border-q-accent"
                                            />
                                        </div>
                                    </div>
                                    {profileError ? <p className="text-sm text-red-600">{profileError}</p> : null}
                                    <div className="flex gap-3 rounded-lg border border-q-azure-200 bg-q-azure-50 px-4 py-3 text-sm leading-snug text-q-muted-text">
                                        <Info size={20} weight="fill" className="mt-0.5 shrink-0 text-q-accent" aria-hidden />
                                        <p>You can update this information later in your profile settings.</p>
                                    </div>
                                    <button
                                        type="submit"
                                        className="q-btn-primary w-full rounded-md px-4 py-3 text-sm"
                                    >
                                        Continue to Platform
                                    </button>
                                </form>
                            </div>
                        ) : showRegistrationCompleteStep ? (
                            <div className="rounded-xl border border-q-border p-8">
                                <h2 className="text-[30px] font-bold leading-tight text-q-heading">You&apos;re all set</h2>
                                <p className="mt-3 text-base text-q-muted-text">
                                    <span className="font-semibold text-q-heading">{confirmationEmail || "Your email"}</span>{" "}
                                    is verified. You can log in with your password anytime.
                                </p>
                                {message ? <p className="mt-3 text-sm text-q-success">{message}</p> : null}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedLoginRole("patient");
                                        setShowLoginModal(true);
                                    }}
                                    className="q-btn-primary mt-8 w-full rounded-md px-4 py-3 text-sm"
                                >
                                    Log in
                                </button>

                                <div className="my-5 h-px bg-q-border" />

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRegistrationCompleteStep(false);
                                        setShowCompleteProfileStep(false);
                                        setProfileFlowFromRegistration(false);
                                        setProfileFirstName("");
                                        setProfileLastName("");
                                        setProfileError("");
                                        setConfirmationEmail("");
                                        setEmail("");
                                        setPassword("");
                                        setMessage("");
                                        setApiError("");
                                    }}
                                    className="w-full text-sm font-semibold text-q-link"
                                >
                                    Create another account
                                </button>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-[30px] font-bold leading-tight text-q-heading">Create your free account</h1>

                                <div className="mt-6 grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        className="flex items-center justify-center gap-2 rounded-md border border-q-azure-200 bg-white px-3 py-2 text-sm font-semibold text-q-heading hover:bg-q-azure-50"
                                    >
                                        <GoogleIcon /> Google
                                    </button>
                                    <button
                                        type="button"
                                        className="flex items-center justify-center gap-2 rounded-md border border-q-azure-200 bg-white px-3 py-2 text-sm font-semibold text-q-heading hover:bg-q-azure-50"
                                    >
                                        <AppleIcon /> Apple
                                    </button>
                                    <button
                                        type="button"
                                        className="flex items-center justify-center gap-2 rounded-md border border-q-azure-200 bg-white px-3 py-2 text-sm font-semibold text-q-heading hover:bg-q-azure-50"
                                    >
                                        <MicrosoftIcon /> Microsoft
                                    </button>
                                </div>

                                <div className="my-4 flex items-center gap-2 text-q-muted-text">
                                    <div className="h-px flex-1 bg-q-border" />
                                    <span className="text-xs font-medium">or</span>
                                    <div className="h-px flex-1 bg-q-border" />
                                </div>

                                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                                    <div>
                                        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-q-label">
                                            Email address
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="email@domain.com"
                                            className="w-full rounded-md border border-q-border-input bg-white px-4 py-3 text-q-heading outline-none focus:border-q-accent"
                                        />
                                    </div>

                                    <div className="relative">
                                        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-q-label">
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
                                            className="w-full rounded-md border border-q-border-input bg-white px-4 py-3 pr-11 text-q-heading outline-none focus:border-q-accent"
                                        />
                                        <button
                                            type="button"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="absolute right-3 top-[38px] text-q-muted-text"
                                        >
                                            {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                                        </button>
                                        <PasswordValidationHints value={password} className="mt-2" />
                                        {passwordError ? <p className="mt-2 text-xs text-red-600">{passwordError}</p> : null}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="q-btn-primary w-full rounded-md px-4 py-3 text-sm disabled:opacity-60"
                                    >
                                        {loading ? "Please wait..." : "Continue"}
                                    </button>
                                </form>

                                <p className="mt-4 text-sm text-q-muted-text">
                                    By continuing, you confirm that you have read and agree to our{" "}
                                    <span className="font-semibold text-q-heading">terms and conditions</span> and{" "}
                                    our <span className="font-semibold text-q-heading">privacy policy</span>.
                                </p>

                                {apiError ? <p className="mt-3 text-sm text-red-600">{apiError}</p> : null}
                                {message ? <p className="mt-3 text-sm text-q-success">{message}</p> : null}
                            </>
                        )}
                    </section>

                    <section className="mt-8 overflow-hidden rounded-2xl lg:mt-0">
                        <AuthImageSlider />
                    </section>
                </div>
            </main>

            {showLoginModal ? (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <button
                        type="button"
                        className="absolute inset-0 border-0 bg-q-heading/30 backdrop-blur-xl backdrop-saturate-150"
                        aria-label="Close login"
                        onClick={() => {
                            setShowLoginModal(false);
                            resetLoginFormState();
                        }}
                    />

                    <div className="relative z-[1] w-full max-w-[430px] rounded-2xl border border-q-azure-200 bg-white p-4 shadow-[0_20px_50px_rgba(20,52,93,0.25)]">
                        <button
                            type="button"
                            aria-label="Close login modal"
                            onClick={() => {
                                setShowLoginModal(false);
                                resetLoginFormState();
                            }}
                            className="absolute right-4 top-4 text-q-muted-text hover:text-q-heading"
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
                                                            className="text-q-muted-text"
                                                            aria-label="Back"
                                                        >
                                                            <ArrowLeft size={20} />
                                                        </button>
                                                        <div className="flex items-center gap-2">
                                                            <Image src="/logo-symbol.png" alt="Qarevo symbol" width={20} height={20} />
                                                            <span className="text-[30px] font-semibold text-q-heading">Qarevo Health</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowLoginModal(false);
                                                                resetLoginFormState();
                                                            }}
                                                            className="text-q-muted-text"
                                                            aria-label="Close"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    </div>

                                                    <h3 className="text-[30px] font-bold leading-tight text-q-heading">Too many attempts</h3>
                                                    <div className="mt-2 text-[14px] leading-5 text-q-danger">
                                                        <p>You&apos;ve requested a password reset too many times.</p>
                                                        <p>This email is temporarily blocked.</p>
                                                    </div>

                                                    <p className="mt-5 text-[20px] font-semibold leading-tight text-q-heading">
                                                        You can request a new reset link in
                                                    </p>

                                                    <div className="mt-3 flex items-start gap-2">
                                                        <div className="w-full">
                                                            <div className="rounded-xl border border-q-border-strong bg-q-azure-50 px-4 py-3 text-center shadow-[0_2px_0_rgba(0,0,0,0.04)]">
                                                                <span className="text-[50px] font-semibold leading-none text-q-heading">
                                                                    {countdown.hours}
                                                                </span>
                                                            </div>
                                                            <p className="mt-2 text-center text-[20px] font-semibold text-q-heading">HOURS</p>
                                                        </div>
                                                        <span className="pt-4 text-[36px] font-semibold text-q-heading">:</span>
                                                        <div className="w-full">
                                                            <div className="rounded-xl border border-q-border-strong bg-q-azure-50 px-4 py-3 text-center shadow-[0_2px_0_rgba(0,0,0,0.04)]">
                                                                <span className="text-[50px] font-semibold leading-none text-q-heading">
                                                                    {countdown.minutes}
                                                                </span>
                                                            </div>
                                                            <p className="mt-2 text-center text-[20px] font-semibold text-q-heading">MINUTES</p>
                                                        </div>
                                                        <span className="pt-4 text-[30px] font-semibold text-q-heading">:</span>
                                                        <div className="w-full">
                                                            <div className="rounded-xl border border-q-border-strong bg-q-azure-50 px-4 py-3 text-center shadow-[0_2px_0_rgba(0,0,0,0.04)]">
                                                                <span className="text-[50px] font-semibold leading-none text-q-heading">
                                                                    {countdown.seconds}
                                                                </span>
                                                            </div>
                                                            <p className="mt-2 text-center text-[20px] font-semibold text-q-heading">SECONDS</p>
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
                                                className="text-q-muted-text"
                                                aria-label="Back"
                                            >
                                                <ArrowLeft size={20} />
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <Image src="/logo-symbol.png" alt="Qarevo symbol" width={20} height={20} />
                                                <span className="text-[25px] font-semibold text-q-heading">Qarevo Health</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowLoginModal(false);
                                                    resetLoginFormState();
                                                }}
                                                className="text-q-muted-text"
                                                aria-label="Close"
                                            >
                                                {/* <X size={20} /> */}
                                            </button>
                                        </div>

                                        <h3 className="text-[30px] font-bold leading-tight text-q-heading">Check your email</h3>
                                        <p className="mt-2 text-base text-q-muted-text">
                                            Check your inbox for password reset email from no-reply@email.qarevo-health.com
                                        </p>

                                        <div className="mt-4 space-y-2">
                                            <a
                                                href="https://mail.google.com"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block w-full rounded-md border border-q-azure-200 bg-white px-3 py-2 text-center text-sm font-semibold text-q-heading hover:bg-q-azure-50"
                                            >
                                                Open Gmail
                                            </a>
                                            <a
                                                href="https://outlook.live.com/mail/0/"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block w-full rounded-md border border-q-azure-200 bg-white px-3 py-2 text-center text-sm font-semibold text-q-heading hover:bg-q-azure-50"
                                            >
                                                Open Outlook
                                            </a>
                                        </div>

                                        <div className="my-4 flex items-center gap-2 text-q-muted-text">
                                            <div className="h-px flex-1 bg-q-border" />
                                            <span className="text-xs font-medium">or</span>
                                            <div className="h-px flex-1 bg-q-border" />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                void requestForgotPassword(resetEmail);
                                            }}
                                            className="w-full text-sm font-semibold text-q-link"
                                        >
                                            Resend email
                                        </button>

                                        {resetError ? <p className="mt-3 text-sm text-red-600">{resetError}</p> : null}
                                        {resetSuccess ? <p className="mt-3 text-sm text-q-success">{resetSuccess}</p> : null}
                                    </>
                                ) : (
                                    <>
                                        <div className="mb-3 flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => setShowResetPasswordStep(false)}
                                                className="text-q-muted-text"
                                                aria-label="Back"
                                            >
                                                <ArrowLeft size={20} />
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <Image src="/logo-symbol.png" alt="Qarevo symbol" width={20} height={20} />
                                                <span className="text-[28px] font-semibold text-q-heading">Qarevo Health</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowLoginModal(false);
                                                    resetLoginFormState();
                                                }}
                                                className="text-q-muted-text"
                                                aria-label="Close"
                                            >
                                                {/* <X size={20} /> */}
                                            </button>
                                        </div>

                                        <h3 className="text-[30px] font-bold leading-tight text-q-heading">
                                            First, enter your email address.
                                        </h3>
                                        <p className="mt-2 text-base text-q-muted-text">
                                            We will send you a message with a link through which you can set your new password.
                                        </p>

                                        <form className="mt-4" onSubmit={handleForgotPasswordSubmit}>
                                            <label htmlFor="reset-email" className="mb-2 block text-sm font-semibold text-q-label">
                                                Your email
                                            </label>
                                            <input
                                                id="reset-email"
                                                type="email"
                                                required
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                placeholder="email@domain.com"
                                                className="w-full rounded-md border border-q-border-input bg-white px-4 py-3 text-q-heading outline-none focus:border-q-accent"
                                            />

                                            {resetError ? <p className="mt-3 text-sm text-red-600">{resetError}</p> : null}
                                            {resetSuccess ? <p className="mt-3 text-sm text-q-success">{resetSuccess}</p> : null}

                                            <button
                                                type="submit"
                                                disabled={resetLoading}
                                                className="q-btn-primary mt-4 w-full rounded-md px-4 py-3 text-sm disabled:opacity-60"
                                            >
                                                {resetLoading ? "Please wait..." : "Reset password"}
                                            </button>
                                        </form>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <h3 className="text-[30px] font-bold leading-tight text-q-heading">Log in to your account</h3>

                                <div className="mt-4 space-y-2">
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-center gap-2 rounded-md border border-q-azure-200 bg-white px-3 py-2 text-sm font-semibold text-q-heading hover:bg-q-azure-50"
                                    >
                                        <GoogleIcon /> Continue with Google
                                    </button>
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-center gap-2 rounded-md border border-q-azure-200 bg-white px-3 py-2 text-sm font-semibold text-q-heading hover:bg-q-azure-50"
                                    >
                                        <AppleIcon /> Continue with Apple
                                    </button>
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-center gap-2 rounded-md border border-q-azure-200 bg-white px-3 py-2 text-sm font-semibold text-q-heading hover:bg-q-azure-50"
                                    >
                                        <MicrosoftIcon /> Continue with Microsoft
                                    </button>
                                </div>

                                <div className="my-4 flex items-center gap-2 text-q-muted-text">
                                    <div className="h-px flex-1 bg-q-border" />
                                    <span className="text-xs font-medium">or</span>
                                    <div className="h-px flex-1 bg-q-border" />
                                </div>

                                <form onSubmit={handleLoginSubmit}>
                                    <div>
                                        <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-q-label">
                                            Email address
                                        </label>
                                        <input
                                            id="login-email"
                                            type="email"
                                            required
                                            value={loginEmail}
                                            onChange={(e) => setLoginEmail(e.target.value)}
                                            placeholder="email@domain.com"
                                            className="w-full rounded-md border border-q-border-input bg-white px-4 py-3 text-q-heading outline-none focus:border-q-accent"
                                        />
                                    </div>

                                    <div className="relative mt-3">
                                        <div className="mb-2 flex items-center justify-between">
                                            <label htmlFor="login-password" className="text-sm font-semibold text-q-label">
                                                Password
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowResetPasswordStep(true)}
                                                className="text-sm font-semibold text-q-link"
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
                                            className="w-full rounded-md border border-q-border-input bg-white px-4 py-3 pr-11 text-q-heading outline-none focus:border-q-accent"
                                        />
                                        <button
                                            type="button"
                                            aria-label={showLoginPassword ? "Hide password" : "Show password"}
                                            onClick={() => setShowLoginPassword((prev) => !prev)}
                                            className="absolute right-3 top-[38px] text-q-muted-text"
                                        >
                                            {showLoginPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>

                                    {loginError ? <p className="mt-3 text-sm text-red-600">{loginError}</p> : null}
                                    {loginSuccess ? <p className="mt-3 text-sm text-q-success">{loginSuccess}</p> : null}

                                    <button
                                        type="submit"
                                        disabled={loginLoading}
                                        className="q-btn-primary mt-4 w-full rounded-md px-4 py-3 text-sm disabled:opacity-60"
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

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />
            <path
                fill="#FF3D00"
                d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
            />
            <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />
            <path
                fill="#1976D2"
                d="M43.611 20.083 43.595 20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
        </svg>
    );
}

function AppleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill="#000"
                d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.736.876-1.949 1.555-2.886 1.555-.107 0-.214-.011-.293-.022-.014-.054-.04-.215-.04-.395 0-1.106.523-2.198 1.137-2.892.787-.913 2.108-1.583 3.243-1.629.014.097.016.21.016.303zm4.245 17.18c-.652 1.527-1.514 3.15-2.97 3.15-.85.013-1.42-.314-2.27-.314-.93 0-1.55.314-2.42.314-1.42 0-2.42-1.41-3.13-2.93C8.16 15.6 7 11.91 7 11.91c0-3.6 2.34-5.5 4.66-5.5.96 0 1.79.31 2.4.31.59 0 1.5-.32 2.6-.32 1.39 0 2.94.83 3.84 2.18-3.39 1.86-2.83 6.71.51 8.9-.27.81-.6 1.6-.99 2.43z"
            />
        </svg>
    );
}

function MicrosoftIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#F25022" d="M1 1h10v10H1z" />
            <path fill="#7FBA00" d="M13 1h10v10H13z" />
            <path fill="#00A4EF" d="M1 13h10v10H1z" />
            <path fill="#FFB900" d="M13 13h10v10H13z" />
        </svg>
    );
}
