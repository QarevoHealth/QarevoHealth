"use client";

import type { LucideIcon } from "lucide-react";

type RoleOptionCardProps = {
    icon: LucideIcon;
    title: string;
    description: string;
    selected: boolean;
    onClick: () => void;
};

export function RoleOptionCard({
    icon: Icon,
    title,
    description,
    selected,
    onClick,
}: RoleOptionCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={
                selected
                    ? "flex w-full flex-col items-start gap-1 rounded-lg border-2 border-secondary bg-surface-panel p-3 text-left shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] transition"
                    : "flex w-full flex-col items-start gap-1 rounded-lg border-2 border-slate-200 bg-white p-3 text-left shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] transition hover:border-slate-300"
            }
        >
            <Icon
                className={selected ? "text-secondary" : "text-slate-500"}
                size={22}
            />
            <span className="text-sm font-semibold text-primary">{title}</span>
            <span className="text-xs leading-snug text-muted-foreground">
                {description}
            </span>
        </button>
    );
}
