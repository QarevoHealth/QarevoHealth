import Link from "next/link";
import { AuthHeader } from "@/components/auth/AuthHeader";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white">
            <AuthHeader />
            <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
                <div className="rounded-2xl border border-border bg-white p-8 shadow-card sm:p-10">
                    <h1 className="text-2xl font-extrabold text-primary">Terms and conditions</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Placeholder for legal copy. Final terms will be provided by
                        your team and counsel.
                    </p>
                    <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                        <li>Use of the Qarevo Health platform and services</li>
                        <li>User responsibilities and acceptable use</li>
                        <li>Limitation of liability and governing law</li>
                    </ul>
                    <p className="mt-8 text-sm text-muted-foreground">
                        <Link
                            href="/"
                            className="font-semibold text-primary hover:underline"
                        >
                            Back to home
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
