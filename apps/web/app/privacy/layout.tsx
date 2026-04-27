import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy policy — Qarevo Health",
};

export default function PrivacyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
