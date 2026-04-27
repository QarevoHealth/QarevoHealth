"use client";

import Link from "next/link";
import type { Consents } from "@/lib/api";

type Props = {
    value: Consents;
    onChange: (next: Consents) => void;
    error?: string;
    /** When true, consents are optional (e.g. minimal patient signup). */
    optional?: boolean;
};

export function ConsentCheckboxes({ value, onChange, error, optional }: Props) {
    const set = (key: keyof Consents, checked: boolean) =>
        onChange({ ...value, [key]: checked });

    return (
        <div className="flex flex-col gap-2">
            <label className="flex items-start gap-2 text-xs text-foreground">
                <input
                    type="checkbox"
                    checked={value.terms_privacy}
                    onChange={(e) => set("terms_privacy", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-secondary focus:ring-secondary"
                />
                <span>
                    I agree to the{" "}
                    <Link href="/terms" className="font-semibold text-primary hover:underline">
                        Terms
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="font-semibold text-primary hover:underline">
                        Privacy Policy
                    </Link>
                    {!optional && <span className="text-red-500"> *</span>}
                </span>
            </label>

            <label className="flex items-start gap-2 text-xs text-foreground">
                <input
                    type="checkbox"
                    checked={value.telehealth}
                    onChange={(e) => set("telehealth", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-secondary focus:ring-secondary"
                />
                <span>
                    I consent to telehealth services
                    {!optional && <span className="text-red-500"> *</span>}
                </span>
            </label>

            <label className="flex items-start gap-2 text-xs text-foreground">
                <input
                    type="checkbox"
                    checked={!!value.marketing}
                    onChange={(e) => set("marketing", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-secondary focus:ring-secondary"
                />
                <span>Send me product updates (optional)</span>
            </label>

            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
