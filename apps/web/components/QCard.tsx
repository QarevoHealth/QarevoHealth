import React from "react";

type QCardProps = {
    children: React.ReactNode;
    className?: string;
};

export function QCard({ children, className = "" }: QCardProps) {
    return (
        <div
            className={[
                "rounded-[28px] border border-[var(--q-card-border)] bg-[var(--q-card)] shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur",
                className,
            ].join(" ")}
        >
            {children}
        </div>
    );
}