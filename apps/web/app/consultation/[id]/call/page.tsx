import { apiGet } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { LeftToolbar } from "@/components/LeftToolbar";
import { VideoTile } from "@/components/VideoTile";
import { CallControls } from "@/components/CallControls";
import { RightPanelTabs } from "@/components/RightPanelTabs";
import { mockConsultation, mockProvidersOne, mockProvidersTwo } from "@/lib/mock-data";
export const dynamic = "force-dynamic";

type Provider = { name: string; specialty?: string };
type Consultation = {
    id: string;
    patientName?: string;
    status?: string;
};

export default async function CallPage({
                                           params,
                                           searchParams,
                                       }: {
    params: { id: string };
    searchParams: { mode?: string };
}) {
    const twoDoctors = searchParams?.mode !== "1";
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

    const consultation: Consultation = useMock
        ? { ...mockConsultation, id: params.id }
        : await apiGet<Consultation>(`/api/v1/consultations/${params.id}`);

    const providers: Provider[] = useMock
        ? (twoDoctors ? mockProvidersTwo : mockProvidersOne)
        : await apiGet<Provider[]>(`/api/v1/consultations/${params.id}/providers`);

    const doctorA = providers?.[0]?.name ?? "Doctor";
    const doctorB = providers?.[1]?.name ?? "Doctor";
    const doctorASpec = providers?.[0]?.specialty ?? "Clinician";
    const doctorBSpec = providers?.[1]?.specialty ?? "Clinician";
    const patientName = consultation?.patientName ?? "Patient";

    return (
        <AppShell>
            {/* Top status */}
            <div className="mb-6 flex items-center justify-between">
                <div className="w-[180px]" />
                <div className="flex items-center gap-3 text-sm text-[rgba(15,23,42,0.55)]">
                    <span className="font-medium">Live consultation</span>
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="rounded-full bg-white/60 px-4 py-2 shadow-sm">05:18</span>
                </div>
                <button
                    className="rounded-full bg-rose-400/70 px-8 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(244,63,94,0.25)] hover:bg-rose-500/70"
                    type="button"
                >
                    End Call
                </button>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                {/* Left toolbar */}
                <div className="hidden lg:col-span-1 lg:flex">
                    <LeftToolbar />
                </div>

                {/* Video area */}
                <div className="lg:col-span-7">
                    {twoDoctors ? (
                        <div className="grid grid-cols-12 gap-6">
                            {/* 2 small doctors */}
                            <div className="col-span-4 space-y-6">
                                <div className="relative h-[210px]">
                                    <VideoTile
                                        src="/mock/doctor1.png"
                                        name={doctorA}
                                        subtitle={doctorASpec}
                                    />
                                </div>
                                <div className="relative h-[210px]">
                                    <VideoTile
                                        src="/mock/doctor2.png"
                                        name={doctorB}
                                        subtitle={doctorBSpec}
                                    />
                                </div>
                            </div>

                            {/* big patient */}
                            <div className="col-span-8">
                                <div className="relative h-[460px]">
                                    <VideoTile src="/mock/doctor3.png" name={patientName} glow />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="relative h-[260px]">
                                <VideoTile
                                    src="/mock/doctor2.png"
                                    name={doctorA}
                                    subtitle={doctorASpec}
                                />
                            </div>
                            <div className="relative h-[320px]">
                                <VideoTile src="/mock/doctor3.png" name={patientName} />
                            </div>
                        </div>
                    )}

                    <CallControls endLabel={twoDoctors ? "End Call" : "Leave Call"} />
                </div>

                {/* Right panel */}
                <div className="lg:col-span-4">
                    <div className="h-full min-h-[560px]">
                        <RightPanelTabs initial="Chat" />
                    </div>
                </div>
            </div>
        </AppShell>
    );
}