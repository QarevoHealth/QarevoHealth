import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Doctor Signup — Qarevo Health",
};

export default function DoctorSignupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
