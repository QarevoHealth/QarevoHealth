import React from "react";
import Image from "next/image";

type AppShellProps = {
    children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-b from-[var(--q-bg-top)] to-[var(--q-bg-bottom)] text-[var(--q-text)]">
            <header className="shrink-0 px-8 pb-6 pt-10">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
                    {/* Brand Icon */}
                    <div className="flex items-center">
                        {/* Fixed box controls layout; overflow-hidden trims any “invisible canvas” feel */}
                        <div className="relative h-70 w-70 overflow-hidden">
                            <Image
                                src="/brand/qarevo-icon.png"
                                alt="Qarevo Health"
                                fill
                                priority
                                sizes="150px"
                                className="object-contain"
                            />
                        </div>
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