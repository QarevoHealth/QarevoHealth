import React from "react";

export function GlassPanel({
                               children,
                               className = "",
                           }: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={[
                "rounded-[28px] border border-white/60 bg-white/55 shadow-[0_18px_60px_rgba(15,23,42,0.10)] backdrop-blur",
                className,
            ].join(" ")}
        >
            {children}
        </div>
    );
}