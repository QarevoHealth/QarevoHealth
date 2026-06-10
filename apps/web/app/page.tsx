"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, Circle, FirstAidKit, UserCircle } from "phosphor-react";
import { AuthImageSlider } from "@/components/AuthImageSlider";
import { AuthLoginRoleMenu } from "@/components/AuthLoginRoleMenu";
import { AuthPageHeader } from "@/components/AuthPageHeader";

export default function Home() {
    const router = useRouter();

    return (
        <div className="relative min-h-screen overflow-hidden bg-[var(--color-primary-50)]">
            <div className="pointer-events-none absolute inset-0 z-0">
                <Image
                    src="/role-bottom-bg.png"
                    alt=""
                    fill
                    className="object-cover object-bottom opacity-40"
                />
            </div>

            <AuthPageHeader className="!border-q-azure-200 !bg-white/85 shadow-sm">
                <AuthLoginRoleMenu
                    onSelectPatient={() => router.push("/patient/register?login=1")}
                    onSelectDoctor={() => router.push("/doctor/login")}
                />
            </AuthPageHeader>

            <main className="relative z-10 mx-auto mt-14 grid w-[92%] max-w-6xl place-items-center rounded-2xl border border-q-azure-200 bg-white/70 p-6 shadow-sm backdrop-blur">
                <div className="relative w-full overflow-hidden rounded-2xl border border-q-azure-100 bg-q-azure-50/60 p-10">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        <section className="blur-[2px]">
                            <h1 className="text-5xl font-bold text-q-heading">Create your free account</h1>
                            <Link
                                href="/patient/register"
                                className="q-btn-primary mt-8 inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-sm font-semibold"
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
                    <div className="pointer-events-none absolute inset-0 bg-q-azure-300/15" />
                    <div className="relative w-full max-w-[440px] rounded-2xl border border-q-azure-200 bg-white p-6 shadow-[0_10px_30px_rgba(20,52,93,0.22)]">
                        <div className="flex items-center justify-center">
                            <Image src="/logo-symbol.png" alt="Qarevo symbol" width={32} height={32} />
                        </div>
                        <button
                            type="button"
                            aria-label="Close modal"
                            className="absolute right-4 top-4 text-q-muted-text hover:text-q-heading"
                        >
                            ×
                        </button>

                        <h2 className="mt-3 text-center text-[18px] font-bold leading-tight text-q-heading">
                            Welcome to Qarevo Health
                        </h2>
                        <p className="mt-1 text-center text-[13px] text-q-muted-text">
                            How would you like to continue?
                        </p>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <Link
                                href="/patient/register"
                                className="group relative rounded-xl border-2 border-q-azure-500 bg-q-azure-50 p-4 text-left shadow-[0_0_0_3px_rgba(132,197,251,0.18)] transition hover:bg-q-azure-100"
                            >
                                <span className="absolute right-2.5 top-2.5">
                                    <CheckCircle size={18} weight="fill" className="text-q-azure-600" />
                                </span>
                                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-q-azure-100 text-q-azure-700">
                                    <UserCircle size={20} weight="regular" />
                                </div>
                                <p className="text-[14px] font-semibold text-q-heading">Patient</p>
                                <p className="mt-1 text-[11px] leading-4 text-q-muted-text">
                                    Book appointments and consult with doctors
                                </p>
                            </Link>
                            <Link
                                href="/doctor/register"
                                className="group relative rounded-xl border border-q-azure-100 bg-white p-4 text-left transition hover:border-q-azure-300 hover:bg-q-azure-50"
                            >
                                <span className="absolute right-2.5 top-2.5">
                                    <Circle size={18} weight="regular" className="text-q-azure-200" />
                                </span>
                                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-q-azure-100 text-q-azure-700">
                                    <FirstAidKit size={20} weight="regular" />
                                </div>
                                <p className="text-[14px] font-semibold text-q-heading">Doctor</p>
                                <p className="mt-1 text-[11px] leading-4 text-q-muted-text">
                                    Provide care and manage patient consultations
                                </p>
                            </Link>
                        </div>

                        <Link
                            href="/patient/register"
                            className="q-btn-primary mt-5 inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-sm font-semibold"
                        >
                            Continue
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
