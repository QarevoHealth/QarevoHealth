"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeSlash } from "phosphor-react";

type DoctorLoginFormProps = {
    variant?: "page" | "modal";
    onRequestClose?: () => void;
};

export function DoctorLoginForm({ variant = "page", onRequestClose }: DoctorLoginFormProps) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const res = await fetch("/api/v1/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = (await res.json().catch(() => ({}))) as {
                message?: string;
                detail?: unknown;
                error?: string;
                access_token?: string;
            };

            if (res.ok) {
                setSuccess(data.message || "Signed in.");
                router.push("/");
                router.refresh();
                return;
            }

            const detailObj =
                data?.detail && typeof data.detail === "object" && !Array.isArray(data.detail)
                    ? (data.detail as { status?: string; error_code?: string })
                    : null;
            const pending =
                detailObj?.status === "EMAIL_VERIFICATION_PENDING" ||
                detailObj?.error_code === "EMAIL_VERIFICATION_PENDING";
            if (pending) {
                setError("This account is not verified yet. Use patient sign-in to complete email verification, or check your inbox.");
                return;
            }

            const detailText = Array.isArray(data.detail)
                ? data.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(", ")
                : typeof data.detail === "string"
                  ? data.detail
                  : "";
            throw new Error(data.error || detailText || "Login failed");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    }

    const isModal = variant === "modal";
    const shell = isModal
        ? "p-0 sm:p-0"
        : "rounded-2xl border border-q-azure-200 bg-white p-6 shadow-sm sm:p-8";

    return (
        <div className={shell}>
            <h1 className="text-[30px] font-bold leading-tight text-q-heading">
                {isModal ? "Log in to your account" : "Log in for doctors"}
            </h1>
            {!isModal ? (
                <p className="mt-2 text-sm text-q-muted-text">
                    Sign in with the email and password you used when registering your practice account.
                </p>
            ) : null}

            <form className={`space-y-4 ${isModal ? "mt-6" : "mt-8"}`} onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="doc-login-email" className="mb-2 block text-sm font-semibold text-q-label">
                        Email address
                    </label>
                    <input
                        id="doc-login-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@domain.com"
                        className="w-full rounded-md border border-q-border-input bg-white px-4 py-3 text-q-heading outline-none focus:border-q-accent"
                    />
                </div>

                <div className="relative">
                    <label htmlFor="doc-login-password" className="mb-2 block text-sm font-semibold text-q-label">
                        Password
                    </label>
                    <input
                        id="doc-login-password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                        className="w-full rounded-md border border-q-border-input bg-white px-4 py-3 pr-11 text-q-heading outline-none focus:border-q-accent"
                    />
                    <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-[38px] text-q-muted-text"
                    >
                        {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                {error ? <p className="text-sm text-q-danger">{error}</p> : null}
                {success ? <p className="text-sm text-q-success">{success}</p> : null}

                <button
                    type="submit"
                    disabled={loading}
                    className="q-btn-primary w-full rounded-md px-4 py-3 text-sm disabled:opacity-60"
                >
                    {loading ? "Please wait..." : isModal ? "Continue" : "Log in"}
                </button>
            </form>

            {isModal ? (
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
            ) : (
                <>
                    <p className="mt-6 text-center text-sm text-q-muted-text">
                        New to Qarevo?{" "}
                        <Link href="/doctor/register" className="font-semibold text-q-link hover:underline">
                            Register as a doctor
                        </Link>
                    </p>
                    <p className="mt-3 text-center text-sm text-q-muted-text">
                        <Link href="/" className="font-semibold text-q-link hover:underline">
                            ← Back to role selection
                        </Link>
                    </p>
                </>
            )}
        </div>
    );
}
