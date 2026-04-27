import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Verify email — Qarevo Health",
};

export default function VerifyEmailLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
