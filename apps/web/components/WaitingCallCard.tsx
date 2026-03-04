"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ChevronDown, Grid3X3, Loader2, Square, X } from "lucide-react";
import { TestCamera } from "./TestCamera";
import { TestMicrophone } from "./TestMicrophone";

const DEFAULT_PROVIDER_USER_ID = "2b645955-1b75-4e37-a119-c6ad748c7d45";

type WaitingCallCardProps = {
    doctorName: string;
    videoPreviewSrc?: string;
    consultationId?: string;
    userId?: string;
    role?: "patient" | "doctor";
};

export function WaitingCallCard({ doctorName, videoPreviewSrc = "/mock/doctor3.png", consultationId = "123", userId, role = "patient" }: WaitingCallCardProps) {
    const router = useRouter();
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [cameraDropdownOpen, setCameraDropdownOpen] = useState(false);
    const [blurOn, setBlurOn] = useState(false);
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
    const [doctorJoinUrl, setDoctorJoinUrl] = useState("");
    const videoRef = useRef<HTMLVideoElement>(null);

    const [patientWaitUrl, setPatientWaitUrl] = useState("");
    useEffect(() => {
        if (typeof window !== "undefined") {
            setDoctorJoinUrl(`${window.location.origin}/consultation/${consultationId}/waiting/user/${DEFAULT_PROVIDER_USER_ID}`);
            setPatientWaitUrl(`${window.location.origin}/consultation/${consultationId}/waiting`);
        }
    }, [consultationId]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !videoStream) return;
        video.srcObject = videoStream;
        video.play().catch(() => {});
    }, [videoStream]);

    const handleCameraStreamChange = useCallback((stream: MediaStream | null) => {
        setVideoStream(stream);
    }, []);

    return (
        <div className="relative overflow-visible rounded-[28px] border border-[var(--q-card-border)] bg-[var(--q-card)] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur">
            {/* Glow border effect */}
            <div className="pointer-events-none absolute inset-0 rounded-[28px] shadow-[0_0_0_6px_rgba(61,213,178,0.25)]" />

            {/* Role badge - prevents using same URL in both tabs (causes "session will not be reconnected") */}
            <div className="mb-4 flex justify-center">
                <span className={`rounded-full px-4 py-1.5 text-xs font-semibold ${role === "doctor" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"}`}>
                    Joining as: {role === "doctor" ? "Doctor" : "Patient"}
                </span>
            </div>

            <div className="relative space-y-6">
                {/* Video preview */}
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-200">
                    {videoStream ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className={`h-full w-full object-cover transition-[filter] duration-300 ${blurOn ? "blur-[12px]" : ""}`}
                        />
                    ) : (
                        <Image
                            src={videoPreviewSrc}
                            alt="Your video preview"
                            fill
                            className={`object-cover transition-[filter] duration-300 ${blurOn ? "blur-[12px]" : ""}`}
                            sizes="(max-width: 768px) 100vw, 480px"
                        />
                    )}
                    {blurOn && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="rounded-full bg-black/40 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                                Background blur on
                            </span>
                        </div>
                    )}
                </div>

                {/* Status text */}
                <div className="text-center">
                    <p className="text-lg font-semibold text-[var(--q-text)]">
                        Your consultation with {doctorName} is about to begin.
                    </p>
                    <p className="mt-1 text-sm text-[var(--q-muted)]">
                        Your doctor is going to join shortly.
                    </p>
                </div>

                {/* Join Call button */}
                <button
                    type="button"
                    disabled={joining}
                    onClick={async () => {
                        setJoining(true);
                        setJoinError(null);
                        try {
                            const res = await fetch(`/api/consultations/${consultationId}/join`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ user_id: userId ?? "4b7966a0-0630-4f9f-8a90-c77372b9fb18" }),
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error ?? "Failed to join");
                            if (data.join_url && typeof window !== "undefined") {
                                const url = new URL(data.join_url);
                                url.host = window.location.host;
                                url.protocol = window.location.protocol;
                                data.join_url = url.toString();
                            }
                            sessionStorage.setItem(`chime-join-${consultationId}`, JSON.stringify(data));
                            router.push(`/consultation/${consultationId}/call`);
                        } catch (err) {
                            console.error("[Join API] Error:", err);
                            setJoinError(err instanceof Error ? err.message : "Failed to join call");
                            setJoining(false);
                        }
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-400 to-[var(--q-primary)] px-6 py-4 text-base font-semibold text-white shadow-lg transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {joining ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Joining...
                        </>
                    ) : (
                        "Join Call"
                    )}
                </button>
                {joinError && (
                    <p className="text-center text-sm text-red-600">{joinError}</p>
                )}

                {/* Controls */}
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <TestMicrophone />
                    <TestCamera onStreamChange={handleCameraStreamChange} />

                    {/* Camera with dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setCameraDropdownOpen(!cameraDropdownOpen)}
                            className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm hover:bg-white ${
                                blurOn ? "border-sky-300 bg-sky-50/80 text-sky-700" : "border-[var(--q-card-border)] bg-white/80 text-[var(--q-text)]"
                            }`}
                        >
                            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${blurOn ? "bg-sky-100 text-sky-600" : "bg-slate-100 text-slate-500"}`}>
                                <Camera size={18} />
                            </span>
                            Camera
                            <ChevronDown size={16} className="text-[var(--q-muted)]" />
                        </button>

                        {cameraDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    aria-hidden
                                    onClick={() => setCameraDropdownOpen(false)}
                                />
                                <div className="absolute left-1/2 top-full z-20 mt-3 w-56 -translate-x-1/2 rounded-2xl border border-[var(--q-card-border)] bg-white p-3 shadow-lg">
                                    <button
                                        type="button"
                                        onClick={() => setCameraDropdownOpen(false)}
                                        className="absolute right-3 top-3 rounded p-1.5 text-[var(--q-muted)] hover:bg-slate-100"
                                        aria-label="Close"
                                    >
                                        <X size={14} />
                                    </button>
                                    <div className="flex flex-col gap-1 pt-1 pr-8">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setBlurOn(true);
                                                setCameraDropdownOpen(false);
                                            }}
                                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium hover:bg-slate-50 ${
                                                blurOn ? "bg-sky-50 text-sky-700" : "text-[var(--q-text)]"
                                            }`}
                                        >
                                            <Grid3X3 size={20} className={`shrink-0 ${blurOn ? "text-sky-600" : "text-[var(--q-muted)]"}`} />
                                            Blur On
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setBlurOn(false);
                                                setCameraDropdownOpen(false);
                                            }}
                                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium hover:bg-slate-50 ${
                                                !blurOn ? "bg-sky-50 text-sky-700" : "text-[var(--q-text)]"
                                            }`}
                                        >
                                            <Square size={20} className={`shrink-0 ${!blurOn ? "text-sky-600" : "text-[var(--q-muted)]"}`} />
                                            Blur Off
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Doctor join link - for testing: open in another browser to join as 2nd person */}
                <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/80 p-4">
                    <p className="mb-2 text-center text-xs font-semibold text-amber-800">
                        {role === "patient" ? "2-person test: Use DIFFERENT URLs" : "You are the doctor. Patient uses the main waiting URL (without /user/...)."}
                    </p>
                    <p className="mb-2 text-center text-xs text-[var(--q-muted)]">
                        {role === "patient"
                            ? "Open the link below in incognito/another browser as the doctor. Same URL in both tabs = disconnect."
                            : "Copy and share the main waiting URL with the patient."}
                    </p>
                    <div className="flex items-center gap-2">
                        <input
                            readOnly
                            value={role === "doctor" ? patientWaitUrl : doctorJoinUrl}
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-[var(--q-text)]"
                        />
                        <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(role === "doctor" ? patientWaitUrl : doctorJoinUrl)}
                            className="shrink-0 rounded-lg bg-sky-100 px-3 py-2 text-xs font-medium text-sky-700 hover:bg-sky-200"
                        >
                            Copy
                        </button>
                    </div>
                </div>

                {/* Troubleshoot link */}
                <p className="text-center">
                    <a
                        href="#"
                        className="text-sm font-medium text-sky-600 hover:underline"
                    >
                        Troubleshoot Connection
                    </a>
                </p>
            </div>
        </div>
    );
}
