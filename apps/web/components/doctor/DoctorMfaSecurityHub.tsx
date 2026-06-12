"use client";

import Image from "next/image";
import { CaretRight, CheckCircle, DeviceMobile, Envelope } from "phosphor-react";

type DoctorMfaSecurityHubProps = {
    completedEmail: boolean;
    completedPhone: boolean;
    onOpenEmail: () => void;
    onOpenPhone: () => void;
    onBackSignIn: () => void;
    expiryHint?: string | null;
};

export function DoctorMfaSecurityHub({
    completedEmail,
    completedPhone,
    onOpenEmail,
    onOpenPhone,
    onBackSignIn,
    expiryHint,
}: DoctorMfaSecurityHubProps) {
    const total = 2;
    const done = (completedEmail ? 1 : 0) + (completedPhone ? 1 : 0);

    return (
        <div className="relative overflow-hidden rounded-2xl border border-q-azure-200 bg-white p-6 shadow-[0_8px_32px_rgba(20,52,93,0.08)] sm:p-8">
            <div
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-q-azure-100/60 blur-2xl"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-q-azure-50 blur-2xl"
                aria-hidden
            />

            <div className="relative flex items-center gap-2">
                <Image src="/logo-symbol.png" alt="" width={28} height={28} />
                <span className="text-lg font-semibold text-q-heading">Qarevo Health</span>
            </div>

            <h1 className="relative mt-6 text-2xl font-bold leading-tight text-q-heading sm:text-[28px]">
                Security Verification Requirements
            </h1>
            <p className="relative mt-2 text-sm text-q-muted-text">
                You need to complete all of the following verifications to continue.
            </p>

            {expiryHint ? <p className="relative mt-2 text-xs font-medium text-q-heading">{expiryHint}</p> : null}

            <p className="relative mt-6 text-5xl font-bold tabular-nums text-q-accent sm:text-6xl">
                {done}/{total}
            </p>

            <div className="relative mt-8 space-y-3">
                <button
                    type="button"
                    disabled={completedEmail}
                    onClick={onOpenEmail}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                        completedEmail
                            ? "cursor-default border-emerald-200 bg-emerald-50/50"
                            : "border-q-border-strong bg-white hover:border-q-accent hover:bg-q-azure-50/80"
                    }`}
                >
                    <span className="flex items-center gap-3">
                        <Envelope
                            size={22}
                            className={completedEmail ? "text-emerald-600" : "text-q-heading"}
                            aria-hidden
                        />
                        <span className="font-semibold text-q-heading">Email</span>
                    </span>
                    {completedEmail ? (
                        <CheckCircle size={24} weight="fill" className="shrink-0 text-emerald-600" aria-hidden />
                    ) : (
                        <CaretRight size={22} className="shrink-0 text-q-muted-text" aria-hidden />
                    )}
                </button>

                <button
                    type="button"
                    disabled={completedPhone}
                    onClick={onOpenPhone}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                        completedPhone
                            ? "cursor-default border-emerald-200 bg-emerald-50/50"
                            : "border-q-border-strong bg-white hover:border-q-accent hover:bg-q-azure-50/80"
                    }`}
                >
                    <span className="flex items-center gap-3">
                        <DeviceMobile
                            size={22}
                            className={completedPhone ? "text-emerald-600" : "text-q-heading"}
                            aria-hidden
                        />
                        <span className="font-semibold text-q-heading">Phone Number</span>
                    </span>
                    {completedPhone ? (
                        <CheckCircle size={24} weight="fill" className="shrink-0 text-emerald-600" aria-hidden />
                    ) : (
                        <CaretRight size={22} className="shrink-0 text-q-muted-text" aria-hidden />
                    )}
                </button>
            </div>

            <a
                href="mailto:support@qarevohealth.com?subject=Security%20verification%20help"
                className="relative mt-8 block text-center text-sm font-semibold text-q-link hover:underline"
            >
                Security verification unavailable?
            </a>

            <button
                type="button"
                onClick={onBackSignIn}
                className="relative mt-4 w-full text-center text-sm font-medium text-q-muted-text hover:text-q-heading"
            >
                ← Back to sign in
            </button>
        </div>
    );
}
