"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Lock } from "lucide-react";

export type DoctorDetails = {
    name: string;
    title: string;
    avatarUrl: string;
    specialties: string;
    experience: string;
    languages: string;
    affiliation: string;
    education: Array<{ period: string; degree: string; institution: string }>;
};

type DoctorDetailsCardProps = {
    doctor: DoctorDetails;
    onClose?: () => void;
};

export function DoctorDetailsCard({ doctor, onClose }: DoctorDetailsCardProps) {
    const router = useRouter();

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            router.back();
        }
    };
    return (
        <div className="flex h-full flex-col rounded-[28px] border border-[var(--q-card-border)] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
                    <Image
                        src={doctor.avatarUrl}
                        alt={doctor.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                    />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-[var(--q-text)]">{doctor.name}</h2>
                    <p className="text-sm text-[var(--q-muted)]">{doctor.title}</p>
                </div>
            </div>

            {/* Info list */}
            <ul className="mt-6 list-disc space-y-2 border-t border-[var(--q-card-border)] pl-5 pt-6 text-sm text-[var(--q-text)]">
                <li>
                    <span className="font-medium">Specialities: </span>
                    {doctor.specialties}
                </li>
                <li>
                    <span className="font-medium">Experience: </span>
                    {doctor.experience}
                </li>
                <li>
                    <span className="font-medium">Languages: </span>
                    {doctor.languages}
                </li>
                <li>
                    <span className="font-medium">Affiliation: </span>
                    {doctor.affiliation}
                </li>
            </ul>

            {/* Education */}
            {doctor.education.length > 0 && (
            <div className="mt-6 border-t border-[var(--q-card-border)] pt-6">
                <h3 className="mb-4 text-sm font-semibold text-[var(--q-text)]">Education</h3>
                <ul className="space-y-5 text-sm text-[var(--q-text)]">
                    {doctor.education.map((edu, i) => (
                        <li key={i} className="flex flex-col gap-2">
                            <span className="font-medium">{edu.period}</span>
                            <span>{edu.degree}</span>
                            <span className="text-[var(--q-muted)]">{edu.institution}</span>
                        </li>
                    ))}
                </ul>
            </div>
            )}

            {/* Security badges */}
            <div className="mt-6 flex flex-col gap-2 border-t border-[var(--q-card-border)] pt-6">
                <div className="flex items-center gap-2 text-sm text-[var(--q-text)]">
                    <Check className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
                    <span>Licensed in Germany</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--q-text)]">
                    <Lock className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
                    <span>Your session is encrypted and private</span>
                </div>
            </div>

            {/* Close button */}
            <div className="mt-auto pt-6">
                <button
                    type="button"
                    onClick={handleClose}
                    className="w-full rounded-2xl border border-[var(--q-card-border)] px-6 py-3 text-sm font-medium text-[var(--q-text)] shadow-sm hover:opacity-95"
                    style={{
                        background: "linear-gradient(270deg, #E7B3B3 3.37%, #EEF6FF 46.15%, #EEF6FF 75.96%)",
                    }}
                >
                    Close
                </button>
            </div>
        </div>
    );
}
