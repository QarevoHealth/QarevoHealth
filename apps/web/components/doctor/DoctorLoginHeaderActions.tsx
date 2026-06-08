"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLoginRoleMenu } from "@/components/AuthLoginRoleMenu";

export function DoctorLoginHeaderActions() {
    const router = useRouter();
    return (
        <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2">
            <AuthLoginRoleMenu
                onSelectPatient={() => router.push("/patient/register?login=1")}
                onSelectDoctor={() => router.push("/doctor/login")}
            />
           
        </div>
    );
}
