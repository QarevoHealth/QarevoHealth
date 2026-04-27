"use client";

import { AppleIcon, GoogleIcon, MicrosoftIcon } from "./icons/BrandIcons";
type Provider = "google" | "apple" | "microsoft";

type SocialAuthButtonsProps = {
    onSelect?: (provider: Provider) => void;
};

export function SocialAuthButtons({ onSelect = () => undefined }: SocialAuthButtonsProps) {
    const buttons: Array<{
        id: Provider;
        label: string;
        Icon: React.FC<{ size?: number }>;
    }> = [
        { id: "google", label: "Google", Icon: GoogleIcon },
        { id: "apple", label: "Apple", Icon: AppleIcon },
        { id: "microsoft", label: "Microsoft", Icon: MicrosoftIcon },
    ];

    return (
        <div className="grid grid-cols-3 gap-3">
            {buttons.map(({ id, label, Icon }) => (
                <button
                    key={id}
                    type="button"
                    onClick={() => onSelect?.(id)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-secondary bg-white px-3 py-2.5 text-sm font-medium text-primary shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] transition hover:bg-slate-50"
                >
                    <Icon size={16} />
                    <span>{label}</span>
                </button>
            ))}
        </div>
    );
}
