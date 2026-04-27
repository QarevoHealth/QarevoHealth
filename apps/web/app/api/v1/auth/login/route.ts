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
        const body = await request.json();
        const res = await fetch(`${getBaseUrl()}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to login";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
