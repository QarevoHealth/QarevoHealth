"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/** Default doctor user_id for testing */
const DEFAULT_DOCTOR_USER_ID = "a1b2c3d4-5e6f-7890-abcd-ef1234567890";

/**
 * Redirects to the new waiting URL: /consultation/{id}/waiting/user/{userId}
 * Doctor opens that URL, sees waiting screen, clicks Join Call to join.
 */
export default function DoctorJoinPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const consultationId = (params?.id as string) ?? "123";
    const userId = searchParams.get("userId") ?? DEFAULT_DOCTOR_USER_ID;

    useEffect(() => {
        router.replace(`/consultation/${consultationId}/waiting/user/${userId}`);
    }, [consultationId, userId, router]);

    return null;
}
