"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DoctorDetailsCard } from "@/components/DoctorDetailsCard";
import { WaitingCallCard } from "@/components/WaitingCallCard";
import type { DoctorDetails } from "@/components/DoctorDetailsCard";
// API provider – flexible to handle different backend structures
type ApiProvider = {
    name?: string;
    full_name?: string;
    specialty?: string;
    specialties?: string | string[];
    experience_years?: number;
    avatar_url?: string | null;
    languages?: string;
    affiliation?: string;
};

// Hardcoded fallbacks when API doesn't provide
const HARDCODED_LANGUAGES = "English and German";
const HARDCODED_AFFILIATION = "Qarevo Health Clinic";
const DEFAULT_EDUCATION = [
    { period: "2012 – 2018", degree: "Doctor of Medicine (MD)", institution: "University of Heidelberg, Germany" },
    { period: "2018 – 2023", degree: "Residency in General Practice / Family Medicine", institution: "Charité University Hospital, Berlin, Germany" },
];

function toSpecialtyString(p: ApiProvider): string {
    if (p.specialty && typeof p.specialty === "string") return p.specialty;
    if (p.specialties) {
        if (typeof p.specialties === "string") return p.specialties;
        if (Array.isArray(p.specialties)) return p.specialties.join(", ");
    }
    return "";
}

function providerToDoctorDetails(p: ApiProvider): DoctorDetails {
    const specialty = toSpecialtyString(p);
    return {
        name: p.full_name ?? p.name ?? "",
        title: specialty,
        avatarUrl: p.avatar_url ?? "/mock/doctor2.png",
        specialties: specialty,
        experience: p.experience_years != null ? `${p.experience_years} years` : "",
        languages: p.languages ?? HARDCODED_LANGUAGES,
        affiliation: p.affiliation ?? HARDCODED_AFFILIATION,
        education: DEFAULT_EDUCATION,
    };
}

// Fallback when no provider from DB (e.g. direct link, refresh) – leave blank
const FALLBACK_DOCTOR: DoctorDetails = {
    name: "",
    title: "",
    avatarUrl: "/mock/doctor2.png",
    specialties: "",
    experience: "",
    languages: HARDCODED_LANGUAGES,
    affiliation: HARDCODED_AFFILIATION,
    education: DEFAULT_EDUCATION,
};

const DEFAULT_PATIENT_USER_ID = "4b7966a0-0630-4f9f-8a90-c77372b9fb18";

export function WaitingScreen() {
    const params = useParams();
    const consultationId = (params?.id as string) ?? "123";
    const userId = params?.userId as string | undefined;
    const [doctorDetails, setDoctorDetails] = useState<DoctorDetails>(FALLBACK_DOCTOR);

    useEffect(() => {
        if (!consultationId || consultationId === "123") return;

        const loadProviders = async () => {
            try {
                const res = await fetch(`/api/v1/consultations/${consultationId}/providers`);
                const data = await res.json();
                const providers = Array.isArray(data) ? data : data?.providers;
                if (res.ok && Array.isArray(providers) && providers.length > 0) {
                    const first = providers[0];
                    setDoctorDetails(providerToDoctorDetails(first as ApiProvider));
                }
            } catch (err) {
                console.error("[WaitingScreen] Failed to fetch providers:", err);
            }
        };

        loadProviders();
    }, [consultationId]);

    return (
        <AppShell>
            <div className="flex flex-col items-center justify-center gap-8 lg:flex-row lg:items-start lg:gap-10">
                <div className="w-full max-w-[727px] lg:min-h-[567px] lg:w-[727px]">
                    <WaitingCallCard
                        doctorName={doctorDetails.name}
                        videoPreviewSrc="/mock/doctor3.png"
                        consultationId={consultationId}
                        userId={userId ?? DEFAULT_PATIENT_USER_ID}
                        role={userId ? "doctor" : "patient"}
                    />
                </div>
                <div className="flex w-full max-w-[392px] lg:min-h-[504px] lg:w-[392px]">
                    <DoctorDetailsCard doctor={doctorDetails} />
                </div>
            </div>
        </AppShell>
    );
}
