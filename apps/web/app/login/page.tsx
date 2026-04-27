import { Suspense } from "react";
import { LoginScreen } from "@/components/auth/LoginScreen";

function LoginRouteFallback() {
    return <div className="min-h-screen bg-white" aria-hidden />;
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginRouteFallback />}>
            <LoginScreen />
        </Suspense>
    );
}
