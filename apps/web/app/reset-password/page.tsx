"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Eye, EyeSlash, X } from "phosphor-react";
import { useSearchParams } from "next/navigation";
import { PasswordValidationHints } from "@/components/PasswordValidationHints";
import { passwordMeetsPolicy } from "@/lib/password-policy";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!token) {
            setError("Missing reset token in URL.");
            return;
        }

        if (!passwordMeetsPolicy(newPassword)) {
            setError("Password must be 8-20 characters with uppercase, lowercase, number, and special character.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/v1/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    new_password: newPassword,
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
                throw new Error(data.error || detailText || "Reset password failed");
            }

            setSuccess(data.message || "Password reset successful.");
            setNewPassword("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Reset password failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-q-azure-50 via-q-azure-100 to-q-azure-50">
            <div className="absolute inset-0 bg-q-azure-200/20" />
            <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
                <div className="w-full max-w-[520px] rounded-2xl border border-q-azure-200 bg-white p-6 shadow-[0_20px_50px_rgba(20,52,93,0.25)]">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Image src="/logo-symbol.png" alt="Qarevo symbol" width={20} height={20} />
                            <span className="text-[30px] font-semibold text-q-heading">Qarevo Health</span>
                        </div>
                        <Link href="/patient/register" aria-label="Close" className="text-q-muted-text">
                            <X size={20} />
                        </Link>
                    </div>

                    <h1 className="text-[30px] font-bold leading-tight text-q-heading">Reset password</h1>

                    <form className="mt-5" onSubmit={handleSubmit}>
                        <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-q-label">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                id="new-password"
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={8}
                                maxLength={20}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter your new password"
                                className="w-full rounded-md border border-q-border-input bg-white px-4 py-3 pr-11 text-q-heading outline-none focus:border-q-accent"
                            />
                            <button
                                type="button"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-q-muted-text"
                            >
                                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <PasswordValidationHints value={newPassword} className="mt-2" />

                        {error ? <p className="mt-3 text-sm text-q-danger">{error}</p> : null}
                        {success ? <p className="mt-3 text-sm text-q-success">{success}</p> : null}

                        <button
                            type="submit"
                            disabled={loading}
                            className="q-btn-primary mt-4 w-full rounded-md px-4 py-3 text-sm disabled:opacity-60"
                        >
                            {loading ? "Please wait..." : "Reset password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
