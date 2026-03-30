"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Mic, Volume2 } from "lucide-react";

type TestMicrophoneProps = {
    onTested?: (success: boolean) => void;
};

export function TestMicrophone({ onTested }: TestMicrophoneProps) {
    const [status, setStatus] = useState<"idle" | "listening" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    const stopMic = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        analyserRef.current = null;
        setAudioLevel(0);
    }, []);

    const startTest = useCallback(async () => {
        if (status === "listening") {
            stopMic();
            setStatus("success");
            onTested?.(true);
            return;
        }

        if (status === "success" || status === "error") {
            setStatus("idle");
            setErrorMessage(null);
            return;
        }

        setStatus("listening");
        setErrorMessage(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateLevel = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setAudioLevel(Math.min(100, (average / 128) * 100));
                animationRef.current = requestAnimationFrame(updateLevel);
            };
            updateLevel();
        } catch (err) {
            setStatus("error");
            setErrorMessage(err instanceof Error ? err.message : "Microphone access denied");
            onTested?.(false);
            stopMic();
        }
    }, [status, stopMic, onTested]);

    useEffect(() => {
        return () => stopMic();
    }, [stopMic]);

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
                        isTested ? "bg-emerald-100 text-emerald-600" : status === "listening" ? "bg-sky-100 text-sky-600 animate-pulse" : "bg-slate-100 text-slate-500"
                    }`}
                >
                    <Mic size={18} />
                    {isTested && (
                        <Check size={12} className="absolute -right-0.5 -top-0.5 rounded-full bg-emerald-500 p-0.5 text-white" strokeWidth={3} />
                    )}
                </span>
                {status === "listening" ? "Stop Test" : "Test Microphone"}
            </button>

            {status === "listening" && (
                <div className="flex w-full max-w-[200px] flex-col items-center gap-1 rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-[var(--q-muted)]">
                        <Volume2 size={14} />
                        Speak to test your microphone
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-75"
                            style={{ width: `${audioLevel}%` }}
                        />
                    </div>
                </div>
            )}

            {status === "error" && (
                <p className="text-xs text-red-600">{errorMessage}</p>
            )}
        </div>
    );
}
