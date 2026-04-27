"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordFieldProps = {
    id?: string;
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

export function PasswordField({
    id = "password",
    label = "Password",
    value,
    onChange,
    placeholder = "••••••••",
}: PasswordFieldProps) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-xs font-semibold text-primary">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={visible ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm text-foreground outline-none placeholder:text-slate-400 focus:border-secondary focus:ring-2 focus:ring-secondary/25"
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                    {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
        </div>
    );
}
