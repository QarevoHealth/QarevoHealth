"use client";

import { Check, X } from "phosphor-react";
import { PASSWORD_RULES } from "@/lib/password-policy";

type PasswordValidationHintsProps = {
    value: string;
    className?: string;
};

export function PasswordValidationHints({ value, className = "" }: PasswordValidationHintsProps) {
    if (!value.length) return null;

    return (
        <ul
            className={`flex flex-wrap gap-2 ${className}`.trim()}
            aria-label="Password requirements"
        >
            {PASSWORD_RULES.map((rule) => {
                const satisfied = rule.test(value);
                return (
                    <li
                        key={rule.id}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                            satisfied
                                ? "bg-emerald-50 text-[#0d5c4a]"
                                : "bg-red-50 text-[#912018]"
                        }`}
                    >
                        {satisfied ? (
                            <Check size={14} weight="bold" className="shrink-0 text-emerald-600" aria-hidden />
                        ) : (
                            <X size={14} weight="bold" className="shrink-0 text-red-600" aria-hidden />
                        )}
                        <span>{rule.label}</span>
                    </li>
                );
            })}
        </ul>
    );
}
