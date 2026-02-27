import { AppShell } from "@/components/AppShell";
import { QCard } from "@/components/QCard";

export default function UIPlayground() {
    return (
        <AppShell>
            <QCard className="p-10">
                <h1 className="text-3xl font-semibold tracking-tight">UI Playground</h1>
                <p className="mt-2 text-[var(--q-muted)]">
                    Wenn das sauber und “weich” aussieht, sind wir ready für den Lobby-Screen.
                </p>

                <button
                    className="mt-6 rounded-full bg-[var(--q-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[var(--q-primary-hover)]"
                    type="button"
                >
                    Primary Button Test
                </button>
            </QCard>
        </AppShell>
    );
}