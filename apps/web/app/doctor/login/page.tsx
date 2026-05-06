import { AuthPageHeader } from "@/components/AuthPageHeader";
import { DoctorLoginForm, DoctorLoginHeaderActions, DoctorRegisterBackdrop } from "@/components/doctor";

export default function DoctorLoginPage() {
    return (
        <div className="relative min-h-screen overflow-hidden">
            <DoctorRegisterBackdrop />
            <AuthPageHeader className="relative z-10 border-b border-q-azure-200 bg-white/95 shadow-sm backdrop-blur-md">
                <DoctorLoginHeaderActions />
            </AuthPageHeader>

            <main className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-[92%] max-w-md items-center justify-center py-10 sm:py-14">
                <DoctorLoginForm />
            </main>
        </div>
    );
}
