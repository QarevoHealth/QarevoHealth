"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateMeetingButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateMeeting = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/consultations", { method: "POST" });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error ?? "Failed to create meeting");
            }
            const consultationId = data.consultation_id as string;
            router.push(`/consultation/${consultationId}/waiting`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create meeting");
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-3">
            <button
                type="button"
                onClick={handleCreateMeeting}
                disabled={loading}
                className="q-btn-primary inline-block rounded-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
            >
                {loading ? "Creating..." : "Create Meeting"}
            </button>
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
