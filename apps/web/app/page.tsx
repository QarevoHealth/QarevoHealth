import { RoleSelectModal } from "@/components/auth/RoleSelectModal";
import { SignupScreen } from "@/components/auth/SignupScreen";

export default function HomePage() {
    return (
        <div className="relative">
            <div aria-hidden className="pointer-events-none blur-[3px]">
                <SignupScreen role="patient" />
            </div>
            <RoleSelectModal />
        </div>
    );
}
