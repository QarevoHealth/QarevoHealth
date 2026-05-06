"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { X } from "phosphor-react";
import { AuthPageHeader } from "@/components/AuthPageHeader";
import { AuthLoginRoleMenu } from "@/components/AuthLoginRoleMenu";
import { DoctorEmailVerification } from "./DoctorEmailVerification";
import { DoctorLoginForm } from "./DoctorLoginForm";
import { DoctorRegistrationForm } from "./DoctorRegistrationForm";
import { DoctorSignupHero } from "./DoctorSignupHero";

export function DoctorRegisterFlow() {
    const router = useRouter();
    const [step, setStep] = useState<"form" | "verify" | "done">("form");
    const [verifyEmail, setVerifyEmail] = useState("");
    const [showDoctorLoginModal, setShowDoctorLoginModal] = useState(false);

    return (
        <div
            className={
                step === "form"
                    ? "min-h-screen bg-gradient-to-b from-q-azure-50 via-q-azure-100 to-q-azure-200/80"
                    : "min-h-screen bg-white"
            }
        >
            <AuthPageHeader className="relative z-[100] border-b border-q-azure-200 bg-white shadow-sm backdrop-blur-md">
                <AuthLoginRoleMenu
                    onSelectPatient={() => router.push("/patient/register?login=1")}
                    onSelectDoctor={() => setShowDoctorLoginModal(true)}
                />
            </AuthPageHeader>

            <main className="mx-auto w-[92%] max-w-6xl py-8 sm:py-12 lg:py-14">
                <div className="flex flex-col gap-8 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-10">
                    {step === "form" ? (
                        <DoctorRegistrationForm
                            onRegistrationSuccess={(registeredEmail) => {
                                setVerifyEmail(registeredEmail);
                                setStep("verify");
                            }}
                        />
                    ) : step === "verify" ? (
                        <DoctorEmailVerification
                            email={verifyEmail}
                            onVerified={() => setStep("done")}
                        />
                    ) : (
                        <div className="rounded-2xl border border-q-azure-200 bg-white p-6 shadow-[0_2px_12px_rgba(20,52,93,0.06)] sm:p-8">
                            <h1 className="text-[30px] font-bold leading-tight text-q-heading">We verified your email</h1>
                            <p className="mt-3 text-base text-q-muted-text">
                                <span className="font-semibold text-q-heading">{verifyEmail}</span> is confirmed. You can
                                log in to your doctor account.
                            </p>
                            <Link
                                href="/doctor/login"
                                className="q-btn-primary mt-8 inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-sm font-semibold"
                            >
                                Go to doctor log in
                            </Link>
                            <p className="mt-4 text-center text-sm text-q-muted-text">
                                <Link href="/" className="font-semibold text-q-link hover:underline">
                                    ← Back to role selection
                                </Link>
                            </p>
                        </div>
                    )}
                    <section className="lg:min-h-0">
                        <DoctorSignupHero />
                    </section>
                </div>
            </main>

            {showDoctorLoginModal ? (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <button
                        type="button"
                        className="absolute inset-0 border-0 bg-q-heading/30 backdrop-blur-xl backdrop-saturate-150"
                        aria-label="Close login"
                        onClick={() => setShowDoctorLoginModal(false)}
                    />
                    <div className="relative z-[1] w-full max-w-[430px] rounded-2xl border border-q-azure-200 bg-white p-6 shadow-[0_20px_50px_rgba(20,52,93,0.25)] sm:p-8">
                        <button
                            type="button"
                            aria-label="Close login"
                            onClick={() => setShowDoctorLoginModal(false)}
                            className="absolute right-4 top-4 text-q-muted-text hover:text-q-heading"
                        >
                            <X size={22} />
                        </button>
                        <DoctorLoginForm
                            variant="modal"
                            onRequestClose={() => setShowDoctorLoginModal(false)}
                        />
                        <div className="mt-6 flex items-center justify-center gap-2 border-t border-q-azure-100 pt-5">
                            <Image src="/logo-symbol.png" alt="" width={22} height={22} />
                            <span className="text-lg font-semibold text-q-heading">Qarevo Health</span>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
