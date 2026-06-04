"use client";

import Image from "next/image";
import Link from "next/link";
import { AuthImageSlider } from "@/components/AuthImageSlider";
import { CheckCircle, Circle, FirstAidKit, UserCircle } from "phosphor-react";

export default function Home() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-white">
            <div className="pointer-events-none absolute inset-0 z-0">
                <Image src="/role-bottom-bg.png" alt="" fill className="object-cover object-bottom opacity-85" />
            </div>

            <header className="relative z-10 flex items-center justify-between border-b border-[#e0e6ef] bg-white/80 px-10 py-4 backdrop-blur">
                <div className="flex items-center gap-2">
                    <Image src="/logo-symbol.png" alt="Qarevo logo" width={24} height={24} />
                    <span className="text-[30px] font-semibold text-[#16355e]">Qarevo Health</span>
                </div>
                <p className="text-sm font-semibold text-[#16355e]">
                    Do you already have an account? <span className="underline">Log in</span>
                </p>
            </header>

            <main className="relative z-10 mx-auto mt-14 grid w-[92%] max-w-6xl place-items-center rounded-2xl border border-[#e5ebf2] bg-white p-6">
                <div className="relative w-full overflow-hidden rounded-2xl border border-[#e3e8ef] bg-[#f7fbff] p-10">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        <section className="blur-[2px]">
                            <h1 className="text-5xl font-bold text-[#16355e]">Create your free account</h1>
                            <Link
                                href="/patient/register"
                                className="mt-8 inline-flex w-full items-center justify-center rounded-md bg-[#14528f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f467b]"
                            >
                                Continue
                            </Link>
                        </section>

                        <section className="overflow-hidden rounded-2xl blur-[2px]">
                            <AuthImageSlider />
                        </section>
                    </div>
                </div>

                <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
                    <div className="pointer-events-none absolute inset-0 backdrop-blur-[6px]" />
                    <div className="pointer-events-none absolute inset-0 bg-[#7ea2ca]/18" />
                    <div className="pointer-events-none absolute inset-0 bg-white/20" />
                    <div className="relative w-full max-w-[378px] rounded-2xl border border-[#dce4ef] bg-white px-5 pb-5 pt-4 shadow-[0_10px_30px_rgba(20,52,93,0.22)]">
                        <div className="flex items-center justify-center">
                            <Image src="/logo-symbol.png" alt="Qarevo symbol" width={26} height={26} />
                        </div>
                        <button
                            type="button"
                            aria-label="Close modal"
                            className="absolute right-4 top-3 text-2xl leading-none text-[#8a99ae]"
                        >
                            ×
                        </button>

                        <h2 className="mt-2 text-center text-[15px] font-bold leading-tight text-[#1f3556]">
                            Welcome to Qarevo Health
                        </h2>
                        <p className="mt-1 text-center text-[12px] text-[#7b8aa1]">How would you like to continue?</p>

                        <div className="mt-4 grid grid-cols-2 gap-2.5">
                            <Link
                                href="/patient/register"
                                className="relative rounded-xl border-2 border-[#6fa9d5] bg-[#f3fbff] p-3 text-left"
                            >
                                <span className="absolute right-2 top-2 inline-flex items-center justify-center">
                                    <CheckCircle size={14} weight="fill" className="text-[#5fa0d2]" />
                                </span>
                                <div className="mb-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#c9d5e5] text-[#1f3556]">
                                    <UserCircle size={12} weight="regular" />
                                </div>
                                <p className="text-[14px] font-semibold text-[#1f3556]">Patient</p>
                                <p className="mt-1 text-[11px] leading-4 text-[#586a84]">Book appointments and consult with doctors</p>
                            </Link>
                            <Link href="/join" className="relative rounded-xl border border-[#d8e0ea] bg-white p-3 text-left">
                                <span className="absolute right-2 top-2 inline-flex items-center justify-center">
                                    <Circle size={14} weight="regular" className="text-[#d4dce8]" />
                                </span>
                                <div className="mb-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#c9d5e5] text-[#1f3556]">
                                    <FirstAidKit size={12} weight="regular" />
                                </div>
                                <p className="text-[14px] font-semibold text-[#1f3556]">Doctor</p>
                                <p className="mt-1 text-[11px] leading-4 text-[#586a84]">Provide care and manage patient consultations</p>
                            </Link>
                        </div>

                        <Link
                            href="/patient/register"
                            className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-[#14528f] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#0f467b]"
                        >
                            Continue
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
