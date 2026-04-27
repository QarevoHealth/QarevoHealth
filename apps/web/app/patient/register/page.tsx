"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { AuthImageSlider } from "@/components/AuthImageSlider";
import { CaretDown, Eye, EyeSlash, FirstAidKit, UserCircle, X } from "phosphor-react";

export default function PatientRegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [apiError, setApiError] = useState("");
    const [showLoginRoleMenu, setShowLoginRoleMenu] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [selectedLoginRole, setSelectedLoginRole] = useState<"patient" | "doctor">("patient");
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [loginSuccess, setLoginSuccess] = useState("");

    function resetLoginFormState() {
        setLoginEmail("");
        setLoginPassword("");
        setShowLoginPassword(false);
        setLoginLoading(false);
        setLoginError("");
        setLoginSuccess("");
    }

    function isValidPassword(value: string) {
        if (value.length < 8 || value.length > 20) return false;
        if (!/[A-Z]/.test(value)) return false;
        if (!/[a-z]/.test(value)) return false;
        if (!/\d/.test(value)) return false;
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(value)) return false;
        return true;
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!isValidPassword(password)) {
            setPasswordError(
                "Password must be 8-20 characters with uppercase, lowercase, number, and special character."
            );
            return;
        }

        setLoading(true);
        setMessage("");
        setApiError("");
        setPasswordError("");
        try {
            const res = await fetch("/api/v1/patient/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password,
                    consents: {
                        terms_privacy: true,
                        telehealth: true,
                        marketing: false,
                    },
                }),
            });

            const data = (await res.json().catch(() => ({}))) as {
                message?: string;
                detail?: string | { msg?: string }[];
                error?: string;
            };

            if (!res.ok) {
                const detailText = Array.isArray(data.detail)
                    ? data.detail.map((item) => item.msg).filter(Boolean).join(", ")
                    : data.detail;
                throw new Error(data.error || detailText || "Patient registration failed");
            }

            setMessage(data.message || "Registration successful.");
        } catch (error) {
            setApiError(error instanceof Error ? error.message : "Patient registration failed");
        } finally {
            setLoading(false);
        }
    }

    async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoginError("");
        setLoginSuccess("");

        if (selectedLoginRole !== "patient") {
            setLoginError("Doctor login API is not wired in this form yet.");
            return;
        }

        setLoginLoading(true);
        try {
            const res = await fetch("/api/v1/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: loginEmail,
                    password: loginPassword,
                }),
            });

            const data = (await res.json().catch(() => ({}))) as {
                message?: string;
                detail?: string | { msg?: string }[];
                error?: string;
                access_token?: string;
            };

            if (!res.ok) {
                const detailText = Array.isArray(data.detail)
                    ? data.detail.map((item) => item.msg).filter(Boolean).join(", ")
                    : data.detail;
                throw new Error(data.error || detailText || "Login failed");
            }

            setLoginSuccess(data.message || "Login successful.");
        } catch (error) {
            setLoginError(error instanceof Error ? error.message : "Login failed");
        } finally {
            setLoginLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-white">
            <header className="relative z-10 flex items-center justify-between border-b border-[#e0e6ef] bg-white/80 px-10 py-4 backdrop-blur">
                <div className="flex items-center gap-2">
                    <Image src="/logo-symbol.png" alt="Qarevo logo" width={24} height={24} />
                    <span className="text-[30px] font-semibold text-[#16355e]">Qarevo Health</span>
                </div>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowLoginRoleMenu((prev) => !prev)}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#16355e]"
                    >
                        Do you already have an account? <span className="underline">Log in</span> <CaretDown size={12} />
                    </button>

                    {showLoginRoleMenu ? (
                        <div className="absolute right-0 top-[34px] z-30 min-w-[170px] rounded-md border border-[#dce4ef] bg-white shadow-md">
                            <p className="px-3 pt-2 text-xs font-semibold uppercase text-[#7b8aa1]">Continue as:</p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedLoginRole("patient");
                                    resetLoginFormState();
                                    setShowLoginRoleMenu(false);
                                    setShowLoginModal(true);
                                }}
                                className="flex w-full items-center gap-2 border-t border-[#eef3f8] px-3 py-2 text-left text-sm font-medium text-[#1f3556] hover:bg-[#f7fbff]"
                            >
                                <UserCircle size={16} /> Patient
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedLoginRole("doctor");
                                    resetLoginFormState();
                                    setShowLoginRoleMenu(false);
                                    setShowLoginModal(true);
                                }}
                                className="flex w-full items-center gap-2 border-t border-[#eef3f8] px-3 py-2 text-left text-sm font-medium text-[#1f3556] hover:bg-[#f7fbff]"
                            >
                                <FirstAidKit size={16} /> Doctor
                            </button>
                        </div>
                    ) : null}
                </div>
            </header>

            <main className="relative z-10 mx-auto mt-14 w-[92%] max-w-6xl rounded-2xl border border-[#e5ebf2] bg-white/70 p-6 backdrop-blur">
                <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[#e3e8ef] bg-white p-8 lg:grid-cols-2">
                    <section className="pr-0 lg:pr-8">
                        <h1 className="text-5xl font-bold text-[#16355e]">Create your free account</h1>

                        <div className="mt-6 grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                className="rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-sm font-semibold text-[#2b466b]"
                            >
                                Google
                            </button>
                            <button
                                type="button"
                                className="rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-sm font-semibold text-[#2b466b]"
                            >
                                Apple
                            </button>
                            <button
                                type="button"
                                className="rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-sm font-semibold text-[#2b466b]"
                            >
                                Microsoft
                            </button>
                        </div>

                        <div className="my-4 flex items-center gap-2 text-[#9aabc0]">
                            <div className="h-px flex-1 bg-[#dbe4ef]" />
                            <span className="text-xs font-medium">or</span>
                            <div className="h-px flex-1 bg-[#dbe4ef]" />
                        </div>

                        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#405676]">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@domain.com"
                                    className="w-full rounded-md border border-[#d6deea] px-4 py-3 text-[#1f3556] outline-none focus:border-[#6fa9d5]"
                                />
                            </div>

                            <div className="relative">
                                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#405676]">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength={8}
                                    maxLength={20}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (passwordError) setPasswordError("");
                                    }}
                                    placeholder="********"
                                    className="w-full rounded-md border border-[#d6deea] px-4 py-3 pr-11 text-[#1f3556] outline-none focus:border-[#6fa9d5]"
                                />
                                <button
                                    type="button"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-[38px] text-[#7b95b4]"
                                >
                                    {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                                </button>
                                {passwordError ? <p className="mt-2 text-xs text-red-600">{passwordError}</p> : null}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-md bg-[#14528f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f467b] disabled:opacity-60"
                            >
                                {loading ? "Please wait..." : "Continue"}
                            </button>
                        </form>

                        <p className="mt-4 text-sm text-[#6d7e95]">
                            By continuing, you confirm that you have read and agree to our{" "}
                            <span className="font-semibold text-[#16355e]">terms and conditions</span> and{" "}
                            our <span className="font-semibold text-[#16355e]">privacy policy</span>.
                        </p>

                        {apiError ? <p className="mt-3 text-sm text-red-600">{apiError}</p> : null}
                        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
                    </section>

                    <section className="mt-8 overflow-hidden rounded-2xl lg:mt-0">
                        <AuthImageSlider />
                    </section>
                </div>
            </main>

            {showLoginModal ? (
                <div className="absolute inset-0 z-40 flex items-center justify-center p-4">
                    <div className="absolute inset-0 backdrop-blur-[8px]" />
                    <div className="absolute inset-0 bg-[#6f8fb7]/30" />

                    <div className="relative w-full max-w-[430px] rounded-2xl border border-[#dce4ef] bg-white p-4 shadow-[0_20px_50px_rgba(20,52,93,0.25)]">
                        <button
                            type="button"
                            aria-label="Close login modal"
                            onClick={() => {
                                setShowLoginModal(false);
                                resetLoginFormState();
                            }}
                            className="absolute right-4 top-4 text-[#8a99ae]"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-[32px] font-bold text-[#1f3556]">Log in to your account</h3>

                        <div className="mt-4 space-y-2">
                            <button
                                type="button"
                                className="w-full rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-sm font-semibold text-[#2b466b]"
                            >
                                Continue with Google
                            </button>
                            <button
                                type="button"
                                className="w-full rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-sm font-semibold text-[#2b466b]"
                            >
                                Continue with Apple
                            </button>
                            <button
                                type="button"
                                className="w-full rounded-md border border-[#c8d7e8] bg-white px-3 py-2 text-sm font-semibold text-[#2b466b]"
                            >
                                Continue with Microsoft
                            </button>
                        </div>

                        <div className="my-4 flex items-center gap-2 text-[#9aabc0]">
                            <div className="h-px flex-1 bg-[#dbe4ef]" />
                            <span className="text-xs font-medium">or</span>
                            <div className="h-px flex-1 bg-[#dbe4ef]" />
                        </div>

                        <form onSubmit={handleLoginSubmit}>
                        <div>
                            <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-[#405676]">
                                Email address
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                required
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                placeholder="email@domain.com"
                                className="w-full rounded-md border border-[#d6deea] px-4 py-3 text-[#1f3556] outline-none focus:border-[#6fa9d5]"
                            />
                        </div>

                        <div className="relative mt-3">
                            <div className="mb-2 flex items-center justify-between">
                                <label htmlFor="login-password" className="text-sm font-semibold text-[#405676]">
                                    Password
                                </label>
                                <button type="button" className="text-sm font-semibold text-[#2f7dbd]">
                                    Reset password
                                </button>
                            </div>
                            <input
                                id="login-password"
                                type={showLoginPassword ? "text" : "password"}
                                required
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                placeholder="********"
                                className="w-full rounded-md border border-[#d6deea] px-4 py-3 pr-11 text-[#1f3556] outline-none focus:border-[#6fa9d5]"
                            />
                            <button
                                type="button"
                                aria-label={showLoginPassword ? "Hide password" : "Show password"}
                                onClick={() => setShowLoginPassword((prev) => !prev)}
                                className="absolute right-3 top-[38px] text-[#7b95b4]"
                            >
                                {showLoginPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {loginError ? <p className="mt-3 text-sm text-red-600">{loginError}</p> : null}
                        {loginSuccess ? <p className="mt-3 text-sm text-emerald-700">{loginSuccess}</p> : null}

                        <button
                            type="submit"
                            disabled={loginLoading}
                            className="mt-4 w-full rounded-md bg-[#14528f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f467b] disabled:opacity-60"
                        >
                            {loginLoading
                                ? "Please wait..."
                                : `Continue as ${selectedLoginRole === "patient" ? "Patient" : "Doctor"}`}
                        </button>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
