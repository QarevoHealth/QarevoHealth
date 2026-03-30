import { createMeeting } from "@/lib/api";
import { NextResponse } from "next/server";

function getNowISO() {
    return new Date().toISOString();
}

function getEndTimeISO(hoursFromNow: number) {
    const d = new Date();
    d.setHours(d.getHours() + hoursFromNow);
    return d.toISOString();
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const patientId = body.patient_id ?? process.env.DEMO_PATIENT_ID ?? "3fa85f64-5717-4562-b3fc-2c963f66afa6";
        const providerId = body.provider_id ?? process.env.DEMO_PROVIDER_ID ?? "3fa85f64-5717-4562-b3fc-2c963f66afa6";

        const now = getNowISO();
        const endAt = getEndTimeISO(2);

        const response = await createMeeting({
            patient_id: patientId,
            provider_ids: [providerId],
            scheduled_at: now,
            start_at: now,
            end_at: endAt,
        });


        return NextResponse.json(response);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create meeting";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
