import { MeetingSessionConfiguration } from "amazon-chime-sdk-js";

export type ChimeJoinResponse = {
    meeting_id: string;
    attendee_id: string;
    join_token: string;
    media_placement: Record<string, string>;
    join_url: string;
};

export function toMeetingSessionConfiguration(res: ChimeJoinResponse): MeetingSessionConfiguration {
    const mp = res.media_placement || {};
    const meetingResponse = {
        MeetingId: res.meeting_id,
        MediaPlacement: {
            AudioHostUrl: mp.AudioHostUrl ?? mp.audio_host_url ?? "",
            AudioFallbackUrl: mp.AudioFallbackUrl ?? mp.audio_fallback_url ?? "",
            SignalingUrl: mp.SignalingUrl ?? mp.signaling_url ?? "",
            TurnControlUrl: mp.TurnControlUrl ?? mp.turn_control_url ?? "",
        },
    };
    const attendeeResponse = {
        AttendeeId: res.attendee_id,
        JoinToken: res.join_token,
        ExternalUserId: res.attendee_id,
    };
    return new MeetingSessionConfiguration(meetingResponse, attendeeResponse);
}
