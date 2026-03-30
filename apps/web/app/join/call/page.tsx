import { AppShell } from "@/components/AppShell";
import { JoinCallContent } from "@/components/JoinCallContent";

export const dynamic = "force-dynamic";

export default function JoinCallPage() {
    return (
        <AppShell>
            <JoinCallContent />
        </AppShell>
    );
}
