import { Suspense } from "react";
import { AuthCard } from "./AuthCard";
import { AuthHeader } from "./AuthHeader";
import { AuthHero } from "./AuthHero";
import { LoginForm } from "./LoginForm";

function LoginFormFallback() {
    return <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>;
}

export function LoginScreen() {
    return (
        <div className="min-h-screen bg-white">
            <AuthHeader />
            <main className="mx-auto flex min-h-[calc(100dvh-72px)] w-full items-center justify-center px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
                <AuthCard
                    form={
                        <Suspense fallback={<LoginFormFallback />}>
                            <LoginForm />
                        </Suspense>
                    }
                    hero={<AuthHero />}
                />
            </main>
        </div>
    );
}
