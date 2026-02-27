export async function apiGet<T>(path: string): Promise<T> {
    const baseUrl = process.env.API_BASE_URL;
    if (!baseUrl) throw new Error("API_BASE_URL is not set");

    const res = await fetch(`${baseUrl}${path}`, {
        // später: auth headers
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API error ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
}