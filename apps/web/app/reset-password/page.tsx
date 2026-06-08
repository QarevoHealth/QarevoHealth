"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Eye, EyeSlash, X } from "phosphor-react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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
        setError("");
        setSuccess("");

        if (!token) {
            setError("Missing reset token in URL.");
            return;
        }

        if (!isValidPassword(newPassword)) {
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
        <div className="relative min-h-screen overflow-hidden bg-[#9da9ba]">
            <div className="absolute inset-0 bg-[#91a2b8]" />
            <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
                <div className="w-full max-w-[520px] rounded-2xl border border-[#dce4ef] bg-white p-6 shadow-[0_20px_50px_rgba(20,52,93,0.25)]">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Image src="/logo-symbol.png" alt="Qarevo symbol" width={20} height={20} />
                            <span className="text-[32px] font-semibold text-[#1f3556]">Qarevo Health</span>
                        </div>
                        <Link href="/patient/register" aria-label="Close" className="text-[#8a99ae]">
                            <X size={20} />
                        </Link>
                    </div>

                    <h1 className="text-[40px] font-bold leading-tight text-[#1f3556]">Reset password</h1>

                    <form className="mt-5" onSubmit={handleSubmit}>
                        <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-[#405676]">
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
                                className="w-full rounded-md border border-[#d6deea] px-4 py-3 pr-11 text-[#1f3556] outline-none focus:border-[#6fa9d5]"
                            />
                            <button
                                type="button"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7b95b4]"
                            >
                                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
                        {success ? <p className="mt-3 text-sm text-emerald-700">{success}</p> : null}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-4 w-full rounded-md bg-[#14528f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f467b] disabled:opacity-60"
                        >
                            {loading ? "Please wait..." : "Reset password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
