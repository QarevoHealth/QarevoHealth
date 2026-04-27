import React from "react";
import { BrandLogoFull } from "@/components/brand/BrandLogoFull";

type AppShellProps = {
    children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-b from-[var(--q-bg-top)] to-[var(--q-bg-bottom)] text-[var(--q-text)]">
            <header className="shrink-0 px-8 pb-6 pt-10">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
                    {/* Brand Icon */}
                    <div className="flex min-w-0 items-center">
                        <BrandLogoFull height={40} priority />
                    </div>

                    <div className="hidden items-center gap-2 text-sm text-[var(--q-muted)] md:flex" />

                    <div className="w-[120px]" />
                </div>
            </header>

            <main className="flex-1 px-8 pb-12 pt-6">
                <div className="mx-auto w-full max-w-6xl">{children}</div>
            </main>
        </div>
    );
}