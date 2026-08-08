"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeSlash } from "phosphor-react";
import { DoctorEmailVerification } from "@/components/doctor/DoctorEmailVerification";
import { DoctorMfaLockScreen } from "@/components/doctor/DoctorMfaLockScreen";
import { DoctorMfaOtpModal } from "@/components/doctor/DoctorMfaOtpModal";
import { MailProviderIcon } from "@/components/MailProviderIcon";
import { DoctorMfaSecurityHub } from "@/components/doctor/DoctorMfaSecurityHub";
import {
    maskEmailForDisplay,
    maskPhoneForDisplay,
    pickLoginEmailForMask,
    pickLoginPhoneForMask,
    pickMfaPhoneForVerify,
} from "@/lib/auth/mask-contact";
import { parseMfaLockPayload, type MfaLockInfo, type MfaOtpResult } from "@/lib/auth/mfa-lock";

const TEMP_TOKEN_KEY = "qarevo_doctor_temp_token";
const ACCESS_TOKEN_KEY = "qarevo_access_token";
const REFRESH_TOKEN_KEY = "qarevo_refresh_token";

type DoctorLoginFormProps = {
    variant?: "page" | "modal";
    onRequestClose?: () => void;
};

type MfaStep = "credentials" | "account_email_verify" | "pre_mfa_blocked" | "mfa_hub";

type ActiveMfaModal = null | "email" | "phone";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PasswordResetLockDetail = {
    error_code: string;
    message?: string;
    locked_until?: string;
    retry_after_seconds?: number;
    lock_duration_seconds?: number;
    attempts_limit?: number;
};

function retrySecondsFromResetPayload(data: Record<string, unknown>): number {
    let retry = typeof data.retry_after_seconds === "number" ? data.retry_after_seconds : 0;
    if (retry <= 0 && typeof data.locked_until === "string") {
        const end = new Date(data.locked_until).getTime();
        if (!Number.isNaN(end)) {
            retry = Math.max(0, Math.ceil((end - Date.now()) / 1000));
        }
    }
    return retry;
}

function formatResetCountdown(seconds: number) {
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

function parseEmailVerificationPending(
    data: JsonPayload,
    identifierTrimmed: string
): { email: string; message?: string } | null {
    const detailRaw = data.detail;
    const detailObj =
        detailRaw && typeof detailRaw === "object" && !Array.isArray(detailRaw)
            ? (detailRaw as Record<string, unknown>)
            : null;
    if (!detailObj) return null;
    const pending =
        detailObj.error_code === "EMAIL_VERIFICATION_PENDING" || detailObj.status === "EMAIL_VERIFICATION_PENDING";
    if (!pending) return null;
    const fromApi = detailObj.email;
    const email =
        typeof fromApi === "string" && fromApi.trim()
            ? fromApi.trim()
            : EMAIL_RE.test(identifierTrimmed)
              ? identifierTrimmed
              : "";
    if (!email) return null;
    const message = typeof detailObj.message === "string" ? detailObj.message : undefined;
    return { email, message };
}

type JsonPayload = Record<string, unknown>;

function messageFromPayload(data: JsonPayload): string {
    const detailText = Array.isArray(data.detail)
        ? data.detail
              .map((item: { msg?: string }) => item.msg)
              .filter(Boolean)
              .join(", ")
        : typeof data.detail === "string"
          ? data.detail
          : "";
    const msg = typeof data.message === "string" ? data.message : "";
    const err = typeof data.error === "string" ? data.error : "";
    return err || msg || detailText || "Request failed";
}

function readSessionTempToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(TEMP_TOKEN_KEY);
}

const ACCOUNT_EMAIL_RESEND_GATE_SEC = 30;

export function DoctorLoginForm({ variant = "page", onRequestClose }: DoctorLoginFormProps) {
    const router = useRouter();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mfaStep, setMfaStep] = useState<MfaStep>("credentials");
    const [accountVerifyEmail, setAccountVerifyEmail] = useState("");
    const [accountVerifyMessage, setAccountVerifyMessage] = useState<string | undefined>();
    const [mfaSessionMeta, setMfaSessionMeta] = useState<{
        expiresInSeconds?: number;
        emailVerified?: boolean;
        phoneVerified?: boolean;
    } | null>(null);
    const [mfaMaskedEmailDisplay, setMfaMaskedEmailDisplay] = useState("");
    const [mfaMaskedPhoneDisplay, setMfaMaskedPhoneDisplay] = useState("");
    const [mfaEmailChallengeDone, setMfaEmailChallengeDone] = useState(false);
    const [mfaPhoneChallengeDone, setMfaPhoneChallengeDone] = useState(false);
    const [activeMfaModal, setActiveMfaModal] = useState<ActiveMfaModal>(null);
    const [mfaVerifyEmail, setMfaVerifyEmail] = useState("");
    const [mfaVerifyCountryCode, setMfaVerifyCountryCode] = useState("");
    const [mfaVerifyPhoneNational, setMfaVerifyPhoneNational] = useState("");
    const mfaFinalizeOnce = useRef(false);
    const [preMfaGate, setPreMfaGate] = useState<null | { emailOk: boolean; phoneOk: boolean }>(null);
    const [mfaLockScreen, setMfaLockScreen] = useState<MfaLockInfo | null>(null);
    const [showResetPasswordStep, setShowResetPasswordStep] = useState(false);
    const [showResetPasswordEmailSentStep, setShowResetPasswordEmailSentStep] = useState(false);
    const [showResetPasswordLockedStep, setShowResetPasswordLockedStep] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState("");
    const [resetSuccess, setResetSuccess] = useState("");
    const [resetLockedDetail, setResetLockedDetail] = useState<PasswordResetLockDetail | null>(null);
    const [resetRetryAfterSeconds, setResetRetryAfterSeconds] = useState(0);

    useEffect(() => {
        if (!showResetPasswordLockedStep || resetRetryAfterSeconds <= 0) return;
        const t = setInterval(() => {
            setResetRetryAfterSeconds((p) => (p > 0 ? p - 1 : 0));
        }, 1000);
        return () => clearInterval(t);
    }, [showResetPasswordLockedStep, resetRetryAfterSeconds]);

    async function finalizeDoctorLoginAfterMfa() {
        const id = identifier.trim();
        const res = await fetch("/api/v1/auth/doctor/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: id, password }),
        });
        const data = (await res.json().catch(() => ({}))) as JsonPayload;
        if (res.ok) {
            const accessRaw = data.access_token ?? data.accessToken;
            if (typeof accessRaw === "string" && accessRaw) {
                completeAuthSession(data);
                return;
            }
        }
        mfaFinalizeOnce.current = false;
        setError(messageFromPayload(data) || "Could not complete sign-in after verification.");
    }

    useEffect(() => {
        if (mfaStep !== "mfa_hub") {
            mfaFinalizeOnce.current = false;
            return;
        }
        if (!mfaEmailChallengeDone || !mfaPhoneChallengeDone || mfaFinalizeOnce.current) return;
        mfaFinalizeOnce.current = true;
        void (async () => {
            setLoading(true);
            setError("");
            await finalizeDoctorLoginAfterMfa();
            setLoading(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- finalize reads latest identifier/password from closure each run
    }, [mfaStep, mfaEmailChallengeDone, mfaPhoneChallengeDone]);

    function completeAuthSession(data: JsonPayload) {
        const accessRaw = data.access_token ?? data.accessToken;
        const refreshRaw = data.refresh_token ?? data.refreshToken;
        const access = typeof accessRaw === "string" ? accessRaw : "";
        const refresh = typeof refreshRaw === "string" ? refreshRaw : "";
        if (access) sessionStorage.setItem(ACCESS_TOKEN_KEY, access);
        if (refresh) sessionStorage.setItem(REFRESH_TOKEN_KEY, refresh);
        sessionStorage.removeItem(TEMP_TOKEN_KEY);
        setMfaSessionMeta(null);
        setActiveMfaModal(null);
        router.push("/");
        router.refresh();
    }

    function maybeStoreRotatedTemp(data: JsonPayload) {
        const next = data.temp_token ?? data.tempToken;
        if (typeof next === "string" && next) {
            sessionStorage.setItem(TEMP_TOKEN_KEY, next);
        }
    }

    async function verifyMfaEmailOtp(code: string): Promise<MfaOtpResult> {
        const temp = readSessionTempToken();
        if (!temp) return { ok: false, error: "Session expired. Sign in again." };
        const email = mfaVerifyEmail.trim();
        if (!email) {
            return {
                ok: false,
                error: "Missing email for verification. Sign in with your email or ensure the login response includes email.",
            };
        }
        const res = await fetch("/api/v1/auth/mfa/verify-email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${temp}`,
            },
            body: JSON.stringify({ email, code }),
        });
        const data = (await res.json().catch(() => ({}))) as JsonPayload;
        if (res.ok) {
            const accessRaw = data.access_token ?? data.accessToken;
            if (typeof accessRaw === "string" && accessRaw) {
                completeAuthSession(data);
                return { ok: true };
            }
            maybeStoreRotatedTemp(data);
            setMfaEmailChallengeDone(true);
            return { ok: true };
        }
        const lock = parseMfaLockPayload(data);
        if (lock) return { ok: false, lock };
        return { ok: false, error: messageFromPayload(data) };
    }

    async function verifyMfaPhoneOtp(code: string): Promise<MfaOtpResult> {
        const temp = readSessionTempToken();
        if (!temp) return { ok: false, error: "Session expired. Sign in again." };
        const phone = mfaVerifyPhoneNational.replace(/\D/g, "");
        let country_code = mfaVerifyCountryCode.trim();
        if (country_code && !country_code.startsWith("+")) {
            const d = country_code.replace(/\D/g, "");
            country_code = d ? `+${d}` : "";
        }
        if (!country_code) country_code = "+1";
        if (!phone) {
            return {
                ok: false,
                error: "Missing phone for verification. Ensure login returns phone and country_code, or sign in with your phone number.",
            };
        }
        const res = await fetch("/api/v1/auth/mfa/verify-phone", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${temp}`,
            },
            body: JSON.stringify({ country_code, phone, code }),
        });
        const data = (await res.json().catch(() => ({}))) as JsonPayload;
        if (res.ok) {
            const accessRaw = data.access_token ?? data.accessToken;
            if (typeof accessRaw === "string" && accessRaw) {
                completeAuthSession(data);
                return { ok: true };
            }
            maybeStoreRotatedTemp(data);
            setMfaPhoneChallengeDone(true);
            return { ok: true };
        }
        const lock = parseMfaLockPayload(data);
        if (lock) return { ok: false, lock };
        return { ok: false, error: messageFromPayload(data) };
    }

    async function resendMfaEmail(): Promise<MfaOtpResult> {
        const temp = readSessionTempToken();
        if (!temp) return { ok: false, error: "Session expired." };
        const email = mfaVerifyEmail.trim();
        if (!email) return { ok: false, error: "Missing email for resend." };
        const res = await fetch("/api/v1/auth/mfa/resend-email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${temp}`,
            },
            body: JSON.stringify({ email }),
        });
        const data = (await res.json().catch(() => ({}))) as JsonPayload;
        if (res.ok) return { ok: true };
        const lock = parseMfaLockPayload(data);
        if (lock) return { ok: false, lock };
        return { ok: false, error: messageFromPayload(data) };
    }

    async function resendMfaPhone(): Promise<MfaOtpResult> {
        const temp = readSessionTempToken();
        if (!temp) return { ok: false, error: "Session expired." };
        const phone = mfaVerifyPhoneNational.replace(/\D/g, "");
        let country_code = mfaVerifyCountryCode.trim();
        if (country_code && !country_code.startsWith("+")) {
            const d = country_code.replace(/\D/g, "");
            country_code = d ? `+${d}` : "";
        }
        if (!country_code) country_code = "+1";
        if (!phone) return { ok: false, error: "Missing phone for resend." };
        const res = await fetch("/api/v1/auth/mfa/resend-phone", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${temp}`,
            },
            body: JSON.stringify({ country_code, phone }),
        });
        const data = (await res.json().catch(() => ({}))) as JsonPayload;
        if (res.ok) return { ok: true };
        const lock = parseMfaLockPayload(data);
        if (lock) return { ok: false, lock };
        return { ok: false, error: messageFromPayload(data) };
    }

    async function submitDoctorLogin() {
        setError("");
        setLoading(true);
        try {
            const id = identifier.trim();
            const res = await fetch("/api/v1/auth/doctor/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier: id, password }),
            });
            const data = (await res.json().catch(() => ({}))) as JsonPayload;

            if (res.ok) {
                const accessRaw = data.access_token ?? data.accessToken;
                if (typeof accessRaw === "string" && accessRaw) {
                    completeAuthSession(data);
                    return;
                }
                const temp = data.temp_token ?? data.tempToken;
                if (typeof temp !== "string" || !temp) {
                    setError("Missing temporary token from server.");
                    setMfaStep((s) => (s === "account_email_verify" ? "credentials" : s));
                    return;
                }

                const emailOkFor2fa = data.email_verified === true || data.emailVerified === true;
                const phoneOkFor2fa = data.phone_verified === true || data.phoneVerified === true;
                if (!emailOkFor2fa || !phoneOkFor2fa) {
                    sessionStorage.removeItem(TEMP_TOKEN_KEY);
                    setPreMfaGate({ emailOk: emailOkFor2fa, phoneOk: phoneOkFor2fa });
                    setMfaStep("pre_mfa_blocked");
                    return;
                }

                sessionStorage.setItem(TEMP_TOKEN_KEY, temp);
                setMfaEmailChallengeDone(false);
                setMfaPhoneChallengeDone(false);
                setActiveMfaModal(null);
                setPreMfaGate(null);

                const apiEmail =
                    typeof data.email === "string"
                        ? data.email
                        : typeof (data as { contact_email?: string }).contact_email === "string"
                          ? (data as { contact_email: string }).contact_email
                          : undefined;
                const apiPhone =
                    typeof data.phone === "string"
                        ? data.phone
                        : typeof (data as { contact_phone?: string }).contact_phone === "string"
                          ? (data as { contact_phone: string }).contact_phone
                          : typeof (data as { phone_number?: string }).phone_number === "string"
                            ? (data as { phone_number: string }).phone_number
                            : undefined;
                const rawE = pickLoginEmailForMask(id, apiEmail);
                const rawP = pickLoginPhoneForMask(id, apiPhone);
                setMfaMaskedEmailDisplay(maskEmailForDisplay(rawE ? rawE : ""));
                setMfaMaskedPhoneDisplay(maskPhoneForDisplay(rawP || id));
                setMfaVerifyEmail(rawE);
                const phoneParts = pickMfaPhoneForVerify(id, data as Record<string, unknown>);
                setMfaVerifyCountryCode(phoneParts.country_code);
                setMfaVerifyPhoneNational(phoneParts.phone);

                setMfaSessionMeta({
                    expiresInSeconds:
                        typeof data.expires_in === "number"
                            ? data.expires_in
                            : typeof data.expiresIn === "number"
                              ? data.expiresIn
                              : undefined,
                    emailVerified:
                        typeof data.email_verified === "boolean"
                            ? data.email_verified
                            : typeof data.emailVerified === "boolean"
                              ? data.emailVerified
                              : undefined,
                    phoneVerified:
                        typeof data.phone_verified === "boolean"
                            ? data.phone_verified
                            : typeof data.phoneVerified === "boolean"
                              ? data.phoneVerified
                              : undefined,
                });
                setMfaStep("mfa_hub");
                return;
            }

            const pending = res.status === 403 ? parseEmailVerificationPending(data, id) : null;
            if (pending) {
                setAccountVerifyEmail(pending.email);
                setAccountVerifyMessage(pending.message);
                setMfaStep("account_email_verify");
                return;
            }

            const sawPendingButNoEmail =
                res.status === 403 &&
                data.detail &&
                typeof data.detail === "object" &&
                !Array.isArray(data.detail) &&
                ((data.detail as { error_code?: string }).error_code === "EMAIL_VERIFICATION_PENDING" ||
                    (data.detail as { status?: string }).status === "EMAIL_VERIFICATION_PENDING");
            if (sawPendingButNoEmail) {
                setError("Sign in with your email address so we can verify it, or ask your admin to add your email on file.");
                setMfaStep("credentials");
                return;
            }

            setError(messageFromPayload(data));
            setMfaStep((s) => (s === "account_email_verify" ? "credentials" : s));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
            setMfaStep((s) => (s === "account_email_verify" ? "credentials" : s));
        } finally {
            setLoading(false);
        }
    }

    async function handleCredentials(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        await submitDoctorLogin();
    }

    function clearDoctorResetPasswordState() {
        setShowResetPasswordStep(false);
        setShowResetPasswordEmailSentStep(false);
        setShowResetPasswordLockedStep(false);
        setResetEmail("");
        setResetLoading(false);
        setResetError("");
        setResetSuccess("");
        setResetLockedDetail(null);
        setResetRetryAfterSeconds(0);
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
                body: JSON.stringify({ email: emailValue }),
            });

            const data = (await res.json().catch(() => ({}))) as {
                message?: string;
                detail?: string | { msg?: string }[] | PasswordResetLockDetail;
                error?: string;
            };

            if (!res.ok) {
                const lockedDetail =
                    data.detail &&
                    typeof data.detail === "object" &&
                    !Array.isArray(data.detail) &&
                    "error_code" in data.detail &&
                    data.detail.error_code === "PASSWORD_RESET_LOCKED"
                        ? (data.detail as PasswordResetLockDetail)
                        : null;

                if (lockedDetail) {
                    const retry = retrySecondsFromResetPayload(lockedDetail as unknown as Record<string, unknown>);
                    setResetLockedDetail({ ...lockedDetail, retry_after_seconds: retry });
                    setResetRetryAfterSeconds(Math.max(0, retry));
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

            setResetSuccess(typeof data.message === "string" ? data.message : "Password reset link sent.");
            setShowResetPasswordEmailSentStep(true);
        } catch (err) {
            setResetError(err instanceof Error ? err.message : "Failed to request password reset");
        } finally {
            setResetLoading(false);
        }
    }

    async function handleForgotPasswordSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const em = resetEmail.trim();
        if (!em) {
            setResetError("Email is required.");
            return;
        }
        if (!EMAIL_RE.test(em)) {
            setResetError("Enter a valid email address.");
            return;
        }
        await requestForgotPassword(em);
    }

    function goBackToCredentials() {
        sessionStorage.removeItem(TEMP_TOKEN_KEY);
        setMfaSessionMeta(null);
        setMfaStep("credentials");
        setError("");
        setAccountVerifyEmail("");
        setAccountVerifyMessage(undefined);
        setMfaMaskedEmailDisplay("");
        setMfaMaskedPhoneDisplay("");
        setMfaVerifyEmail("");
        setMfaVerifyCountryCode("");
        setMfaVerifyPhoneNational("");
        setMfaEmailChallengeDone(false);
        setMfaPhoneChallengeDone(false);
        setActiveMfaModal(null);
        mfaFinalizeOnce.current = false;
        setPreMfaGate(null);
        setMfaLockScreen(null);
        clearDoctorResetPasswordState();
    }

    const isModal = variant === "modal";
    const shell =
        isModal && mfaStep === "credentials"
            ? "p-0 sm:p-0"
            : mfaStep === "pre_mfa_blocked"
              ? "w-full max-w-lg rounded-2xl border border-q-azure-200 bg-white p-6 shadow-sm sm:p-8"
              : mfaStep === "mfa_hub"
              ? "w-full max-w-lg"
              : mfaStep === "account_email_verify"
                ? "w-full max-w-lg"
                : "rounded-2xl border border-q-azure-200 bg-white p-6 shadow-sm sm:p-8";

    const expiryHint =
        mfaSessionMeta?.expiresInSeconds != null && mfaSessionMeta.expiresInSeconds > 0
            ? (() => {
                  const mins = Math.max(1, Math.round(mfaSessionMeta.expiresInSeconds / 60));
                  return `Complete verification within about ${mins} minute${mins === 1 ? "" : "s"}.`;
              })()
            : null;

    return (
        <>
            {mfaLockScreen ? (
                <DoctorMfaLockScreen lock={mfaLockScreen} onBack={() => setMfaLockScreen(null)} />
            ) : null}
            <div className={mfaLockScreen ? "hidden" : shell}>
                {mfaStep === "pre_mfa_blocked" && preMfaGate ? (
                    <div className="space-y-5">
                        <h1 className="text-2xl font-bold leading-tight text-q-heading sm:text-[28px]">
                            Account verification required
                        </h1>
                        <p className="text-sm leading-relaxed text-q-muted-text">
                            {!preMfaGate.emailOk && !preMfaGate.phoneOk
                                ? "Two-factor sign-in is only available after both your email and phone number are verified on your account. Complete those verifications first, then try signing in again."
                                : preMfaGate.emailOk && !preMfaGate.phoneOk
                                  ? "Your email is verified, but your phone number is not verified on your account yet. Complete phone verification (for example during registration or in your practice settings) before you can continue with two-factor sign-in."
                                  : "Your email is not verified on your account yet. Complete email verification first, then try signing in again."}
                        </p>
                        <button
                            type="button"
                            onClick={goBackToCredentials}
                            className="q-btn-primary w-full rounded-md px-4 py-3 text-sm font-semibold"
                        >
                            Back to sign in
                        </button>
                    </div>
                ) : null}

                {mfaStep === "account_email_verify" ? (
                    <div className="space-y-4">
                        <DoctorEmailVerification
                            email={accountVerifyEmail}
                            registrationMessage={accountVerifyMessage}
                            resendLockedSecondsOnMount={ACCOUNT_EMAIL_RESEND_GATE_SEC}
                            onEmailVerified={() => void submitDoctorLogin()}
                        />
                        <button
                            type="button"
                            onClick={goBackToCredentials}
                            className="w-full text-sm font-semibold text-q-link hover:underline"
                        >
                            ← Back to sign in
                        </button>
                    </div>
                ) : null}

                {mfaStep === "mfa_hub" ? (
                    <DoctorMfaSecurityHub
                        completedEmail={mfaEmailChallengeDone}
                        completedPhone={mfaPhoneChallengeDone}
                        onOpenEmail={() => setActiveMfaModal("email")}
                        onOpenPhone={() => setActiveMfaModal("phone")}
                        onBackSignIn={goBackToCredentials}
                        expiryHint={expiryHint}
                    />
                ) : null}

                {mfaStep === "credentials" ? (
                    <>
                        {!showResetPasswordStep ? (
                            <>
                                <h1 className="text-[30px] font-bold leading-tight text-q-heading">
                                    {isModal ? "Log in to your account" : "Log in for doctors"}
                                </h1>
                                {!isModal ? (
                                    <p className="mt-2 text-sm text-q-muted-text">
                                        Sign in with the email or identifier and password for your practice account.
                                    </p>
                                ) : null}

                                <form className={`space-y-4 ${isModal ? "mt-6" : "mt-8"}`} onSubmit={handleCredentials}>
                                    <div>
                                        <label
                                            htmlFor="doc-login-identifier"
                                            className="mb-2 block text-sm font-semibold text-q-label"
                                        >
                                            Email or identifier
                                        </label>
                                        <input
                                            id="doc-login-identifier"
                                            type="text"
                                            required
                                            autoComplete="username"
                                            value={identifier}
                                            onChange={(ev) => setIdentifier(ev.target.value)}
                                            placeholder="email@domain.com"
                                            className="w-full rounded-md border border-q-border-input bg-white px-4 py-3 text-q-heading outline-none focus:border-q-accent"
                                        />
                                    </div>

                                    <div className="relative">
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                            <label
                                                htmlFor="doc-login-password"
                                                className="text-sm font-semibold text-q-label"
                                            >
                                                Password
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowResetPasswordStep(true);
                                                    setResetError("");
                                                    setResetSuccess("");
                                                    const id = identifier.trim();
                                                    setResetEmail(EMAIL_RE.test(id) ? id : "");
                                                }}
                                                className="shrink-0 text-sm font-semibold text-q-link hover:underline"
                                            >
                                                Reset password
                                            </button>
                                        </div>
                                        <input
                                            id="doc-login-password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(ev) => setPassword(ev.target.value)}
                                            placeholder="********"
                                            className="w-full rounded-md border border-q-border-input bg-white px-4 py-3 pr-11 text-q-heading outline-none focus:border-q-accent"
                                        />
                                        <button
                                            type="button"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            onClick={() => setShowPassword((p) => !p)}
                                            className="absolute right-3 top-11 text-q-muted-text sm:top-12"
                                        >
                                            {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>

                                    {error ? <p className="text-sm text-q-danger">{error}</p> : null}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="q-btn-primary w-full rounded-md px-4 py-3 text-sm disabled:opacity-60"
                                    >
                                        {loading ? "Please wait..." : isModal ? "Continue" : "Log in"}
                                    </button>
                                </form>
                            </>
                        ) : showResetPasswordLockedStep ? (
                            <div className="space-y-5">
                                <button
                                    type="button"
                                    onClick={() => setShowResetPasswordLockedStep(false)}
                                    className="flex items-center gap-1 text-sm font-semibold text-q-muted-text hover:text-q-heading"
                                >
                                    <ArrowLeft size={18} aria-hidden />
                                    Back
                                </button>
                                <h2 className="text-2xl font-bold leading-tight text-q-heading sm:text-[28px]">
                                    Too many attempts
                                </h2>
                                <p className="text-sm text-q-danger">
                                    {resetLockedDetail?.message ??
                                        "You've requested a password reset too many times. This email is temporarily blocked."}
                                </p>
                                <p className="text-left text-base font-semibold text-q-heading">You can request a new reset link in</p>
                                {(() => {
                                    const countdown = formatResetCountdown(resetRetryAfterSeconds);
                                    return (
                                        <div className="flex items-start justify-start gap-1.5 sm:gap-2">
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
                                    );
                                })()}
                            </div>
                        ) : showResetPasswordEmailSentStep ? (
                            <div className="space-y-4">
                                <button
                                    type="button"
                                    onClick={() => setShowResetPasswordEmailSentStep(false)}
                                    className="flex items-center gap-1 text-sm font-semibold text-q-muted-text hover:text-q-heading"
                                >
                                    <ArrowLeft size={18} aria-hidden />
                                    Back
                                </button>
                                <h2 className="text-2xl font-bold leading-tight text-q-heading sm:text-[28px]">Check your email</h2>
                                <p className="text-base text-q-muted-text">
                                    Check your inbox for password reset email from{" "}
                                    <span className="font-semibold text-q-heading">no-reply@email.qarevo-health.com</span>.
                                </p>
                                <div className="mt-1 space-y-2">
                                    <a
                                        href="https://mail.google.com"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex w-full items-center justify-center gap-2 rounded-md border border-q-azure-200 bg-white px-3 py-2.5 text-sm font-semibold text-q-heading hover:bg-q-azure-50"
                                    >
                                        <MailProviderIcon provider="gmail" />
                                        Open Gmail
                                    </a>
                                    <a
                                        href="https://outlook.live.com/mail/0/"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex w-full items-center justify-center gap-2 rounded-md border border-q-azure-200 bg-white px-3 py-2.5 text-sm font-semibold text-q-heading hover:bg-q-azure-50"
                                    >
                                        <MailProviderIcon provider="outlook" />
                                        Open Outlook
                                    </a>
                                </div>
                                <div className="flex items-center gap-2 text-q-muted-text">
                                    <div className="h-px flex-1 bg-q-border" />
                                    <span className="text-xs font-medium">or</span>
                                    <div className="h-px flex-1 bg-q-border" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void requestForgotPassword(resetEmail.trim())}
                                    className="w-full text-sm font-semibold text-q-link hover:underline"
                                >
                                    Resend email
                                </button>
                                {resetError ? <p className="text-sm text-q-danger">{resetError}</p> : null}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <button
                                    type="button"
                                    onClick={() => clearDoctorResetPasswordState()}
                                    className="flex items-center gap-1 text-sm font-semibold text-q-muted-text hover:text-q-heading"
                                >
                                    <ArrowLeft size={18} aria-hidden />
                                    Back to sign in
                                </button>
                                <h2 className="text-2xl font-bold leading-tight text-q-heading sm:text-[28px]">
                                    First, enter your email address
                                </h2>
                                <p className="text-base text-q-muted-text">
                                    We&apos;ll send you a link to reset your password. Use the same email you use for your
                                    doctor account.
                                </p>
                                <form className="space-y-4" onSubmit={handleForgotPasswordSubmit}>
                                    <div>
                                        <label htmlFor="doc-reset-email" className="mb-2 block text-sm font-semibold text-q-label">
                                            Your email
                                        </label>
                                        <input
                                            id="doc-reset-email"
                                            type="email"
                                            required
                                            autoComplete="email"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            placeholder="email@domain.com"
                                            className="w-full rounded-md border border-q-border-input bg-white px-4 py-3 text-q-heading outline-none focus:border-q-accent"
                                        />
                                    </div>
                                    {resetError ? <p className="text-sm text-q-danger">{resetError}</p> : null}
                                    {resetSuccess ? <p className="text-sm text-q-success">{resetSuccess}</p> : null}
                                    <button
                                        type="submit"
                                        disabled={resetLoading}
                                        className="q-btn-primary w-full rounded-md px-4 py-3 text-sm disabled:opacity-60"
                                    >
                                        {resetLoading ? "Please wait..." : "Send reset link"}
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                ) : null}

                {mfaStep === "credentials" && !showResetPasswordStep && isModal ? (
                    <p className="mt-6 text-center text-sm text-q-muted-text">
                        Don&apos;t have an account?{" "}
                        <button
                            type="button"
                            onClick={onRequestClose}
                            className="font-semibold text-q-link hover:underline"
                        >
                            Register now!
                        </button>
                    </p>
                ) : null}

                {mfaStep === "credentials" && !showResetPasswordStep && !isModal ? (
                    <>
                        <p className="mt-6 text-center text-sm text-q-muted-text">
                           Don&apos;t have an account?{" "}
                            <Link href="/doctor/register" className="font-semibold text-q-link hover:underline">
                                Register now !
                            </Link>
                        </p>
                        <p className="mt-3 text-center text-sm text-q-muted-text">
                            <Link href="/" className="font-semibold text-q-link hover:underline">
                                ← Back to role selection
                            </Link>
                        </p>
                    </>
                ) : null}
            </div>

            <DoctorMfaOtpModal
                open={activeMfaModal === "email"}
                kind="email"
                maskedDestination={mfaMaskedEmailDisplay}
                onClose={() => setActiveMfaModal(null)}
                onVerify={verifyMfaEmailOtp}
                onResend={resendMfaEmail}
                onLocked={(lock) => {
                    setMfaLockScreen(lock);
                    setActiveMfaModal(null);
                }}
            />
            <DoctorMfaOtpModal
                open={activeMfaModal === "phone"}
                kind="phone"
                maskedDestination={mfaMaskedPhoneDisplay}
                onClose={() => setActiveMfaModal(null)}
                onVerify={verifyMfaPhoneOtp}
                onResend={resendMfaPhone}
                onLocked={(lock) => {
                    setMfaLockScreen(lock);
                    setActiveMfaModal(null);
                }}
            />
        </>
    );
}
