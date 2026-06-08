import { NextResponse } from "next/server";

const getBaseUrl = () => {
    const baseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
        throw new Error("API_BASE_URL or NEXT_PUBLIC_API_BASE_URL must be set in .env");
    }
    return baseUrl;
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json({ error: "Missing token" }, { status: 400 });
        }

        const res = await fetch(`${getBaseUrl()}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`, {
            method: "GET",
            cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to verify email";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
