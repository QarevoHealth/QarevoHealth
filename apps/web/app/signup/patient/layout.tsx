import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patient Signup — Qarevo Health",
};

export default function PatientSignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
