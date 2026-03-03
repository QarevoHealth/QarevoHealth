import React from "react";

type AppShellProps = {
    children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-b from-[var(--q-bg-top)] to-[var(--q-bg-bottom)] text-[var(--q-text)]">
            <header className="shrink-0 px-8 pt-10 pb-6">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold tracking-tight text-[var(--q-text)]">Qarevo</span>
                        <span className="text-lg font-semibold tracking-tight text-[var(--q-muted)]">Health</span>
                        <span className="ml-1 flex h-5 w-5 items-center justify-center rounded bg-[var(--q-primary)] text-[10px] font-bold text-white">+</span>
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