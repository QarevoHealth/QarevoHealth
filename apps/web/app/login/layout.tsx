import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Log in — Qarevo Health",
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
