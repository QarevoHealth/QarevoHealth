"use client";

import { BrandMark } from "@/components/brand/BrandMark";
import { Stethoscope, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RoleOptionCard } from "./RoleOptionCard";
type Role = "patient" | "doctor";

export function RoleSelectModal() {
    const router = useRouter();
    const [role, setRole] = useState<Role>("patient");

    const handleClose = () => {
        router.push("/");
    };

    const handleContinue = () => {
        if (role === "patient") {
            router.push("/signup/patient");
        } else {
            router.push("/signup/doctor");
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 p-4 backdrop-blur-sm"
        >
            <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
                <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Close"
                    className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                    <X size={18} />
                </button>

                <div className="flex flex-col items-center">
                    <BrandMark size={40} className="mb-3 h-10 w-10" />
                    <h2
                        id="role-modal-title"
                        className="text-lg font-bold text-primary"
                    >
                        Welcome to Qarevo Health
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        How would you like to continue?
                    </p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <RoleOptionCard
                        icon={User}
                        title="Patient"
                        description="Book appointments and consult with doctors"
                        selected={role === "patient"}
                        onClick={() => setRole("patient")}
                    />
                    <RoleOptionCard
                        icon={Stethoscope}
                        title="Doctor"
                        description="Provide care and manage patient consultations"
                        selected={role === "doctor"}
                        onClick={() => setRole("doctor")}
                    />
                </div>

                <button
                    type="button"
                    onClick={handleContinue}
                    className="mt-6 h-10 w-full rounded-md bg-primary px-5 text-sm font-semibold text-white transition hover:opacity-95"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
