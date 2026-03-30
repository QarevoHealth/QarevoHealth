"use client";

import React from "react";
import { Hand, Mic, MicOff, MonitorUp, MonitorOff, UserPlus, Video, VideoOff } from "lucide-react";

function ControlButton({
    label,
    icon: Icon,
    active,
    onClick,
}: {
    label: string;
    icon: React.ElementType;
    active?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`grid h-11 w-11 place-items-center rounded-full shadow-sm transition-colors ${
                active
                    ? "bg-rose-100 text-rose-600 hover:bg-rose-200"
                    : "bg-white/55 hover:bg-white/75 text-[rgba(15,23,42,0.55)]"
            }`}
            aria-label={label}
            title={label}
        >
            <Icon size={18} />
        </button>
    );
}

type CallControlsProps = {
    endLabel?: string;
    onEndCall?: () => void;
    muted?: boolean;
    onMuteToggle?: () => void;
    videoOff?: boolean;
    onVideoToggle?: () => void;
    screenSharing?: boolean;
    onScreenShareToggle?: () => void;
};

export function CallControls({
    endLabel = "End Call",
    onEndCall,
    muted = false,
    onMuteToggle,
    videoOff = false,
    onVideoToggle,
    screenSharing = false,
    onScreenShareToggle,
}: CallControlsProps) {
    return (
        <div className="mx-auto mt-6 flex w-full max-w-[520px] items-center justify-between rounded-full bg-white/45 px-5 py-3 shadow-[0_14px_40px_rgba(15,23,42,0.10)] backdrop-blur">
            <div className="flex items-center gap-3">
                <ControlButton
                    label={muted ? "Unmute" : "Mute"}
                    icon={muted ? MicOff : Mic}
                    active={muted}
                    onClick={onMuteToggle}
                />
                <ControlButton
                    label={videoOff ? "Turn on camera" : "Turn off camera"}
                    icon={videoOff ? VideoOff : Video}
                    active={videoOff}
                    onClick={onVideoToggle}
                />
                <ControlButton
                    label={screenSharing ? "Stop sharing" : "Share screen"}
                    icon={screenSharing ? MonitorOff : MonitorUp}
                    active={screenSharing}
                    onClick={onScreenShareToggle}
                />
                <ControlButton label="Participants" icon={UserPlus} />
                <ControlButton label="Raise hand" icon={Hand} />
            </div>

            <button
                type="button"
                onClick={onEndCall}
                className="rounded-full bg-rose-400/70 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-500/70"
            >
                {endLabel}
            </button>
        </div>
    );
}
