import React from "react";

type AppShellProps = {
    children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-[var(--q-bg-top)] to-[var(--q-bg-bottom)] text-[var(--q-text)]">
            <header className="px-6 py-5">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-full bg-white/85 shadow-sm" />
                        <span className="text-sm font-semibold tracking-tight">Qarevo Health</span>
                    </div>

                    <div className="hidden items-center gap-2 text-sm text-[var(--q-muted)] md:flex" />

                    <div className="w-[120px]" />
                </div>
            </header>

            <main className="px-6 pb-10">
                <div className="mx-auto w-full max-w-6xl">{children}</div>
            </main>

            <footer className="px-6 pb-8">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between text-sm text-[var(--q-muted)]">
                    <div className="flex items-center gap-2">
                        <span className="inline-block h-5 w-5 rounded bg-white/70 shadow-sm" />
                        <span>End-to-end encrypted consultation</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-block h-5 w-5 rounded bg-white/70 shadow-sm" />
                        <span>Need assistance? Our support team is available</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}