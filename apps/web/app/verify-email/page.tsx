"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { X } from "phosphor-react";

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function verifyEmail() {
            if (!token) {
                setError("Missing verification token in URL.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");
            setSuccess("");

            try {
                const res = await fetch(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`, {
                    method: "GET",
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
                    throw new Error(data.error || detailText || "Email verification failed");
                }

                if (!active) return;
                setSuccess(data.message || "Email verified successfully.");
            } catch (err) {
                if (!active) return;
                setError(err instanceof Error ? err.message : "Email verification failed");
            } finally {
                if (!active) return;
                setLoading(false);
            }
        }

        void verifyEmail();

        return () => {
            active = false;
        };
    }, [token]);

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

                    <h1 className="text-[40px] font-bold leading-tight text-[#1f3556]">Email verification</h1>

                    {loading ? <p className="mt-4 text-base text-[#6f819a]">Verifying your email...</p> : null}
                    {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
                    {success ? <p className="mt-4 text-sm text-emerald-700">{success}</p> : null}

                    <Link
                        href="/patient/register"
                        className="mt-6 inline-flex rounded-md bg-[#14528f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f467b]"
                    >
                        Go to login/register
                    </Link>
                </div>
            </div>
        </div>
    );
}
