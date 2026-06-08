import { NextResponse } from "next/server";

const getBaseUrl = () => {
    const baseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
        throw new Error("API_BASE_URL or NEXT_PUBLIC_API_BASE_URL must be set in .env");
    }
    return baseUrl;
};

export async function POST(request: Request) {
    try {
        const auth = request.headers.get("authorization");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (auth) headers.Authorization = auth;

        let body = "{}";
        try {
            body = await request.text();
            if (!body.trim()) body = "{}";
        } catch {
            body = "{}";
        }

        const res = await fetch(`${getBaseUrl()}/api/v1/auth/mfa/resend-email`, {
            method: "POST",
            headers,
            body,
            cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to resend MFA email code";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
