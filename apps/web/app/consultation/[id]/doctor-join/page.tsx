"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/** Default doctor user_id for testing */
const DEFAULT_PROVIDER_USER_ID = "4dc8a45f-3e8d-4912-a41f-d193a1a1f70c";

/**
 * Redirects to the new waiting URL: /consultation/{id}/waiting/user/{userId}
 * Doctor opens that URL, sees waiting screen, clicks Join Call to join.
 */
export default function DoctorJoinPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const consultationId = (params?.id as string) ?? "123";
    const userId = searchParams.get("userId") ?? DEFAULT_PROVIDER_USER_ID;

    useEffect(() => {
        router.replace(`/consultation/${consultationId}/waiting/user/${userId}`);
    }, [consultationId, userId, router]);

    return null;
}
