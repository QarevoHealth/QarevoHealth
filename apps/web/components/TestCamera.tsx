"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, Video } from "lucide-react";

type TestCameraProps = {
    onStreamChange?: (stream: MediaStream | null) => void;
};

export function TestCamera({ onStreamChange }: TestCameraProps) {
    const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        onStreamChange?.(null);
    }, [onStreamChange]);

    const startTest = useCallback(async () => {
        if (status === "testing") {
            stopCamera();
            setStatus("success");
            return;
        }

        if (status === "success" || status === "error") {
            setStatus("idle");
            setErrorMessage(null);
            return;
        }

        setStatus("testing");
        setErrorMessage(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            onStreamChange?.(stream);
        } catch (err) {
            setStatus("error");
            setErrorMessage(err instanceof Error ? err.message : "Camera access denied");
            onStreamChange?.(null);
        }
    }, [status, stopCamera, onStreamChange]);

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    const isTested = status === "success";

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                type="button"
                onClick={startTest}
                className="flex items-center gap-2 rounded-2xl border border-[var(--q-card-border)] bg-white/80 px-4 py-3 text-sm font-medium text-[var(--q-text)] shadow-sm hover:bg-white"
            >
                <span
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full ${
                        isTested ? "bg-emerald-100 text-emerald-600" : status === "testing" ? "bg-sky-100 text-sky-600 animate-pulse" : "bg-slate-100 text-slate-500"
                    }`}
                >
                    <Camera size={18} />
                    {isTested && (
                        <Check size={12} className="absolute -right-0.5 -top-0.5 rounded-full bg-emerald-500 p-0.5 text-white" strokeWidth={3} />
                    )}
                </span>
                {status === "testing" ? "Stop Test" : "Test Camera"}
            </button>

            {status === "testing" && (
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-[var(--q-muted)]">
                    <Video size={14} />
                    Camera preview above
                </div>
            )}

            {status === "error" && (
                <p className="text-xs text-red-600">{errorMessage}</p>
            )}
        </div>
    );
}
