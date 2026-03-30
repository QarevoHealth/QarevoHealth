"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Shield } from "lucide-react";

const EMOJIS = [
    { value: 5, label: "Very happy", emoji: "😊" },
    { value: 4, label: "Happy", emoji: "🙂" },
    { value: 3, label: "Neutral", emoji: "😐" },
    { value: 2, label: "Sad", emoji: "😕" },
    { value: 1, label: "Very sad", emoji: "😞" },
];

type FeedbackFormProps = {
    consultationId: string;
    doctorNames: string;
};

export function FeedbackForm({ consultationId, doctorNames }: FeedbackFormProps) {
    const router = useRouter();
    const [rating, setRating] = useState<number | null>(null);

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
            {/* Logo - Qarevo Health GmbH */}
            <div className="mb-10 flex flex-col items-center gap-1">
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tracking-tight text-slate-800">
                        Qarevo
                    </span>
                    <span className="text-2xl font-bold tracking-tight text-[var(--q-primary)]">
                        Health
                    </span>
                    <span className="ml-1 flex h-6 w-6 items-center justify-center rounded bg-[var(--q-primary)] text-xs font-bold text-white">
                        +
                    </span>
                </div>
                <span className="text-sm text-[var(--q-muted)]">GmbH</span>
            </div>

            {/* End message */}
            <h1 className="mb-8 max-w-lg text-center text-xl font-bold text-[var(--q-text)]">
                Your consultation with {doctorNames} has ended.
            </h1>

            {/* Feedback section */}
            <div className="mb-10 w-full max-w-md">
                <p className="mb-4 text-center text-sm text-[var(--q-muted)]">
                    Give feedback about the session
                </p>
                <div className="rounded-2xl border border-[var(--q-card-border)] bg-white/90 p-6 shadow-sm">
                    <p className="mb-4 text-sm font-medium text-[var(--q-text)]">
                        How was the audio and video?
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        {EMOJIS.map(({ value, label, emoji }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setRating(value)}
                                className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl transition-all ${
                                    rating === value
                                        ? "scale-110 ring-2 ring-[var(--q-primary)] ring-offset-2"
                                        : "hover:scale-105 hover:bg-slate-50"
                                }`}
                                aria-label={label}
                                title={label}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Home Page button */}
            <button
                type="button"
                onClick={() => router.push("/ui-playground")}
                className="w-full max-w-md rounded-2xl bg-gradient-to-r from-slate-700 to-[var(--q-primary)] px-8 py-4 text-base font-semibold text-white shadow-lg transition-opacity hover:opacity-95"
            >
                Home Page
            </button>

            {/* Security notice */}
            <div className="mt-12 flex items-center gap-2 text-sm text-sky-600">
                <Shield size={18} aria-hidden />
                <span>End-to-end encrypted consultation</span>
            </div>
        </div>
    );
}
