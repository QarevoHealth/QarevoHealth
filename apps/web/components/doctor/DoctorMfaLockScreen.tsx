"use client";

import { useEffect, useState } from "react";
import { Warning } from "phosphor-react";
import { AuthPageHeader } from "@/components/AuthPageHeader";
import { type MfaLockInfo, initialLockCountdownSeconds } from "@/lib/auth/mfa-lock";
import { DoctorLoginHeaderActions } from "./DoctorLoginHeaderActions";
import { DoctorSignupHero } from "./DoctorSignupHero";

type DoctorMfaLockScreenProps = {
    lock: MfaLockInfo;
    onBack: () => void;
};

function splitCountdown(totalSeconds: number) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    return { hours, minutes, seconds };
}

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

export function DoctorMfaLockScreen({ lock, onBack }: DoctorMfaLockScreenProps) {
    const [remaining, setRemaining] = useState(() => initialLockCountdownSeconds(lock));

    useEffect(() => {
        setRemaining(initialLockCountdownSeconds(lock));
    }, [lock]);

    useEffect(() => {
        if (lock.lockedUntilIso) {
            const iso = lock.lockedUntilIso;
            const tick = () => {
                const t = new Date(iso).getTime();
                if (Number.isNaN(t)) return;
                setRemaining(Math.max(0, Math.ceil((t - Date.now()) / 1000)));
            };
            tick();
            const id = window.setInterval(tick, 1000);
            return () => window.clearInterval(id);
        }
        const id = window.setInterval(() => {
            setRemaining((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => window.clearInterval(id);
    }, [lock.lockedUntilIso, lock.retryAfterSeconds]);

    const { hours, minutes, seconds } = splitCountdown(remaining);
    const hoursDisplay = hours > 99 ? String(hours) : pad2(hours);
    const blockMessage =
        lock.channel === "email"
            ? "This email has been temporarily blocked due to multiple verification attempts."
            : "This phone number has been temporarily blocked due to multiple verification attempts.";

    const timeBoxes = [
        { value: hoursDisplay, label: "Hours" },
        { value: pad2(minutes), label: "Minutes" },
        { value: pad2(seconds), label: "Seconds" },
    ];

    return (
        <div className="fixed inset-0 z-[500] min-h-screen overflow-y-auto bg-gradient-to-b from-q-azure-50 via-q-azure-100 to-q-azure-200/80">
            <AuthPageHeader className="relative z-10 border-b border-q-azure-200 bg-white/95 shadow-sm backdrop-blur-md">
                <DoctorLoginHeaderActions />
            </AuthPageHeader>

            <main className="relative z-10 mx-auto w-[92%] max-w-6xl py-8 sm:py-12 lg:py-14">
                <div className="flex flex-col gap-8 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-10">
                    <section className="flex h-full flex-col justify-center">
                        <div className="rounded-2xl border border-q-azure-200 bg-white p-6 shadow-[0_2px_12px_rgba(20,52,93,0.06)] sm:p-8 lg:p-10">
                            <h1 className="text-[28px] font-bold leading-tight text-q-heading sm:text-[34px]">
                                Too many attempts
                            </h1>

                            <div
                                className="mt-6 flex gap-3 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3.5"
                                role="alert"
                            >
                                <Warning size={24} weight="fill" className="shrink-0 text-red-600" aria-hidden />
                                <p className="text-sm font-medium leading-relaxed text-red-950">{blockMessage}</p>
                            </div>

                            <p className="mt-8 text-left text-sm font-semibold text-q-heading">
                                You can request a new code in
                            </p>

                            <div className="mt-4 flex items-start justify-start gap-1.5 sm:gap-2">
                                {timeBoxes.map((box, i) => (
                                    <div key={box.label} className="flex items-start gap-1.5 sm:gap-2">
                                        {i > 0 ? (
                                            <span
                                                className="select-none pt-3 text-2xl font-light text-q-azure-400 sm:pt-4 sm:text-3xl"
                                                aria-hidden
                                            >
                                                :
                                            </span>
                                        ) : null}
                                        <div className="flex w-[3.75rem] flex-col items-center sm:w-16">
                                            <div className="flex h-14 w-full items-center justify-center rounded-xl border-2 border-q-azure-200 bg-q-azure-50 px-2 sm:h-16">
                                                <span className="text-2xl font-bold tabular-nums text-q-heading sm:text-3xl">
                                                    {box.value}
                                                </span>
                                            </div>
                                            <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-q-muted-text sm:text-xs">
                                                {box.label}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {lock.message && lock.message !== blockMessage ? (
                                <p className="mt-6 text-left text-sm text-q-muted-text">{lock.message}</p>
                            ) : null}

                            <button
                                type="button"
                                onClick={onBack}
                                className="q-btn-primary mt-10 w-full rounded-md px-4 py-3 text-sm font-semibold"
                            >
                                Back to security verification
                            </button>
                        </div>
                    </section>

                    <section className="relative lg:min-h-0">
                        <DoctorSignupHero />
                    </section>
                </div>
            </main>
        </div>
    );
}
