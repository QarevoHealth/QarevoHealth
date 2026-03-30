import { NextResponse } from "next/server";

/** Default patient user_id for testing when none provided */
const DEFAULT_PATIENT_USER_ID = "f730d30a-1b30-4e07-a1b7-1c35f892ca3f";

/** Default doctor user_id for testing when none provided */
const DEFAULT_DOCTOR_USER_ID = "4dc8a45f-3e8d-4912-a41f-d193a1a1f70c";

async function getJoinToken(consultationId: string, userId: string) {
    const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
    const joinUrl = `${baseUrl}/api/v1/consultations/${consultationId}/video-session/join`;
    const res = await fetch(joinUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Join API error ${res.status}: ${text}`);
    }
    return res.json();
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        let userId = DEFAULT_PATIENT_USER_ID;
        try {
            const body = await request.json();
            if (body?.user_id && typeof body.user_id === "string") {
                userId = body.user_id;
            } else if (body?.role === "doctor" || body?.role === "provider") {
                userId = body.user_id ?? DEFAULT_DOCTOR_USER_ID;
            }
        } catch {
            // ignore, use default
        }
        const data = await getJoinToken(id, userId);
        return NextResponse.json(data);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get join token";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
