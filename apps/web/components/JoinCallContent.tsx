"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChimeMeeting } from "@/components/ChimeMeeting";
import type { ChimeJoinResponse } from "@/lib/chime";

const STORAGE_KEY = "chime-join-direct";

export function JoinCallContent() {
    const router = useRouter();
    const [joinData, setJoinData] = useState<ChimeJoinResponse | null>(null);

    useEffect(() => {
        const stored = typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setJoinData(JSON.parse(stored) as ChimeJoinResponse);
            } catch {
                router.replace("/");
            }
        } else {
            router.replace("/");
        }
    }, [router]);

    const handleEndCall = () => {
        if (typeof window !== "undefined") {
            sessionStorage.removeItem(STORAGE_KEY);
        }
        router.push("/");
    };

    if (!joinData) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <p className="text-[var(--q-muted)]">Loading...</p>
            </div>
        );
    }

    return (
        <ChimeMeeting
            joinData={joinData}
            consultationId="direct"
            doctorA="Doctor"
            doctorASpec="Clinician"
            patientName="You"
            onEndCall={handleEndCall}
        />
    );
}
