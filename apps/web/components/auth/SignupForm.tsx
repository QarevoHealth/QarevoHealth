"use client";

import type { Consents, Gender } from "@/lib/api/types/common";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConsentCheckboxes } from "./ConsentCheckboxes";
import { FormField } from "./FormField";
import { PasswordField } from "./PasswordField";
import { SocialAuthButtons } from "./SocialAuthButtons";

type FormState = {
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    password: string;
    country_code: string;
    phone: string;
    date_of_birth: string;
    gender: Gender | "";
};

const INITIAL_STATE: FormState = {
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    password: "",
    country_code: "+91",
    phone: "",
    date_of_birth: "",
    gender: "",
};

const INITIAL_CONSENTS: Consents = {
    terms_privacy: false,
    telehealth: false,
    marketing: false,
};

type SignupFormProps = {
    role?: "patient" | "doctor";
};

function passwordError(password: string): string | null {
    if (password.length < 8) return "Password must be 8+ characters";
    if (!/[A-Z]/.test(password)) return "Add an uppercase letter";
    if (!/[a-z]/.test(password)) return "Add a lowercase letter";
    if (!/\d/.test(password)) return "Add a number";
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password))
        return "Add a special character";
    return null;
}

function Divider() {
    return (
        <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border-subtle" />
            <span className="text-xs font-medium text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border-subtle" />
        </div>
    );
}

export function SignupForm({ role = "patient" }: SignupFormProps) {
    const router = useRouter();
    const [form, setForm] = useState<FormState>(INITIAL_STATE);
    const [consents, setConsents] = useState<Consents>(INITIAL_CONSENTS);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    };

    const validatePatient = (): boolean => {
        const next: Record<string, string> = {};
        if (!form.email.trim()) next.email = "Email is required";
        const pe = passwordError(form.password);
        if (pe) next.password = pe;
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const validateDoctor = (): boolean => {
        const next: Record<string, string> = {};
        if (!form.first_name.trim()) next.first_name = "First name is required";
        if (!form.last_name.trim()) next.last_name = "Last name is required";
        if (!form.email.trim()) next.email = "Email is required";
        const pe = passwordError(form.password);
        if (pe) next.password = pe;
        if (!/^\d+$/.test(form.phone)) next.phone = "Digits only";
        if (!form.date_of_birth) next.date_of_birth = "Date of birth is required";
        if (!form.gender) next.gender = "Select a gender";
        if (!consents.terms_privacy || !consents.telehealth)
            next.consents = "You must accept Terms and Telehealth consent";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (role === "patient") {
            if (!validatePatient()) return;
        } else {
            if (!validateDoctor()) return;
        }

        const email = form.email.trim().toLowerCase();
        router.push(
            `/verify-email?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`
        );
    };

    const isPatient = role === "patient";
    const showOptional = isPatient;

    if (isPatient) {
        return (
            <div className="mx-auto flex h-full w-full max-w-[400px] flex-col justify-center lg:ml-auto lg:mr-0">
                <h1 className="mt-6 text-2xl font-extrabold leading-8 text-primary">
                    Create your free account
                </h1>

                <div className="mt-6">
                    <SocialAuthButtons />
                </div>

                <Divider />

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <FormField
                        id="email"
                        label="Email address"
                        type="email"
                        value={form.email}
                        onChange={(v) => set("email", v)}
                        placeholder="email@domain.com"
                        required
                        autoComplete="email"
                        error={errors.email}
                    />

                    <div className="flex flex-col">
                        <PasswordField
                            value={form.password}
                            onChange={(v) => set("password", v)}
                            placeholder="••••••••"
                        />
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="mt-1 h-10 w-full rounded-lg bg-primary text-sm font-semibold text-white transition hover:opacity-95"
                    >
                        Continue
                    </button>
                </form>

                <p className="mt-4 text-center text-xs font-medium leading-relaxed text-muted-foreground">
                    By continuing, you confirm that you have read and agree to our{" "}
                    <Link
                        href="/terms"
                        className="font-semibold text-primary hover:underline"
                    >
                        terms and conditions
                    </Link>{" "}
                    and our{" "}
                    <Link
                        href="/privacy"
                        className="font-semibold text-primary hover:underline"
                    >
                        privacy policy
                    </Link>
                    .
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto flex h-full w-full max-w-[400px] flex-col justify-center lg:ml-auto lg:mr-0">
            <h1 className="text-2xl font-extrabold leading-8 text-primary">
                Create your free {role} account
            </h1>

            <div className="mt-6">
                <SocialAuthButtons />
            </div>

            <Divider />

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        id="first_name"
                        label={showOptional ? "First name (optional)" : "First name"}
                        value={form.first_name}
                        onChange={(v) => set("first_name", v)}
                        required={!isPatient}
                        autoComplete="given-name"
                        error={errors.first_name}
                    />
                    <FormField
                        id="last_name"
                        label={showOptional ? "Last name (optional)" : "Last name"}
                        value={form.last_name}
                        onChange={(v) => set("last_name", v)}
                        required={!isPatient}
                        autoComplete="family-name"
                        error={errors.last_name}
                    />
                </div>

                <FormField
                    id="email"
                    label="Email address"
                    type="email"
                    value={form.email}
                    onChange={(v) => set("email", v)}
                    placeholder="email@domain.com"
                    required
                    autoComplete="email"
                    error={errors.email}
                />

                <PasswordField
                    value={form.password}
                    onChange={(v) => set("password", v)}
                />
                {errors.password && (
                    <p className="-mt-3 text-xs text-red-500">{errors.password}</p>
                )}

                <div className="grid grid-cols-[90px_1fr] gap-3">
                    <FormField
                        id="country_code"
                        label="Code"
                        value={form.country_code}
                        onChange={(v) => set("country_code", v)}
                        placeholder="+91"
                        required={!isPatient}
                        error={errors.country_code}
                    />
                    <FormField
                        id="phone"
                        label={showOptional ? "Phone (optional)" : "Phone number"}
                        type="tel"
                        value={form.phone}
                        onChange={(v) => set("phone", v)}
                        placeholder="9876543210"
                        required={!isPatient}
                        autoComplete="tel"
                        error={errors.phone}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        id="date_of_birth"
                        label={showOptional ? "Date of birth (optional)" : "Date of birth"}
                        type="date"
                        value={form.date_of_birth}
                        onChange={(v) => set("date_of_birth", v)}
                        required={!isPatient}
                        error={errors.date_of_birth}
                    />
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="gender"
                            className="text-xs font-semibold text-primary"
                        >
                            {showOptional ? "Gender (optional)" : "Gender"}
                            {!isPatient && <span className="text-red-500"> *</span>}
                        </label>
                        <select
                            id="gender"
                            value={form.gender}
                            onChange={(e) => set("gender", e.target.value as Gender)}
                            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 ${
                                errors.gender
                                    ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                                    : "border-slate-200 focus:border-secondary focus:ring-secondary/25"
                            }`}
                        >
                            <option value="">Select…</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                        </select>
                        {errors.gender && (
                            <p className="text-xs text-red-500">{errors.gender}</p>
                        )}
                    </div>
                </div>

                <ConsentCheckboxes
                    value={consents}
                    onChange={setConsents}
                    error={errors.consents}
                    optional={isPatient}
                />

                <button
                    type="submit"
                    className="mt-2 h-10 w-full rounded-md bg-primary text-sm font-semibold text-white transition hover:opacity-95"
                >
                    Continue
                </button>
            </form>

            <p className="mt-4 text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="font-semibold text-primary hover:underline"
                >
                    Sign in
                </Link>
            </p>
        </div>
    );
}
