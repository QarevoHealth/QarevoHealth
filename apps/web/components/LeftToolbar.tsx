import { CalendarDays, FileText, Settings, SlidersHorizontal } from "lucide-react";

const items = [
    { icon: CalendarDays, label: "Schedule" },
    { icon: FileText, label: "Documents" },
    { icon: SlidersHorizontal, label: "Controls" },
    { icon: Settings, label: "Settings" },
];

export function LeftToolbar() {
    return (
        <div className="flex items-center justify-center">
            <div className="rounded-[28px] bg-white/45 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="flex flex-col gap-3">
                    {items.map(({ icon: Icon, label }) => (
                        <button
                            key={label}
                            className="grid h-11 w-11 place-items-center rounded-2xl bg-white/55 shadow-sm hover:bg-white/75"
                            type="button"
                            aria-label={label}
                            title={label}
                        >
                            <Icon size={18} className="text-[rgba(15,23,42,0.55)]" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}