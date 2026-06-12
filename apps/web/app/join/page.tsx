"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";

function JoinPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const meetingId = searchParams.get("meetingId");
        const joinToken = searchParams.get("joinToken");
        const attendeeId = searchParams.get("attendeeId");

        if (!meetingId || !joinToken || !attendeeId) {
            const timeoutId = window.setTimeout(() => {
                setError("Invalid join link: missing meetingId, joinToken, or attendeeId");
            }, 0);
            return () => window.clearTimeout(timeoutId);
        }

        const run = async () => {
            try {
                const res = await fetch(
                    `/api/meetings/${encodeURIComponent(meetingId)}/join-info?joinToken=${encodeURIComponent(joinToken)}&attendeeId=${encodeURIComponent(attendeeId)}`
                );
                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? "Failed to get join info");

                sessionStorage.setItem("chime-join-direct", JSON.stringify(data));
                router.replace(`/join/call?meetingId=${encodeURIComponent(meetingId)}`);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to join meeting");
            }
        };

        run();
    }, [searchParams, router]);

    if (error) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
                <p className="text-center text-red-600">{error}</p>
                <button
                    onClick={() => router.push("/")}
                    className="rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white"
                >
                    Go to Home
                </button>
            </div>
        );
    }

    return <JoinLoading />;
}

export default function JoinPage() {
    return (
        <AppShell>
            <Suspense fallback={<JoinLoading />}>
                <JoinFlow />
            </Suspense>
        </AppShell>
    );
}

export default function JoinPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <JoinPageContent />
        </Suspense>
    );
}
