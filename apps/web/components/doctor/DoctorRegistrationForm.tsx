"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Eye, EyeSlash } from "phosphor-react";
import { PasswordValidationHints } from "@/components/PasswordValidationHints";
import { DoctorExpertiseMultiSelect } from "@/components/doctor/DoctorExpertiseMultiSelect";
import { passwordMeetsPolicy } from "@/lib/password-policy";

type FieldKey = "firstName" | "lastName" | "email" | "password" | "terms";

type FieldErrors = Partial<Record<FieldKey, string>>;

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function DoctorRegistrationForm({
    onRegistrationSuccess,
}: {
    /** Called after successful signup with the email used (moves flow to email verification). */
    onRegistrationSuccess?: (email: string) => void;
} = {}) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [expertiseValues, setExpertiseValues] = useState<string[]>([]);
    const [street, setStreet] = useState("");
    const [city, setCity] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState("");

    function runValidation(): FieldErrors {
        const e: FieldErrors = {};
        if (!firstName.trim()) e.firstName = "First name is required.";
        if (!lastName.trim()) e.lastName = "Last name is required.";
        const em = email.trim();
        if (!em) e.email = "Email is required.";
        else if (!isValidEmail(em)) e.email = "Enter a valid email address.";
        if (!password) e.password = "Password is required.";
        else if (!passwordMeetsPolicy(password))
            e.password = "Password must meet all requirements below.";
        if (!acceptedTerms) e.terms = "You must accept the terms and privacy policy to continue.";
        return e;
    }

    function clearFieldError(key: FieldKey) {
        setFieldErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setFormError("");

        const next = runValidation();
        setFieldErrors(next);
        if (Object.keys(next).length > 0) return;

        setLoading(true);
        try {
            // TODO: POST /api/v1/doctor/register when backend is ready (include expertiseValues, address)
            await new Promise((r) => setTimeout(r, 400));
            const registeredEmail = email.trim();
            setPassword("");
            setFieldErrors({});
            onRegistrationSuccess?.(registeredEmail);
        } catch {
            setFormError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const labelClass = "mb-2 block text-sm font-semibold text-q-heading";

    function inputClass(hasError: boolean) {
        return [
            "w-full rounded-md border bg-white px-4 py-3 text-sm text-q-heading placeholder:text-q-muted-text outline-none",
            hasError
                ? "border-q-danger focus:border-q-danger focus:ring-1 focus:ring-q-danger/30"
                : "border-q-border-input focus:border-q-accent focus:ring-1 focus:ring-q-accent/25",
        ].join(" ");
    }

    return (
        <div className="rounded-2xl border border-q-azure-200 bg-white p-6 shadow-[0_2px_12px_rgba(20,52,93,0.06)] sm:p-8">
            <h1 className="text-[30px] font-bold leading-tight text-q-heading">Registration for doctors</h1>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <label htmlFor="doc-first-name" className={labelClass}>
                            First name
                        </label>
                        <input
                            id="doc-first-name"
                            type="text"
                            autoComplete="given-name"
                            value={firstName}
                            onChange={(e) => {
                                setFirstName(e.target.value);
                                clearFieldError("firstName");
                            }}
                            aria-invalid={Boolean(fieldErrors.firstName)}
                            className={inputClass(Boolean(fieldErrors.firstName))}
                        />
                        {fieldErrors.firstName ? (
                            <p className="mt-1.5 text-xs font-medium text-q-danger" role="alert">
                                {fieldErrors.firstName}
                            </p>
                        ) : null}
                    </div>
                    <div>
                        <label htmlFor="doc-last-name" className={labelClass}>
                            Last name
                        </label>
                        <input
                            id="doc-last-name"
                            type="text"
                            autoComplete="family-name"
                            value={lastName}
                            onChange={(e) => {
                                setLastName(e.target.value);
                                clearFieldError("lastName");
                            }}
                            aria-invalid={Boolean(fieldErrors.lastName)}
                            className={inputClass(Boolean(fieldErrors.lastName))}
                        />
                        {fieldErrors.lastName ? (
                            <p className="mt-1.5 text-xs font-medium text-q-danger" role="alert">
                                {fieldErrors.lastName}
                            </p>
                        ) : null}
                    </div>
                </div>

                <div>
                    <label htmlFor="doc-expertise-trigger" className={labelClass}>
                        Field of expertise{" "}
                        <span className="font-normal text-q-muted-text">(optional)</span>
                    </label>
                    <DoctorExpertiseMultiSelect
                        id="doc-expertise-trigger"
                        selected={expertiseValues}
                        onChange={setExpertiseValues}
                    />
                </div>

                <div className="space-y-3">
                    <p className={`${labelClass} mb-0`}>
                        Practice address{" "}
                        <span className="font-normal text-q-muted-text">(optional)</span>
                    </p>
                    <input
                        type="text"
                        autoComplete="street-address"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Street, house number"
                        className={inputClass(false)}
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="sm:col-span-2">
                            <input
                                type="text"
                                autoComplete="address-level2"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="City"
                                className={inputClass(false)}
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                autoComplete="postal-code"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                                placeholder="Postal code"
                                className={inputClass(false)}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="doc-email" className={labelClass}>
                        Email address
                    </label>
                    <input
                        id="doc-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            clearFieldError("email");
                        }}
                        placeholder="email@domain.com"
                        aria-invalid={Boolean(fieldErrors.email)}
                        className={inputClass(Boolean(fieldErrors.email))}
                    />
                    {fieldErrors.email ? (
                        <p className="mt-1.5 text-xs font-medium text-q-danger" role="alert">
                            {fieldErrors.email}
                        </p>
                    ) : null}
                </div>

                <div className="relative">
                    <label htmlFor="doc-password" className={labelClass}>
                        Password
                    </label>
                    <input
                        id="doc-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={20}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            clearFieldError("password");
                            if (formError) setFormError("");
                        }}
                        placeholder="********"
                        aria-invalid={Boolean(fieldErrors.password)}
                        className={inputClass(Boolean(fieldErrors.password)) + " pr-11"}
                    />
                    <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-[38px] text-q-accent"
                    >
                        {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                    </button>
                    {fieldErrors.password ? (
                        <p className="mt-1.5 text-xs font-medium text-q-danger" role="alert">
                            {fieldErrors.password}
                        </p>
                    ) : null}
                    <PasswordValidationHints value={password} className="mt-2" />
                </div>

                <div>
                    
                    {fieldErrors.terms ? (
                        <p className="mt-1.5 text-xs font-medium text-q-danger" role="alert">
                            {fieldErrors.terms}
                        </p>
                    ) : null}
                </div>

                {formError ? <p className="text-sm text-q-danger">{formError}</p> : null}

                <button
                    type="submit"
                    disabled={loading}
                    className="q-btn-primary w-full rounded-md px-4 py-3.5 text-sm font-semibold disabled:opacity-60"
                >
                    {loading ? "Please wait..." : "Continue"}
                </button>
                   <span className="leading-snug">
                            I accept the platform&apos;s{" "}
                            <Link href="#" className="font-semibold text-q-link hover:underline">
                                terms and conditions
                            </Link>{" "}
                            and{" "}
                            <Link href="#" className="font-semibold text-q-link hover:underline">
                                privacy policy
                            </Link>
                            .
                        </span>
                        <div>
                            <label className="flex cursor-pointer items-start gap-3 text-sm text-q-muted-text">
                        <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => {
                                setAcceptedTerms(e.target.checked);
                                clearFieldError("terms");
                                if (formError) setFormError("");
                            }}
                            aria-invalid={Boolean(fieldErrors.terms)}
                            className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded border-2 border-q-accent bg-white text-q-accent accent-q-accent focus:ring-2 focus:ring-q-accent/30"
                        />
                     
                    </label>
                        </div>
            </form>

           
        </div>
    );
}
