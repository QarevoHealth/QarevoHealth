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

                    <h1 className="text-[30px] font-bold leading-tight text-q-heading">Email verification</h1>

                    {loading ? <p className="mt-4 text-base text-q-muted-text">Verifying your email...</p> : null}
                    {error ? <p className="mt-4 text-sm text-q-danger">{error}</p> : null}
                    {success ? <p className="mt-4 text-sm text-q-success">{success}</p> : null}

                    <Link
                        href="/patient/register"
                        className="q-btn-primary mt-6 inline-flex rounded-md px-4 py-3 text-sm"
                    >
                        Go to login/register
                    </Link>
                </div>
            </div>
        </div>
    );
}
