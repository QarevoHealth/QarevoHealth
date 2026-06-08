"use client";

import { DoctorSignupHero } from "./DoctorSignupHero";

/** Decorative layer: same grid as doctor registration, heavily blurred (doctor login background). */
export function DoctorRegisterBackdrop() {
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-gradient-to-b from-q-azure-50 via-q-azure-100 to-q-azure-200/80"
        >
            <div className="absolute inset-0 overflow-auto [transform:translateZ(0)]">
                <div className="min-h-full blur-[14px] sm:blur-[18px] [transform:scale(1.03)]">
                    <div className="mx-auto w-[92%] max-w-6xl py-8 sm:py-12 lg:py-14">
                        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-10">
                            <div className="rounded-2xl border border-q-azure-200 bg-white p-6 shadow-[0_2px_12px_rgba(20,52,93,0.06)] sm:p-8">
                                <h2 className="text-[30px] font-bold leading-tight text-q-heading">
                                    Registration for doctors
                                </h2>
                                <p className="mt-2 text-sm text-q-muted-text">
                                    Create your practice account to start offering consultations.
                                </p>
                                <div className="mt-8 space-y-5">
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <div className="h-24 rounded-md bg-q-azure-50/95" />
                                        <div className="h-24 rounded-md bg-q-azure-50/95" />
                                    </div>
                                    <div className="h-16 rounded-md bg-q-azure-50/90" />
                                    <div className="h-28 rounded-md bg-q-azure-50/85" />
                                    <div className="h-24 rounded-md bg-q-azure-50/90" />
                                    <div className="h-32 rounded-md bg-q-azure-50/80" />
                                </div>
                                <div className="mt-8 h-12 rounded-md bg-q-azure-200/70" />
                            </div>
                            <section className="lg:min-h-0">
                                <DoctorSignupHero />
                            </section>
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-q-azure-50/45 via-q-azure-100/35 to-q-azure-200/40" />
        </div>
    );
}
