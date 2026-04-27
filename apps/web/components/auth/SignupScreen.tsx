import { AuthCard } from "./AuthCard";
import { AuthHeader } from "./AuthHeader";
import { AuthHero } from "./AuthHero";
import { SignupForm } from "./SignupForm";

type SignupScreenProps = {
    role?: "patient" | "doctor";
};

export function SignupScreen({ role = "patient" }: SignupScreenProps) {
    return (
        <div className="min-h-screen bg-white">
            <AuthHeader />

            <main className="flex min-h-[calc(100dvh-72px)] w-full items-center justify-center px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
                <AuthCard
                    form={<SignupForm role={role} />}
                    hero={<AuthHero />}
                />
            </main>
        </div>
    );
}