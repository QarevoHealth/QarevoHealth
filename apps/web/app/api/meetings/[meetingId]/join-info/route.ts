import { NextResponse } from "next/server";

/**
 * Fetches meeting media_placement from backend and merges with join params from URL.
 * Tries in order:
 * 1. GET /api/v1/meetings/:meetingId -> { media_placement }
 * 2. POST /api/v1/meetings/join-by-token -> { meeting_id, attendee_id, join_token, media_placement }
 */
async function getMeetingInfo(
    meetingId: string,
    joinToken: string,
    attendeeId: string
): Promise<{ media_placement: Record<string, string> }> {
    const baseUrl = process.env.API_BASE_URL || "http://localhost:8000";

    const getRes = await fetch(`${baseUrl}/api/v1/meetings/${meetingId}`, {
        cache: "no-store",
    });
    if (getRes.ok) {
        const data = await getRes.json();
        const mp = data.media_placement ?? data.MediaPlacement ?? {};
        return { media_placement: typeof mp === "object" ? mp : {} };
    }

    const postRes = await fetch(`${baseUrl}/api/v1/meetings/join-by-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            meeting_id: meetingId,
            join_token: joinToken,
            attendee_id: attendeeId,
        }),
        cache: "no-store",
    });
    if (postRes.ok) {
        const data = await postRes.json();
        const mp = data.media_placement ?? data.MediaPlacement ?? {};
        return { media_placement: typeof mp === "object" ? mp : {} };
    }

    const errText = await getRes.text().catch(() => "") || (await postRes.text().catch(() => ""));
    throw new Error(
        `Meeting API error: Backend must implement GET /api/v1/meetings/:meetingId or POST /api/v1/meetings/join-by-token. ${errText}`
    );
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ meetingId: string }> }
) {
    try {
        const { meetingId } = await params;
        const { searchParams } = new URL(_request.url);
        const joinToken = searchParams.get("joinToken");
        const attendeeId = searchParams.get("attendeeId");

        if (!meetingId || !joinToken || !attendeeId) {
            return NextResponse.json(
                { error: "Missing meetingId, joinToken, or attendeeId" },
                { status: 400 }
            );
        }

        const meetingInfo = await getMeetingInfo(meetingId, joinToken, attendeeId);
        const media_placement = meetingInfo.media_placement ?? {};

        const joinData = {
            meeting_id: meetingId,
            attendee_id: attendeeId,
            join_token: joinToken,
            media_placement:
                typeof media_placement === "object"
                    ? media_placement
                    : {},
            join_url: "",
        };

        return NextResponse.json(joinData);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get join info";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
