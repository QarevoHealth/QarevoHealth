"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export default function JoinPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const meetingId = searchParams.get("meetingId");
        const joinToken = searchParams.get("joinToken");
        const attendeeId = searchParams.get("attendeeId");

        if (!meetingId || !joinToken || !attendeeId) {
            setError("Invalid join link: missing meetingId, joinToken, or attendeeId");
            return;
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
            <AppShell>
                <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
                    <p className="text-center text-red-600">{error}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white"
                    >
                        Go to Home
                    </button>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
                <Loader2 size={32} className="animate-spin text-sky-500" />
                <p className="text-[var(--q-muted)]">Joining meeting...</p>
            </div>
        </AppShell>
    );
}
