import { apiGet } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { CallPageContent } from "@/components/CallPageContent";
import { mockConsultation, mockProvidersOne, mockProvidersTwo } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

type Provider = { name?: string; full_name?: string; specialty?: string };
type Consultation = {
    id: string;
    patientName?: string;
    status?: string;
};

export default async function CallPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ mode?: string }>;
}) {
    const { id } = await params;
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

    const consultation: Consultation = useMock
        ? { ...mockConsultation, id }
        : await apiGet<Consultation>(`/api/v1/consultations/${id}`);

    const providers: Provider[] = useMock
        ? mockProvidersOne
        : await apiGet<Provider[]>(`/api/v1/consultations/${id}/providers`);

    const p = providers?.[0];
    const doctorA = p?.name ?? p?.full_name ?? "Doctor";
    const doctorASpec = p?.specialty ?? "Clinician";
    const patientName = consultation?.patientName ?? "Olivia Clark";

    return (
        <AppShell>
            <CallPageContent
                consultationId={id}
                doctorA={doctorA}
                doctorASpec={doctorASpec}
                patientName={patientName}
            />
        </AppShell>
    );
}
