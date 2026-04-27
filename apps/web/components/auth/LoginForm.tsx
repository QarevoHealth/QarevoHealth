"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FormField } from "./FormField";
import { PasswordField } from "./PasswordField";
import { SocialAuthButtons } from "./SocialAuthButtons";

function Divider() {
    return (
        <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border-subtle" />
            <span className="text-xs font-medium text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border-subtle" />
        </div>
    );
}

function passwordOk(password: string): boolean {
    return password.length >= 8;
}

export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const verified = searchParams.get("verified");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const next: { email?: string; password?: string } = {};
        if (!email.trim()) next.email = "Email is required";
        if (!password) next.password = "Password is required";
        else if (!passwordOk(password))
            next.password = "Password must be at least 8 characters";
        setErrors(next);
        if (Object.keys(next).length > 0) return;
        router.push("/");
    };

    return (
        <div className="mx-auto flex h-full w-full max-w-[400px] flex-col justify-center">
            <h1 className="text-2xl font-extrabold leading-8 text-primary">Log in</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
                Sign in to your Qarevo Health account.
            </p>

            {verified === "1" && (
                <div
                    className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-success"
                    role="status"
                >
                    Email verified. You can sign in (demo—no server yet).
                </div>
            )}

            <div className="mt-6">
                <SocialAuthButtons />
            </div>

            <Divider />

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FormField
                    id="login-email"
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="email@domain.com"
                    required
                    autoComplete="email"
                    error={errors.email}
                />
                <div className="flex flex-col">
                    <PasswordField
                        id="login-password"
                        value={password}
                        onChange={setPassword}
                        placeholder="••••••••"
                    />
                    {errors.password && (
                        <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                    )}
                </div>

                <div className="text-right">
                    <Link
                        href="/forgot-password"
                        className="text-sm font-semibold text-secondary hover:underline"
                    >
                        Forgot password?
                    </Link>
                </div>

                <button
                    type="submit"
                    className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-white transition hover:opacity-95"
                >
                    Continue
                </button>
            </form>

            <p className="mt-4 text-center text-xs font-medium leading-relaxed text-muted-foreground">
                By continuing, you agree to our{" "}
                <Link
                    href="/terms"
                    className="font-semibold text-primary hover:underline"
                >
                    terms
                </Link>{" "}
                and{" "}
                <Link
                    href="/privacy"
                    className="font-semibold text-primary hover:underline"
                >
                    privacy policy
                </Link>
                .
            </p>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                    href="/"
                    className="font-semibold text-primary hover:underline"
                >
                    Sign up
                </Link>
            </p>
        </div>
    );
}
