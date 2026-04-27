import { Suspense } from "react";
import { VerifyEmailScreen } from "@/components/auth/VerifyEmailScreen";

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-white text-muted-foreground">
                    Loading…
                </div>
            }
        >
            <VerifyEmailScreen />
        </Suspense>
    );
}
