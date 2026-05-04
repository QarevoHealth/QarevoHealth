"use client";

import Image from "next/image";
import Link from "next/link";
import { AuthImageSlider } from "@/components/AuthImageSlider";
import { CheckCircle, Circle, FirstAidKit, UserCircle } from "phosphor-react";

export default function Home() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-q-azure-50 via-q-azure-100 to-q-azure-200/80">
            <header className="relative z-10 flex items-center justify-between border-b border-q-azure-200 bg-white/95 px-10 py-4 backdrop-blur">
                <div className="flex items-center gap-2">
                    <Image src="/logo-symbol.png" alt="Qarevo logo" width={24} height={24} />
                    <span className="text-[30px] font-semibold text-q-heading">Qarevo Health</span>
                </div>
                <p className="text-sm font-semibold text-q-heading">
                    Do you already have an account?{" "}
                    <Link href="/patient/register?login=1" className="underline hover:text-q-link">
                        Log in
                    </Link>
                </p>
            </header>

            <main className="relative z-10 mx-auto mt-10 w-[95%] max-w-7xl rounded-2xl border border-q-azure-200/90 bg-q-azure-50/40 p-6 shadow-sm sm:mt-14">
                <div className="relative w-full overflow-hidden rounded-2xl border border-q-azure-200 bg-white shadow-sm">
                    <div className="pointer-events-none blur-sm select-none">
                        <div className="grid grid-cols-1 gap-10 p-10 lg:grid-cols-2 lg:p-12">
                            <section>
                                <h1 className="text-[30px] font-bold leading-tight text-q-heading">Create your free account</h1>
                                <Link
                                    href="/patient/register"
                                    tabIndex={-1}
                                    className="q-btn-primary mt-8 inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-sm"
                                >
                                    Continue
                                </Link>
                            </section>

                            <section className="overflow-hidden rounded-2xl lg:min-h-[520px]">
                                <AuthImageSlider rootClassName="relative h-full min-h-[440px] w-full overflow-hidden rounded-2xl lg:min-h-full" />
                            </section>
                        </div>
                    </div>
                </div>

                <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
                    <div
                        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-q-azure-100/45 via-q-azure-50/35 to-q-azure-200/35 backdrop-blur-md backdrop-saturate-125"
                        aria-hidden
                    />
                    <div className="relative z-10 w-full max-w-[378px] rounded-2xl border border-q-azure-200 bg-white px-5 pb-5 pt-4 shadow-[0_10px_30px_rgba(20,52,93,0.22)]">
                        <div className="flex items-center justify-center">
                            <Image src="/logo-symbol.png" alt="Qarevo symbol" width={26} height={26} />
                        </div>
                        <button
                            type="button"
                            aria-label="Close modal"
                            className="absolute right-4 top-3 text-2xl leading-none text-q-muted-text"
                        >
                            ×
                        </button>

                        <h2 className="mt-2 text-center text-[25px] font-bold leading-tight text-q-heading">
                            Welcome to Qarevo Health
                        </h2>
                        <p className="mt-1 text-center text-[12px] text-q-muted-text">How would you like to continue?</p>

                        <div className="mt-4 grid grid-cols-2 gap-2.5">
                            <Link
                                href="/patient/register"
                                className="relative rounded-xl border-2 border-q-accent bg-q-azure-50 p-3 text-left shadow-sm transition-colors hover:bg-q-azure-100"
                            >
                                <span className="absolute right-2 top-2 inline-flex items-center justify-center">
                                    <CheckCircle size={14} weight="fill" className="text-q-accent" />
                                </span>
                                <div className="mb-1 flex h-5 w-5 items-center justify-center rounded-full border border-q-azure-400 text-q-azure-700">
                                    <UserCircle size={12} weight="regular" />
                                </div>
                                <p className="text-[14px] font-semibold text-q-heading">Patient</p>
                                <p className="mt-1 text-[11px] leading-4 text-q-muted-text">Book appointments and consult with doctors</p>
                            </Link>
                            <Link
                                href="/join"
                                className="relative rounded-xl border border-q-azure-200 bg-q-azure-50 p-3 text-left shadow-sm transition-colors hover:bg-q-azure-100"
                            >
                                <span className="absolute right-2 top-2 inline-flex items-center justify-center">
                                    <Circle size={14} weight="regular" className="text-q-border-strong" />
                                </span>
                                <div className="mb-1 flex h-5 w-5 items-center justify-center rounded-full border border-q-azure-300 text-q-heading">
                                    <FirstAidKit size={12} weight="regular" />
                                </div>
                                <p className="text-[14px] font-semibold text-q-heading">Doctor</p>
                                <p className="mt-1 text-[11px] leading-4 text-q-muted-text">Provide care and manage patient consultations</p>
                            </Link>
                        </div>

                        <Link
                            href="/patient/register"
                            className="q-btn-primary mt-4 inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-[13px]"
                        >
                            Continue
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
