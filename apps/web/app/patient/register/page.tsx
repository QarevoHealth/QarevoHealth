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
<<<<<<< HEAD
                    setResendCooldownSeconds(0);
=======
                    setResendCooldownSeconds(60);
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
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
<<<<<<< HEAD
                    setResendCooldownSeconds(0);
=======
                    setResendCooldownSeconds(60);
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
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
<<<<<<< HEAD
                        : "Email verified. Complete your profile to finish signing up."
                );
                setProfileFlowFromRegistration(true);
                setProfileFirstName("");
                setProfileLastName("");
                setProfileError("");
                setShowCompleteProfileStep(true);
=======
                        : "Email verified. Your account is ready."
                );
                setShowRegistrationCompleteStep(true);
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                return;
            }

            setShowLoginEmailVerificationStep(false);
<<<<<<< HEAD
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
=======
            setShowLoginModal(true);
            setLoginEmailVerificationCode(Array(6).fill(""));
            setLoginSuccess(
                typeof data.message === "string" ? data.message : "Email verified. You can log in now."
            );
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
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

<<<<<<< HEAD
    useEffect(() => {
        if (!showLoginEmailVerificationStep) return;
        if (resendCooldownSeconds > 0) return;
        setShowVerificationResendSuccess(false);
    }, [showLoginEmailVerificationStep, resendCooldownSeconds]);

=======
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
    async function resendVerificationEmail() {
        if (!loginEmailForVerification) {
            setLoginError("Missing email for verification.");
            return;
        }
        if (resendCooldownSeconds > 0 || isResendingVerificationEmail) return;

        setIsResendingVerificationEmail(true);
        setLoginError("");
<<<<<<< HEAD
        setShowVerificationResendSuccess(false);
=======
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f

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
<<<<<<< HEAD
            setLoginSuccess("");
            setShowVerificationResendSuccess(true);
            setResendCooldownSeconds(VERIFICATION_RESEND_COOLDOWN_SEC);
=======
            setResendCooldownSeconds(60);
            setLoginSuccess(
                typeof data.message === "string" ? data.message : "Verification email sent again."
            );
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
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
<<<<<<< HEAD
                    : typeof data.detail === "string"
                      ? data.detail
                      : "";
=======
                    : data.detail;
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
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

<<<<<<< HEAD
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
        <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-q-azure-50 via-q-azure-100 to-q-azure-50">
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

            <main className="relative z-10 mx-auto mt-10 w-[92%] max-w-6xl rounded-2xl border border-q-azure-200 bg-white p-6 shadow-sm sm:mt-14">
                <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-q-azure-200 bg-white p-8 shadow-sm lg:grid-cols-2">
                    <section className="pr-0 lg:pr-8">
                        {showLoginEmailVerificationStep ? (
                            loginVerificationLockedDetail ? (
                                <div className="rounded-xl border border-q-border p-8">
                                    <h2 className="text-[30px] font-bold leading-tight text-q-heading">
                                        Too many attempts
                                    </h2>
                                    <div className="mt-4 flex gap-3 rounded-lg bg-q-danger-bg px-4 py-3 text-sm leading-snug text-q-danger">
=======
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
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                        <Info size={22} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
                                        <span>
                                            {loginVerificationLockedDetail.message ??
                                                "This email has been temporarily blocked due to multiple verification attempts. Please try again later."}
                                        </span>
                                    </div>
<<<<<<< HEAD
                                    <p className="mt-8 text-left text-base font-semibold text-q-heading sm:text-lg">
=======
                                    <p className="mt-8 text-lg font-semibold text-[#16355e] md:text-xl">
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                        You can request a new code in
                                    </p>
                                    {(() => {
                                        const countdown = formatCountdown(loginVerificationRetryAfterSeconds);
                                        return (
<<<<<<< HEAD
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
=======
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
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                                        SECONDS
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            ) : (
<<<<<<< HEAD
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
=======
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
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                <div className="mt-2 flex items-center gap-2">
                                    {loginEmailVerificationCode.slice(0, 3).map((char, idx) => (
                                        <input
                                            key={idx}
                                            inputMode="numeric"
                                            aria-label={`Verification code digit ${idx + 1}`}
                                            ref={(el) => {
                                                verificationCodeInputRefs.current[idx] = el;
                                            }}
<<<<<<< HEAD
                                            className="h-12 w-12 rounded-md border border-q-border-strong bg-white text-center text-lg font-semibold text-q-heading outline-none transition-[border-color,background-color,box-shadow] hover:border-q-accent hover:bg-q-azure-50 hover:shadow-sm focus:border-q-accent focus:ring-2 focus:ring-q-accent/20"
=======
                                            className="h-12 w-12 rounded-md border border-[#c8d7e8] bg-[#f7fbff] text-center text-lg font-semibold text-[#1f3556] outline-none focus:border-[#6fa9d5]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
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
<<<<<<< HEAD
                                    <span className="px-1 text-q-muted-text">-</span>
=======
                                    <span className="px-1 text-[#97a8bf]">-</span>
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                    {loginEmailVerificationCode.slice(3, 6).map((char, idx) => (
                                        <input
                                            key={idx + 3}
                                            inputMode="numeric"
                                            aria-label={`Verification code digit ${idx + 4}`}
                                            ref={(el) => {
                                                verificationCodeInputRefs.current[idx + 3] = el;
                                            }}
<<<<<<< HEAD
                                            className="h-12 w-12 rounded-md border border-q-border-strong bg-white text-center text-lg font-semibold text-q-heading outline-none transition-[border-color,background-color,box-shadow] hover:border-q-accent hover:bg-q-azure-50 hover:shadow-sm focus:border-q-accent focus:ring-2 focus:ring-q-accent/20"
=======
                                            className="h-12 w-12 rounded-md border border-[#c8d7e8] bg-[#f7fbff] text-center text-lg font-semibold text-[#1f3556] outline-none focus:border-[#6fa9d5]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
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

<<<<<<< HEAD
                                <p className="mt-4 text-sm text-q-muted-text">
=======
                                <p className="mt-4 text-sm text-[#6f819a]">
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                    If you don&apos;t see the email, check your spam or junk folder.
                                </p>

                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <a
                                        href="https://mail.google.com"
                                        target="_blank"
                                        rel="noreferrer"
<<<<<<< HEAD
                                        className="block w-full rounded-md border border-q-azure-200 bg-white px-3 py-2 text-center text-sm font-semibold text-q-heading hover:bg-q-azure-50"
=======
                                        className="block w-full rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-center text-sm font-semibold text-[#2b466b]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                    >
                                        Open Gmail
                                    </a>
                                    <a
                                        href="https://outlook.live.com/mail/0/"
                                        target="_blank"
                                        rel="noreferrer"
<<<<<<< HEAD
                                        className="block w-full rounded-md border border-q-azure-200 bg-white px-3 py-2 text-center text-sm font-semibold text-q-heading hover:bg-q-azure-50"
=======
                                        className="block w-full rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-center text-sm font-semibold text-[#2b466b]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                    >
                                        Open Outlook
                                    </a>
                                </div>

<<<<<<< HEAD
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
=======
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
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedLoginRole("patient");
                                        setShowLoginModal(true);
                                    }}
<<<<<<< HEAD
                                    className="q-btn-primary mt-8 w-full rounded-md px-4 py-3 text-sm"
=======
                                    className="mt-8 w-full rounded-md bg-[#14528f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f467b]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                >
                                    Log in
                                </button>

<<<<<<< HEAD
                                <div className="my-5 h-px bg-q-border" />
=======
                                <div className="my-5 h-px bg-[#e2e8f0]" />
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRegistrationCompleteStep(false);
<<<<<<< HEAD
                                        setShowCompleteProfileStep(false);
                                        setProfileFlowFromRegistration(false);
                                        setProfileFirstName("");
                                        setProfileLastName("");
                                        setProfileError("");
=======
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                        setConfirmationEmail("");
                                        setEmail("");
                                        setPassword("");
                                        setMessage("");
                                        setApiError("");
                                    }}
<<<<<<< HEAD
                                    className="w-full text-sm font-semibold text-q-link"
=======
                                    className="w-full text-sm font-semibold text-[#2f7dbd]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                >
                                    Create another account
                                </button>
                            </div>
                        ) : (
                            <>
<<<<<<< HEAD
                                <h1 className="text-[30px] font-bold leading-tight text-q-heading">Create your free account</h1>
=======
                                <h1 className="text-5xl font-bold text-[#16355e]">Create your free account</h1>
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f

                                <div className="mt-6 grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
<<<<<<< HEAD
                                        className="rounded-md border border-q-azure-200 bg-white px-3 py-2 text-sm font-semibold text-q-heading hover:bg-q-azure-50"
=======
                                        className="rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-sm font-semibold text-[#2b466b]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                    >
                                        Google
                                    </button>
                                    <button
                                        type="button"
<<<<<<< HEAD
                                        className="rounded-md border border-q-azure-200 bg-white px-3 py-2 text-sm font-semibold text-q-heading hover:bg-q-azure-50"
=======
                                        className="rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-sm font-semibold text-[#2b466b]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                    >
                                        Apple
                                    </button>
                                    <button
                                        type="button"
<<<<<<< HEAD
                                        className="rounded-md border border-q-azure-200 bg-white px-3 py-2 text-sm font-semibold text-q-heading hover:bg-q-azure-50"
=======
                                        className="rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-sm font-semibold text-[#2b466b]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                    >
                                        Microsoft
                                    </button>
                                </div>

<<<<<<< HEAD
                                <div className="my-4 flex items-center gap-2 text-q-muted-text">
                                    <div className="h-px flex-1 bg-q-border" />
                                    <span className="text-xs font-medium">or</span>
                                    <div className="h-px flex-1 bg-q-border" />
=======
                                <div className="my-4 flex items-center gap-2 text-[#9aabc0]">
                                    <div className="h-px flex-1 bg-[#dbe4ef]" />
                                    <span className="text-xs font-medium">or</span>
                                    <div className="h-px flex-1 bg-[#dbe4ef]" />
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                </div>

                                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                                    <div>
<<<<<<< HEAD
                                        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-q-label">
=======
                                        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#405676]">
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                            Email address
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="email@domain.com"
<<<<<<< HEAD
                                            className="w-full rounded-md border border-q-border-input bg-white px-4 py-3 text-q-heading outline-none focus:border-q-accent"
=======
                                            className="w-full rounded-md border border-[#d6deea] px-4 py-3 text-[#1f3556] outline-none focus:border-[#6fa9d5]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                        />
                                    </div>

                                    <div className="relative">
<<<<<<< HEAD
                                        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-q-label">
=======
                                        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#405676]">
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
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
<<<<<<< HEAD
                                            className="w-full rounded-md border border-q-border-input bg-white px-4 py-3 pr-11 text-q-heading outline-none focus:border-q-accent"
=======
                                            className="w-full rounded-md border border-[#d6deea] px-4 py-3 pr-11 text-[#1f3556] outline-none focus:border-[#6fa9d5]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                        />
                                        <button
                                            type="button"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            onClick={() => setShowPassword((prev) => !prev)}
<<<<<<< HEAD
                                            className="absolute right-3 top-[38px] text-q-muted-text"
                                        >
                                            {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                                        </button>
                                        <PasswordValidationHints value={password} className="mt-2" />
=======
                                            className="absolute right-3 top-[38px] text-[#7b95b4]"
                                        >
                                            {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                                        </button>
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                        {passwordError ? <p className="mt-2 text-xs text-red-600">{passwordError}</p> : null}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
<<<<<<< HEAD
                                        className="q-btn-primary w-full rounded-md px-4 py-3 text-sm disabled:opacity-60"
=======
                                        className="w-full rounded-md bg-[#14528f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f467b] disabled:opacity-60"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                    >
                                        {loading ? "Please wait..." : "Continue"}
                                    </button>
                                </form>

<<<<<<< HEAD
                                <p className="mt-4 text-sm text-q-muted-text">
                                    By continuing, you confirm that you have read and agree to our{" "}
                                    <span className="font-semibold text-q-heading">terms and conditions</span> and{" "}
                                    our <span className="font-semibold text-q-heading">privacy policy</span>.
                                </p>

                                {apiError ? <p className="mt-3 text-sm text-red-600">{apiError}</p> : null}
                                {message ? <p className="mt-3 text-sm text-q-success">{message}</p> : null}
=======
                                <p className="mt-4 text-sm text-[#6d7e95]">
                                    By continuing, you confirm that you have read and agree to our{" "}
                                    <span className="font-semibold text-[#16355e]">terms and conditions</span> and{" "}
                                    our <span className="font-semibold text-[#16355e]">privacy policy</span>.
                                </p>

                                {apiError ? <p className="mt-3 text-sm text-red-600">{apiError}</p> : null}
                                {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                            </>
                        )}
                    </section>

                    <section className="mt-8 overflow-hidden rounded-2xl lg:mt-0">
                        <AuthImageSlider />
                    </section>
                </div>
            </main>

            {showLoginModal ? (
<<<<<<< HEAD
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
=======
                <div className="absolute inset-0 z-40 flex items-center justify-center p-4">
                    <div className="absolute inset-0 backdrop-blur-[8px]" />
                    <div className="absolute inset-0 bg-[#6f8fb7]/30" />

                    <div className="relative w-full max-w-[430px] rounded-2xl border border-[#dce4ef] bg-white p-4 shadow-[0_20px_50px_rgba(20,52,93,0.25)]">
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                        <button
                            type="button"
                            aria-label="Close login modal"
                            onClick={() => {
                                setShowLoginModal(false);
                                resetLoginFormState();
                            }}
<<<<<<< HEAD
                            className="absolute right-4 top-4 text-q-muted-text hover:text-q-heading"
=======
                            className="absolute right-4 top-4 text-[#8a99ae]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
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
<<<<<<< HEAD
                                                            className="text-q-muted-text"
=======
                                                            className="text-[#7f8da3]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                                            aria-label="Back"
                                                        >
                                                            <ArrowLeft size={20} />
                                                        </button>
                                                        <div className="flex items-center gap-2">
                                                            <Image src="/logo-symbol.png" alt="Qarevo symbol" width={20} height={20} />
<<<<<<< HEAD
                                                            <span className="text-[30px] font-semibold text-q-heading">Qarevo Health</span>
=======
                                                            <span className="text-[32px] font-semibold text-[#1f3556]">Qarevo Health</span>
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowLoginModal(false);
                                                                resetLoginFormState();
                                                            }}
<<<<<<< HEAD
                                                            className="text-q-muted-text"
=======
                                                            className="text-[#8a99ae]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                                            aria-label="Close"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    </div>

<<<<<<< HEAD
                                                    <h3 className="text-[30px] font-bold leading-tight text-q-heading">Too many attempts</h3>
                                                    <div className="mt-2 text-[14px] leading-5 text-q-danger">
=======
                                                    <h3 className="text-[44px] font-bold leading-tight text-[#1f3556]">Too many attempts</h3>
                                                    <div className="mt-2 text-[14px] leading-5 text-[#cf5f5f]">
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                                        <p>You&apos;ve requested a password reset too many times.</p>
                                                        <p>This email is temporarily blocked.</p>
                                                    </div>

<<<<<<< HEAD
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
=======
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
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
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
<<<<<<< HEAD
                                                className="text-q-muted-text"
=======
                                                className="text-[#7f8da3]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                                aria-label="Back"
                                            >
                                                <ArrowLeft size={20} />
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <Image src="/logo-symbol.png" alt="Qarevo symbol" width={20} height={20} />
<<<<<<< HEAD
                                                <span className="text-[25px] font-semibold text-q-heading">Qarevo Health</span>
=======
                                                <span className="text-[32px] font-semibold text-[#1f3556]">Qarevo Health</span>
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowLoginModal(false);
                                                    resetLoginFormState();
                                                }}
<<<<<<< HEAD
                                                className="text-q-muted-text"
                                                aria-label="Close"
                                            >
                                                {/* <X size={20} /> */}
                                            </button>
                                        </div>

                                        <h3 className="text-[30px] font-bold leading-tight text-q-heading">Check your email</h3>
                                        <p className="mt-2 text-base text-q-muted-text">
=======
                                                className="text-[#8a99ae]"
                                                aria-label="Close"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <h3 className="text-[40px] font-bold leading-tight text-[#1f3556]">Check your email</h3>
                                        <p className="mt-2 text-base text-[#6f819a]">
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                            Check your inbox for password reset email from no-reply@email.qarevo-health.com
                                        </p>

                                        <div className="mt-4 space-y-2">
                                            <a
                                                href="https://mail.google.com"
                                                target="_blank"
                                                rel="noreferrer"
<<<<<<< HEAD
                                                className="block w-full rounded-md border border-q-azure-200 bg-white px-3 py-2 text-center text-sm font-semibold text-q-heading hover:bg-q-azure-50"
=======
                                                className="block w-full rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-center text-sm font-semibold text-[#2b466b]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                            >
                                                Open Gmail
                                            </a>
                                            <a
                                                href="https://outlook.live.com/mail/0/"
                                                target="_blank"
                                                rel="noreferrer"
<<<<<<< HEAD
                                                className="block w-full rounded-md border border-q-azure-200 bg-white px-3 py-2 text-center text-sm font-semibold text-q-heading hover:bg-q-azure-50"
=======
                                                className="block w-full rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-center text-sm font-semibold text-[#2b466b]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                            >
                                                Open Outlook
                                            </a>
                                        </div>

<<<<<<< HEAD
                                        <div className="my-4 flex items-center gap-2 text-q-muted-text">
                                            <div className="h-px flex-1 bg-q-border" />
                                            <span className="text-xs font-medium">or</span>
                                            <div className="h-px flex-1 bg-q-border" />
=======
                                        <div className="my-4 flex items-center gap-2 text-[#9aabc0]">
                                            <div className="h-px flex-1 bg-[#dbe4ef]" />
                                            <span className="text-xs font-medium">or</span>
                                            <div className="h-px flex-1 bg-[#dbe4ef]" />
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                void requestForgotPassword(resetEmail);
                                            }}
<<<<<<< HEAD
                                            className="w-full text-sm font-semibold text-q-link"
=======
                                            className="w-full text-sm font-semibold text-[#2f7dbd]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                        >
                                            Resend email
                                        </button>

                                        {resetError ? <p className="mt-3 text-sm text-red-600">{resetError}</p> : null}
<<<<<<< HEAD
                                        {resetSuccess ? <p className="mt-3 text-sm text-q-success">{resetSuccess}</p> : null}
=======
                                        {resetSuccess ? <p className="mt-3 text-sm text-emerald-700">{resetSuccess}</p> : null}
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                    </>
                                ) : (
                                    <>
                                        <div className="mb-3 flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => setShowResetPasswordStep(false)}
<<<<<<< HEAD
                                                className="text-q-muted-text"
=======
                                                className="text-[#7f8da3]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                                aria-label="Back"
                                            >
                                                <ArrowLeft size={20} />
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <Image src="/logo-symbol.png" alt="Qarevo symbol" width={20} height={20} />
<<<<<<< HEAD
                                                <span className="text-[28px] font-semibold text-q-heading">Qarevo Health</span>
=======
                                                <span className="text-[32px] font-semibold text-[#1f3556]">Qarevo Health</span>
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowLoginModal(false);
                                                    resetLoginFormState();
                                                }}
<<<<<<< HEAD
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
=======
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
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                            We will send you a message with a link through which you can set your new password.
                                        </p>

                                        <form className="mt-4" onSubmit={handleForgotPasswordSubmit}>
<<<<<<< HEAD
                                            <label htmlFor="reset-email" className="mb-2 block text-sm font-semibold text-q-label">
=======
                                            <label htmlFor="reset-email" className="mb-2 block text-sm font-semibold text-[#405676]">
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                                Your email
                                            </label>
                                            <input
                                                id="reset-email"
                                                type="email"
                                                required
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                placeholder="email@domain.com"
<<<<<<< HEAD
                                                className="w-full rounded-md border border-q-border-input bg-white px-4 py-3 text-q-heading outline-none focus:border-q-accent"
                                            />

                                            {resetError ? <p className="mt-3 text-sm text-red-600">{resetError}</p> : null}
                                            {resetSuccess ? <p className="mt-3 text-sm text-q-success">{resetSuccess}</p> : null}
=======
                                                className="w-full rounded-md border border-[#d6deea] px-4 py-3 text-[#1f3556] outline-none focus:border-[#6fa9d5]"
                                            />

                                            {resetError ? <p className="mt-3 text-sm text-red-600">{resetError}</p> : null}
                                            {resetSuccess ? <p className="mt-3 text-sm text-emerald-700">{resetSuccess}</p> : null}
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f

                                            <button
                                                type="submit"
                                                disabled={resetLoading}
<<<<<<< HEAD
                                                className="q-btn-primary mt-4 w-full rounded-md px-4 py-3 text-sm disabled:opacity-60"
=======
                                                className="mt-4 w-full rounded-md bg-[#14528f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f467b] disabled:opacity-60"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                            >
                                                {resetLoading ? "Please wait..." : "Reset password"}
                                            </button>
                                        </form>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
<<<<<<< HEAD
                                <h3 className="text-[30px] font-bold leading-tight text-q-heading">Log in to your account</h3>
=======
                                <h3 className="text-[32px] font-bold text-[#1f3556]">Log in to your account</h3>
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f

                                <div className="mt-4 space-y-2">
                                    <button
                                        type="button"
<<<<<<< HEAD
                                        className="w-full rounded-md border border-q-azure-200 bg-white px-3 py-2 text-sm font-semibold text-q-heading hover:bg-q-azure-50"
=======
                                        className="w-full rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-sm font-semibold text-[#2b466b]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                    >
                                        Continue with Google
                                    </button>
                                    <button
                                        type="button"
<<<<<<< HEAD
                                        className="w-full rounded-md border border-q-azure-200 bg-white px-3 py-2 text-sm font-semibold text-q-heading hover:bg-q-azure-50"
=======
                                        className="w-full rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-sm font-semibold text-[#2b466b]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                    >
                                        Continue with Apple
                                    </button>
                                    <button
                                        type="button"
<<<<<<< HEAD
                                        className="w-full rounded-md border border-q-azure-200 bg-white px-3 py-2 text-sm font-semibold text-q-heading hover:bg-q-azure-50"
=======
                                        className="w-full rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-sm font-semibold text-[#2b466b]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                    >
                                        Continue with Microsoft
                                    </button>
                                </div>

<<<<<<< HEAD
                                <div className="my-4 flex items-center gap-2 text-q-muted-text">
                                    <div className="h-px flex-1 bg-q-border" />
                                    <span className="text-xs font-medium">or</span>
                                    <div className="h-px flex-1 bg-q-border" />
=======
                                <div className="my-4 flex items-center gap-2 text-[#9aabc0]">
                                    <div className="h-px flex-1 bg-[#dbe4ef]" />
                                    <span className="text-xs font-medium">or</span>
                                    <div className="h-px flex-1 bg-[#dbe4ef]" />
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                </div>

                                <form onSubmit={handleLoginSubmit}>
                                    <div>
<<<<<<< HEAD
                                        <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-q-label">
=======
                                        <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-[#405676]">
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                            Email address
                                        </label>
                                        <input
                                            id="login-email"
                                            type="email"
                                            required
                                            value={loginEmail}
                                            onChange={(e) => setLoginEmail(e.target.value)}
                                            placeholder="email@domain.com"
<<<<<<< HEAD
                                            className="w-full rounded-md border border-q-border-input bg-white px-4 py-3 text-q-heading outline-none focus:border-q-accent"
=======
                                            className="w-full rounded-md border border-[#d6deea] px-4 py-3 text-[#1f3556] outline-none focus:border-[#6fa9d5]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                        />
                                    </div>

                                    <div className="relative mt-3">
                                        <div className="mb-2 flex items-center justify-between">
<<<<<<< HEAD
                                            <label htmlFor="login-password" className="text-sm font-semibold text-q-label">
=======
                                            <label htmlFor="login-password" className="text-sm font-semibold text-[#405676]">
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                                Password
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowResetPasswordStep(true)}
<<<<<<< HEAD
                                                className="text-sm font-semibold text-q-link"
=======
                                                className="text-sm font-semibold text-[#2f7dbd]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
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
<<<<<<< HEAD
                                            className="w-full rounded-md border border-q-border-input bg-white px-4 py-3 pr-11 text-q-heading outline-none focus:border-q-accent"
=======
                                            className="w-full rounded-md border border-[#d6deea] px-4 py-3 pr-11 text-[#1f3556] outline-none focus:border-[#6fa9d5]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                        />
                                        <button
                                            type="button"
                                            aria-label={showLoginPassword ? "Hide password" : "Show password"}
                                            onClick={() => setShowLoginPassword((prev) => !prev)}
<<<<<<< HEAD
                                            className="absolute right-3 top-[38px] text-q-muted-text"
=======
                                            className="absolute right-3 top-[38px] text-[#7b95b4]"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
                                        >
                                            {showLoginPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>

                                    {loginError ? <p className="mt-3 text-sm text-red-600">{loginError}</p> : null}
<<<<<<< HEAD
                                    {loginSuccess ? <p className="mt-3 text-sm text-q-success">{loginSuccess}</p> : null}
=======
                                    {loginSuccess ? <p className="mt-3 text-sm text-emerald-700">{loginSuccess}</p> : null}
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f

                                    <button
                                        type="submit"
                                        disabled={loginLoading}
<<<<<<< HEAD
                                        className="q-btn-primary mt-4 w-full rounded-md px-4 py-3 text-sm disabled:opacity-60"
=======
                                        className="mt-4 w-full rounded-md bg-[#14528f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f467b] disabled:opacity-60"
>>>>>>> 2f51c0c5323b9bc808a0f76e672c9df1c294c13f
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
