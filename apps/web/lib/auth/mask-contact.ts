export function maskEmailForDisplay(email: string): string {
    const trimmed = email.trim();
    const [local, domain] = trimmed.split("@");
    if (!local || !domain) return trimmed;
    const visible = local.length <= 2 ? local : `${local[0]}${"*".repeat(Math.max(0, local.length - 2))}${local.slice(-1)}`;
    return `${visible}@${domain}`;
}

export function maskPhoneForDisplay(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.length <= 4) return phone;
    const visible = digits.slice(-4);
    return `•••• ${visible}`;
}

export function pickLoginEmailForMask(identifier: string, apiEmail: unknown): string {
    if (typeof apiEmail === "string" && apiEmail.trim()) return apiEmail.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) return identifier.trim();
    return "";
}

export function pickLoginPhoneForMask(identifier: string, apiPhone: unknown): string {
    if (typeof apiPhone === "string" && apiPhone.trim()) return apiPhone.trim();
    const digits = identifier.replace(/\D/g, "");
    if (digits.length >= 7) return identifier.trim();
    return "";
}

export function pickMfaPhoneForVerify(
    identifier: string,
    data: Record<string, unknown>
): { country_code: string; phone: string } {
    const country = typeof data.country_code === "string" ? data.country_code.trim() : typeof data.countryCode === "string" ? data.countryCode.trim() : "";
    const phone = typeof data.phone === "string" ? data.phone.trim() : typeof data.phone_number === "string" ? data.phone_number.trim() : "";
    if (country && phone) {
        return { country_code: country, phone };
    }
    const normalized = identifier.trim();
    const digits = normalized.replace(/\D/g, "");
    if (digits.length >= 7) {
        const matched = normalized.match(/^\s*([+\d]*)\s*(.*)$/);
        return {
            country_code: matched?.[1] ? matched[1] : "+1",
            phone: matched?.[2] ? matched[2] : digits,
        };
    }
    return { country_code: "+1", phone: normalized };
}
