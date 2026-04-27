import Link from "next/link";
import { AuthHeader } from "@/components/auth/AuthHeader";

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen bg-white">
            <AuthHeader />
            <main className="mx-auto flex max-w-md justify-center px-4 py-12 sm:px-6">
                <div className="w-full rounded-2xl border border-border bg-white p-8 shadow-card sm:p-10">
                    <h1 className="text-2xl font-extrabold text-primary">Reset password</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Enter the email for your account. We&apos;ll send a reset
                        link when the backend is connected (not available in this
                        demo).
                    </p>
                    <label
                        htmlFor="reset-email"
                        className="mt-6 block text-xs font-semibold text-primary"
                    >
                        Email address
                    </label>
                    <input
                        id="reset-email"
                        type="email"
                        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/25"
                        placeholder="email@domain.com"
                        autoComplete="email"
                        disabled
                        aria-disabled="true"
                    />
                    <button
                        type="button"
                        disabled
                        className="mt-4 h-10 w-full cursor-not-allowed rounded-lg bg-slate-300 text-sm font-semibold text-slate-600"
                    >
                        Send reset link
                    </button>
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        <Link
                            href="/login"
                            className="font-semibold text-primary hover:underline"
                        >
                            Back to log in
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
