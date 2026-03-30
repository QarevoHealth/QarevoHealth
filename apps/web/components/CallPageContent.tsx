"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { ChimeMeeting } from "@/components/ChimeMeeting";
import { VideoTile } from "@/components/VideoTile";
import { CallControls } from "@/components/CallControls";
import { RightPanelTabs } from "@/components/RightPanelTabs";
import type { ChimeJoinResponse } from "@/lib/chime";

type CallPageContentProps = {
    consultationId: string;
    doctorA: string;
    doctorASpec: string;
    patientName: string;
};

export function CallPageContent({
    consultationId,
    doctorA,
    doctorASpec,
    patientName,
}: CallPageContentProps) {
    const router = useRouter();
    const [joinData, setJoinData] = useState<ChimeJoinResponse | null>(null);
    const [muted, setMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(false);
    const [screenSharing, setScreenSharing] = useState(false);
    const [patientStream, setPatientStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const patientVideoRef = useRef<HTMLVideoElement>(null);
    const audioTrackRef = useRef<MediaStreamTrack | null>(null);
    const videoTrackRef = useRef<MediaStreamTrack | null>(null);

    useEffect(() => {
        const stored = typeof window !== "undefined" && sessionStorage.getItem(`chime-join-${consultationId}`);
        if (stored) {
            try {
                setJoinData(JSON.parse(stored) as ChimeJoinResponse);
            } catch {
                // ignore
            }
        }
    }, [consultationId]);

    const handleEndCall = useCallback(() => {
        router.push(`/consultation/${consultationId}/feedback`);
    }, [consultationId, router]);

    useEffect(() => {
        if (joinData) return;
        let stream: MediaStream | null = null;
        const startCamera = async () => {
            try {
                const constraints: MediaStreamConstraints = {
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
                    audio: true,
                };
                try {
                    stream = await navigator.mediaDevices.getUserMedia(constraints);
                } catch {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                }
                setPatientStream(stream);
                const audioTrack = stream.getAudioTracks()[0];
                const videoTrack = stream.getVideoTracks()[0];
                if (audioTrack) audioTrackRef.current = audioTrack;
                if (videoTrack) videoTrackRef.current = videoTrack;
            } catch (err) {
                console.error("Failed to get user media:", err);
            }
        };
        startCamera();
        return () => {
            stream?.getTracks().forEach((t) => t.stop());
            setPatientStream(null);
            audioTrackRef.current = null;
            videoTrackRef.current = null;
        };
    }, [joinData]);

    const handleVideoToggle = useCallback(() => {
        if (screenSharing) {
            screenStream?.getTracks().forEach((t) => t.stop());
            setScreenStream(null);
            setScreenSharing(false);
        } else {
            const track = videoTrackRef.current;
            if (track) {
                track.enabled = !track.enabled;
                setVideoOff(!track.enabled);
            } else {
                setVideoOff((v) => !v);
            }
        }
    }, [screenSharing, screenStream]);

    const displayStream = screenSharing ? screenStream : patientStream;
    const showVideo = displayStream && !videoOff;

    useEffect(() => {
        const video = patientVideoRef.current;
        if (!video) return;
        video.srcObject = showVideo ? displayStream : null;
        if (showVideo && displayStream) {
            video.play().catch(() => {});
        }
    }, [displayStream, showVideo]);

    const handleMuteToggle = useCallback(() => {
        const track = audioTrackRef.current;
        if (track) {
            track.enabled = !track.enabled;
            setMuted(!track.enabled);
        } else {
            setMuted((m) => !m);
        }
    }, []);

    const handleScreenShareToggle = useCallback(async () => {
        if (screenSharing) {
            screenStream?.getTracks().forEach((t) => t.stop());
            setScreenStream(null);
            setScreenSharing(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false,
                });
                setScreenStream(stream);
                setScreenSharing(true);
                stream.getVideoTracks()[0].onended = () => {
                    setScreenStream(null);
                    setScreenSharing(false);
                };
            } catch (err) {
                console.error("Failed to share screen:", err);
            }
        }
    }, [screenSharing, screenStream]);

    const sidePanel = (
        <div className="w-full shrink-0 lg:w-[380px] lg:min-w-[320px]">
            <RightPanelTabs initial="Patient data" />
        </div>
    );

    if (joinData) {
        return (
            <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
                <div className="min-w-0 flex-1">
                    <ChimeMeeting
                        joinData={joinData}
                        consultationId={consultationId}
                        doctorA={doctorA}
                        doctorASpec={doctorASpec}
                        patientName={patientName}
                        onEndCall={handleEndCall}
                    />
                </div>
                {sidePanel}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
            <div className="min-w-0 flex-1">
            {/* Top status */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex flex-1 items-center justify-center gap-3 text-sm text-[rgba(15,23,42,0.55)]">
                    <span className="font-medium">Live consultation</span>
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="rounded-full bg-white/60 px-4 py-2 shadow-sm">05:18</span>
                </div>
                <div className="flex flex-1 justify-end">
                    <button
                        onClick={handleEndCall}
                        className="rounded-full bg-rose-400/70 px-8 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(244,63,94,0.25)] hover:bg-rose-500/70"
                        type="button"
                    >
                        End Call
                    </button>
                </div>
            </div>

            {/* 2 persons: Doctor | Patient */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Doctor */}
                <div className="relative h-[320px] lg:h-[420px]">
                    <VideoTile
                        src="/mock/doctor2.png"
                        name={doctorA}
                        subtitle={doctorASpec}
                    />
                </div>

                {/* Patient (live video or screen share) */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={handleVideoToggle}
                    onKeyDown={(e) => e.key === "Enter" && handleVideoToggle()}
                    className="relative h-[320px] cursor-pointer overflow-hidden rounded-[26px] bg-slate-200 lg:h-[420px]"
                >
                    {showVideo ? (
                        <video
                            ref={patientVideoRef}
                            autoPlay
                            muted={!screenSharing}
                            playsInline
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <VideoTile src="/mock/doctor3.png" name={patientName} glow />
                    )}
                    <div className="absolute bottom-3 left-3 rounded-md bg-white/70 px-3 py-2 text-xs shadow-sm backdrop-blur">
                        <div className="font-semibold">{patientName}</div>
                        {videoOff && <div className="text-[rgba(15,23,42,0.65)]">Camera off</div>}
                        {screenSharing && !videoOff && (
                            <div className="text-[rgba(15,23,42,0.65)]">Sharing screen</div>
                        )}
                    </div>
                    <button
                        type="button"
                        data-mic-toggle
                        onClick={(e) => {
                            e.stopPropagation();
                            handleMuteToggle();
                        }}
                        className={`absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full shadow-sm transition-colors ${
                            muted ? "bg-rose-100 text-rose-600 hover:bg-rose-200" : "bg-white/70 text-slate-600 hover:bg-white/90"
                        }`}
                        aria-label={muted ? "Unmute" : "Mute"}
                        title={muted ? "Unmute" : "Mute"}
                    >
                        {muted ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                </div>
            </div>

            <CallControls
                endLabel="End Call"
                onEndCall={handleEndCall}
                muted={muted}
                onMuteToggle={handleMuteToggle}
                videoOff={videoOff}
                onVideoToggle={handleVideoToggle}
                screenSharing={screenSharing}
                onScreenShareToggle={handleScreenShareToggle}
            />
            </div>
            {sidePanel}
        </div>
    );
}
