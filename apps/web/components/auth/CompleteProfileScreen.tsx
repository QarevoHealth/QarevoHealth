"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "./AuthCard";
import { AuthHeader } from "./AuthHeader";
import { AuthHero } from "./AuthHero";
import { FormField } from "./FormField";

type ProfileState = {
    first_name: string;
    last_name: string;
};

const INITIAL_STATE: ProfileState = {
    first_name: "",
    last_name: "",
};

export function CompleteProfileScreen() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const role = searchParams.get("role") ?? "patient";
    const [form, setForm] = useState<ProfileState>(INITIAL_STATE);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const set = <K extends keyof ProfileState>(key: K, value: ProfileState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.first_name.trim()) next.first_name = "First name is required";
        if (!form.last_name.trim()) next.last_name = "Last name is required";
        setErrors(next);
        if (Object.keys(next).length > 0) return;

        router.push(`/login?verified=1&role=${encodeURIComponent(role)}`);
    };

    const formView = (
        <div className="flex w-full max-w-[430px] flex-col">
            <div className="flex flex-col gap-3">
                <h1 className="whitespace-nowrap text-[42px] font-extrabold leading-[1.05] tracking-[-0.02em] text-primary">
                    Complete Your Profile
                </h1>
                <p className="text-sm font-medium leading-5 text-muted-foreground">
                    Please enter your first and last name to continue. This helps us
                    personalize your experience on the platform.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        id="first_name"
                        label="First name"
                        value={form.first_name}
                        onChange={(v) => set("first_name", v)}
                        autoComplete="given-name"
                        error={errors.first_name}
                    />
                    <FormField
                        id="last_name"
                        label="Last name"
                        value={form.last_name}
                        onChange={(v) => set("last_name", v)}
                        autoComplete="family-name"
                        error={errors.last_name}
                    />
                </div>

                <div className="flex items-center gap-2 rounded-md border border-[#7BD6E3]/55 bg-[#E8FAFD] px-3 py-2 text-sm font-semibold text-[#2A8B97]">
                    <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#79C9D4] text-[10px] leading-none"
                        aria-hidden
                    >
                        i
                    </span>
                    You can update this information later in your profile settings.
                </div>

                <button
                    type="submit"
                    className="h-10 w-full rounded-md bg-primary text-sm font-semibold text-white transition hover:opacity-95"
                >
                    Continue to Platform
                </button>
            </form>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <AuthHeader />
            <main className="mx-auto flex min-h-[calc(100dvh-72px)] w-full items-center justify-center px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
                <AuthCard form={formView} hero={<AuthHero />} />
            </main>
        </div>
    );
}
