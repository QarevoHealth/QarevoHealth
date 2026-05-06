"use client";

import { useEffect, useRef, useState } from "react";
import { CaretDown, X } from "phosphor-react";
import { DOCTOR_EXPERTISE_OPTIONS } from "@/lib/doctor/expertise-options";

type Props = {
    selected: string[];
    onChange: (values: string[]) => void;
    id?: string;
};

export function DoctorExpertiseMultiSelect({ selected, onChange, id }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function close(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    function add(value: string) {
        if (!selected.includes(value)) onChange([...selected, value]);
        setOpen(false);
    }

    function remove(value: string) {
        onChange(selected.filter((v) => v !== value));
    }

    const available = DOCTOR_EXPERTISE_OPTIONS.filter((o) => !selected.includes(o.value));

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                id={id}
                onClick={() => setOpen((o) => !o)}
                className="flex min-h-[52px] w-full items-start gap-2 rounded-md border border-q-border-input bg-white px-3 py-2.5 text-left outline-none transition-colors focus:border-q-accent focus:ring-1 focus:ring-q-accent/30"
                aria-expanded={open}
                aria-haspopup="listbox"
            >
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    {selected.length === 0 ? (
                        <span className="py-0.5 text-sm text-q-muted-text">Choose your field of expertise</span>
                    ) : (
                        selected.map((val) => {
                            const label =
                                DOCTOR_EXPERTISE_OPTIONS.find((o) => o.value === val)?.label ?? val;
                            return (
                                <span
                                    key={val}
                                    className="inline-flex items-center gap-1 rounded-md bg-q-azure-100 px-2.5 py-1.5 text-sm font-semibold text-q-heading"
                                >
                                    {label}
                                    <button
                                        type="button"
                                        className="-mr-0.5 rounded p-0.5 hover:bg-q-azure-200"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            remove(val);
                                        }}
                                        aria-label={`Remove ${label}`}
                                    >
                                        <X size={14} weight="bold" className="text-q-label" />
                                    </button>
                                </span>
                            );
                        })
                    )}
                </div>
                <CaretDown
                    size={18}
                    weight="bold"
                    className={`mt-1 shrink-0 text-q-heading transition-transform ${open ? "rotate-180" : ""}`}
                    aria-hidden
                />
            </button>
            {open && available.length > 0 ? (
                <ul
                    className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-52 overflow-auto rounded-md border border-q-border-input bg-white py-1 shadow-[0_12px_32px_rgba(20,52,93,0.12)]"
                    role="listbox"
                >
                    {available.map((opt) => (
                        <li key={opt.value} role="none">
                            <button
                                type="button"
                                role="option"
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-q-heading hover:bg-q-azure-50"
                                onClick={() => add(opt.value)}
                            >
                                {opt.label}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}
