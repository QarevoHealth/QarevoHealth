import { Suspense } from "react";
import { CompleteProfileScreen } from "@/components/auth/CompleteProfileScreen";

function CompleteProfileFallback() {
    return <div className="min-h-screen bg-white" aria-hidden />;
}

export default function CompleteProfilePage() {
    return (
        <Suspense fallback={<CompleteProfileFallback />}>
            <CompleteProfileScreen />
        </Suspense>
    );
}
