import React from "react";
import { Hand, Mic, MonitorUp, UserPlus, Video } from "lucide-react";

function ControlButton({
                           label,
                           icon: Icon,
                       }: {
    label: string;
    icon: React.ElementType;
}) {
    return (
        <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/55 shadow-sm hover:bg-white/75"
            aria-label={label}
            title={label}
        >
            <Icon size={18} className="text-[rgba(15,23,42,0.55)]" />
        </button>
    );
}

export function CallControls({ endLabel = "End Call" }: { endLabel?: string }) {
    return (
        <div className="mx-auto mt-6 flex w-full max-w-[520px] items-center justify-between rounded-full bg-white/45 px-5 py-3 shadow-[0_14px_40px_rgba(15,23,42,0.10)] backdrop-blur">
            <div className="flex items-center gap-3">
                <ControlButton label="Mic" icon={Mic} />
                <ControlButton label="Camera" icon={Video} />
                <ControlButton label="Share screen" icon={MonitorUp} />
                <ControlButton label="Participants" icon={UserPlus} />
                <ControlButton label="Raise hand" icon={Hand} />
            </div>

            <button
                type="button"
                className="rounded-full bg-rose-400/70 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-500/70"
            >
                {endLabel}
            </button>
        </div>
    );
}