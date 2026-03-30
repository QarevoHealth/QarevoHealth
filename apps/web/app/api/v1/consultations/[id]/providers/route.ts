import { getProviders } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const providers = await getProviders(id);
        return NextResponse.json(providers);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch providers";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
