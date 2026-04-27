import type { ReactNode } from "react";
import { authCardClassName } from "./figma-tokens";

type AuthCardProps = {
    form: ReactNode;
    hero: ReactNode;
};

export function AuthCard({ form, hero }: AuthCardProps) {
    return (
        <div
            className={`${authCardClassName} mx-auto flex w-full max-w-[920px] items-center justify-center gap-6`}
        >
            <div className="flex w-full max-w-[400px] shrink-0 flex-col justify-center">
                {form}
            </div>

            <div className="hidden w-full max-w-[480px] shrink-0 lg:block">
                {hero}
            </div>
        </div>
    );
}