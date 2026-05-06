"use client";

import { CaretDown, FirstAidKit, UserCircle } from "phosphor-react";
import { useEffect, useRef, useState } from "react";

type AuthLoginRoleMenuProps = {
    onSelectPatient: () => void;
    onSelectDoctor: () => void;
};

export function AuthLoginRoleMenu({ onSelectPatient, onSelectDoctor }: AuthLoginRoleMenuProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function onDocMouseDown(e: MouseEvent) {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDocMouseDown);
        return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, [open]);

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-q-heading hover:text-q-link"
            >
                Do you already have an account? <span className="underline">Log in</span>{" "}
                <CaretDown size={12} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>

            {open ? (
                <div className="absolute right-0 top-[34px] z-30 min-w-[196px] rounded-lg border border-q-azure-200 bg-white p-2 shadow-md">
                    <p className="px-2 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wide text-q-muted-text">
                        Continue as:
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            onSelectPatient();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg border border-q-azure-100 bg-q-azure-50 px-3 py-2.5 text-left text-sm font-medium text-q-heading transition-colors hover:bg-q-azure-100"
                    >
                        <UserCircle size={18} weight="regular" className="shrink-0 text-q-azure-600" />
                        Patient
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            onSelectDoctor();
                        }}
                        className="mt-1 flex w-full items-center gap-2.5 rounded-lg border border-q-azure-100 bg-q-azure-50 px-3 py-2.5 text-left text-sm font-medium text-q-heading transition-colors hover:bg-q-azure-100"
                    >
                        <FirstAidKit size={18} weight="regular" className="shrink-0 text-q-sky-surge" />
                        Doctor
                    </button>
                </div>
            ) : null}
        </div>
    );
}
