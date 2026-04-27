import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Complete profile — Qarevo Health",
};

export default function CompleteProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
