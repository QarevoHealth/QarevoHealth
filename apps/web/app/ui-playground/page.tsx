import { AppShell } from "@/components/AppShell";
import { CreateMeetingButton } from "@/components/CreateMeetingButton";
import { QCard } from "@/components/QCard";

export default function UIPlayground() {
    return (
        <AppShell>
            <QCard className="mx-auto max-w-2xl p-10 text-center">
                <h1 className="text-3xl font-semibold tracking-tight">Welcome to the Qarevo Health UI Playground</h1>
                <div className="mt-8 space-y-4 text-[var(--q-muted)]">
                    <p className="font-bold text-[var(--q-text)]">Welcome to Qarevo Health.</p>
                    <p>We&apos;re glad to have you here. Click the button below to schedule your meeting with Dr. Sarah Johnson.</p>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-4">
                    <CreateMeetingButton />
                </div>
            </QCard>
        </AppShell>
    );
}
