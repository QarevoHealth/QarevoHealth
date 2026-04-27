import { Suspense } from "react";
import { JoinPageContent } from "./JoinPageContent";

function JoinLoading() {
    return <div className="min-h-screen bg-white" aria-hidden />;
}

export default function JoinPage() {
    return (
        <Suspense fallback={<JoinLoading />}>
            <JoinPageContent />
        </Suspense>
    );
}
