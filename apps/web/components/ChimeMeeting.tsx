"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Hand, Mic, MicOff, MonitorOff, MonitorUp, UserPlus, Video, VideoOff } from "lucide-react";
import {
    ConsoleLogger,
    DefaultDeviceController,
    DefaultEventController,
    DefaultMeetingSession,
    LogLevel,
} from "amazon-chime-sdk-js";
import { toMeetingSessionConfiguration, type ChimeJoinResponse } from "@/lib/chime";

type ChimeMeetingProps = {
    joinData: ChimeJoinResponse;
    consultationId: string;
    doctorA: string;
    doctorASpec: string;
    patientName: string;
    onEndCall: () => void;
};

export function ChimeMeeting({
    joinData,
    consultationId,
    doctorA,
    doctorASpec,
    patientName,
    onEndCall,
}: ChimeMeetingProps) {
    const [muted, setMuted] = useState(true);
    const [videoOff, setVideoOff] = useState(false);
    const [screenSharing, setScreenSharing] = useState(false);
    const [joined, setJoined] = useState(false);
    const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const patientVideoRef = useRef<HTMLVideoElement>(null);
    const doctorVideoRef = useRef<HTMLVideoElement>(null);
    const sessionRef = useRef<DefaultMeetingSession | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const videoTrackRef = useRef<MediaStreamTrack | null>(null);
    const onEndCallRef = useRef(onEndCall);
    onEndCallRef.current = onEndCall;

    useEffect(() => {
        const el = patientVideoRef.current;
        if (!el || !localStream) return;
        el.srcObject = localStream;
        el.play().catch(() => {});
    }, [localStream]);

    useEffect(() => {
        if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
            setError("Camera and microphone access is required. Please use a supported browser.");
            return;
        }
        let cancelled = false;
        const logger = new ConsoleLogger("ChimeSDK", LogLevel.WARN);
        let session: DefaultMeetingSession;
        try {
            const config = toMeetingSessionConfiguration(joinData);
            const deviceController = new DefaultDeviceController(logger);
            const eventController = new DefaultEventController(config, logger);
            session = new DefaultMeetingSession(config, logger, deviceController, eventController);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to initialize meeting");
            return;
        }
        sessionRef.current = session;

        const observer = {
            audioVideoDidStart: () => {
                setJoined(true);
                sessionRef.current?.audioVideo.startLocalVideoTile();
            },
            audioVideoDidStop: (sessionStatus: { statusCode(): number }) => {
                if (sessionStatus.statusCode() === 2) {
                    onEndCallRef.current();
                }
            },
            videoTileDidUpdate: (tileState: { tileId: number | null; localTile: boolean }) => {
                if (!sessionRef.current || tileState.tileId == null) return;
                if (tileState.localTile) return; // We show local video directly from our stream, not via Chime tile
                setHasRemoteVideo(true);
                const el = doctorVideoRef.current;
                if (el) {
                    requestAnimationFrame(() => {
                        if (sessionRef.current && el) {
                            sessionRef.current.audioVideo.bindVideoElement(tileState.tileId!, el);
                            el.play().catch(() => {});
                        }
                    });
                }
            },
        };

        session.audioVideo.addObserver(observer);

        const start = async () => {
            try {
                let stream: MediaStream;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: true,
                        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
                    });
                } catch {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                }
                if (cancelled || !sessionRef.current) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }

                const currentSession = sessionRef.current;
                if (!currentSession) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                const av = currentSession.audioVideo;
                if (!av) {
                    stream.getTracks().forEach((t) => t.stop());
                    if (!cancelled) setError("Meeting session not ready. Please refresh and try again.");
                    return;
                }

                const deviceController = (currentSession as { deviceController?: { startAudioInput?: (d: unknown) => Promise<void>; startVideoInput?: (d: unknown) => Promise<void> } }).deviceController;
                const startAudio = av.startAudioInput ?? deviceController?.startAudioInput;
                const startVideo = av.startVideoInput ?? deviceController?.startVideoInput;

                if (typeof startAudio === "function") {
                    const target = startAudio === av.startAudioInput ? av : deviceController;
                    await startAudio.call(target, stream.getAudioTracks()[0] ? stream : null);
                }
                if (typeof startVideo === "function" && stream.getVideoTracks()[0]) {
                    const target = startVideo === av.startVideoInput ? av : deviceController;
                    await startVideo.call(target, stream);
                }
                if (cancelled || !sessionRef.current) return;
                localStreamRef.current = stream;
                const vt = stream.getVideoTracks()[0];
                if (vt) videoTrackRef.current = vt;
                setLocalStream(stream);
                av.realtimeMuteLocalAudio(true);
                av.start();
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to join meeting");
                }
            }
        };
        start();

        return () => {
            cancelled = true;
            sessionRef.current = null;
            setLocalStream(null);
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
            videoTrackRef.current = null;
            try {
                session.audioVideo?.removeObserver(observer);
                session.audioVideo?.stop();
            } catch {
                // ignore
            }
            session.destroy().catch(() => {});
        };
    }, [joinData, onEndCall]);

    const handleMuteToggle = useCallback(() => {
        const session = sessionRef.current;
        if (session) {
            const enabled = session.audioVideo.realtimeIsLocalAudioMuted();
            session.audioVideo.realtimeMuteLocalAudio(!enabled);
            setMuted(!enabled);
        }
    }, []);

    const handleVideoToggle = useCallback(() => {
        if (screenSharing) {
            sessionRef.current?.contentShare.stopContentShare();
            setScreenSharing(false);
        } else {
            const session = sessionRef.current;
            const av = session?.audioVideo;
            const track = videoTrackRef.current;
            if (session && av) {
                if (videoOff) {
                    av.startLocalVideoTile();
                    if (track) track.enabled = true;
                } else {
                    av.stopLocalVideoTile();
                    if (track) track.enabled = false;
                }
                setVideoOff(!videoOff);
            }
        }
    }, [videoOff, screenSharing]);

    const handleScreenShareToggle = useCallback(async () => {
        const session = sessionRef.current;
        if (!session) return;
        if (screenSharing) {
            session.contentShare.stopContentShare();
            setScreenSharing(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                await session.contentShare.startContentShare(stream);
                setScreenSharing(true);
                stream.getVideoTracks()[0].onended = () => {
                    session.contentShare.stopContentShare();
                    setScreenSharing(false);
                };
            } catch (err) {
                console.error("Screen share failed:", err);
            }
        }
    }, [screenSharing]);

    const handleEndCall = useCallback(() => {
        if (typeof window !== "undefined") {
            sessionStorage.removeItem(`chime-join-${consultationId}`);
        }
        onEndCall();
    }, [consultationId, onEndCall]);

    if (error) {
        return (
            <div className="rounded-2xl bg-red-50 p-6 text-center">
                <p className="text-red-600">{error}</p>
                <button
                    onClick={handleEndCall}
                    className="mt-4 rounded-full bg-rose-400/70 px-6 py-2 text-sm font-semibold text-white"
                >
                    Go back
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex flex-1 items-center justify-center gap-3 text-sm text-[rgba(15,23,42,0.55)]">
                    <span className="font-medium">Live consultation</span>
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="rounded-full bg-white/60 px-4 py-2 shadow-sm">
                        {joined ? "Connected" : "Connecting..."}
                    </span>
                </div>
                <button
                    onClick={handleEndCall}
                    className="rounded-full bg-rose-400/70 px-8 py-3 text-sm font-semibold text-white"
                >
                    End Call
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="relative h-[320px] overflow-hidden rounded-[26px] bg-slate-800 lg:h-[420px]">
                    <video
                        ref={doctorVideoRef}
                        autoPlay
                        playsInline
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-3 left-3 rounded-md bg-white/70 px-3 py-2 text-xs backdrop-blur">
                        {doctorA} – {doctorASpec}
                    </div>
                    {!hasRemoteVideo && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <span className="text-sm text-white/60">Waiting for doctor to join...</span>
                        </div>
                    )}
                </div>

                <div className="relative h-[320px] overflow-hidden rounded-[26px] bg-slate-300 lg:h-[420px]">
                    <video
                        ref={patientVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    {videoOff && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-300">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-400/80">
                                <VideoOff size={28} className="text-slate-600" />
                            </div>
                            <span className="text-sm font-medium text-slate-600">Camera off</span>
                        </div>
                    )}
                    <div className="absolute bottom-3 left-3 rounded-md bg-white/70 px-3 py-2 text-xs backdrop-blur">
                        {patientName}
                        {videoOff && <div className="text-slate-600">Camera off</div>}
                    </div>
                </div>
            </div>

            <div className="mx-auto flex w-full max-w-[520px] items-center justify-between rounded-full bg-white/45 px-5 py-3">
                <div className="flex gap-3">
                    <button
                        onClick={handleMuteToggle}
                        className={`grid h-11 w-11 place-items-center rounded-full ${muted ? "bg-rose-100 text-rose-600" : "bg-white/55"}`}
                        title={muted ? "Unmute" : "Mute"}
                    >
                        {muted ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    <button
                        onClick={handleVideoToggle}
                        className={`grid h-11 w-11 place-items-center rounded-full ${videoOff ? "bg-rose-100" : "bg-white/55"}`}
                        title={videoOff ? "Camera on" : "Camera off"}
                    >
                        {videoOff ? <VideoOff size={18} /> : <Video size={18} />}
                    </button>
                    <button
                        onClick={handleScreenShareToggle}
                        className={`grid h-11 w-11 place-items-center rounded-full ${screenSharing ? "bg-rose-100" : "bg-white/55"}`}
                        title={screenSharing ? "Stop share" : "Share"}
                    >
                        {screenSharing ? <MonitorOff size={18} /> : <MonitorUp size={18} />}
                    </button>
                    <button className="grid h-11 w-11 place-items-center rounded-full bg-white/55" title="Participants">
                        <UserPlus size={18} />
                    </button>
                    <button className="grid h-11 w-11 place-items-center rounded-full bg-white/55" title="Raise hand">
                        <Hand size={18} />
                    </button>
                </div>
                <button
                    onClick={handleEndCall}
                    className="rounded-full bg-rose-400/70 px-6 py-2 text-sm font-semibold text-white"
                >
                    End Call
                </button>
            </div>
        </div>
    );
}
