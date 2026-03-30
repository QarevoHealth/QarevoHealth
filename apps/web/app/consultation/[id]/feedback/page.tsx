import { apiGet } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { FeedbackForm } from "@/components/FeedbackForm";
import { mockProvidersTwo } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

type Provider = { name: string; full_name?: string };

function formatDoctorNames(providers: Provider[]): string {
    if (!providers?.length) return "your doctor";
    const names = providers.map((p) => p.full_name || p.name || "Doctor");
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
}

export default async function FeedbackPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

    let providers: Provider[] = mockProvidersTwo;
    if (!useMock) {
        try {
            providers = await apiGet<Provider[]>(`/api/v1/consultations/${id}/providers`);
        } catch {
            providers = [];
        }
    }

    const doctorNames = formatDoctorNames(providers);

    return (
        <AppShell>
            <FeedbackForm
                consultationId={id}
                doctorNames={doctorNames}
            />
        </AppShell>
    );
}
