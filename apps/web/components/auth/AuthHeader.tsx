import Link from "next/link";
import { BrandLogoFull } from "@/components/brand/BrandLogoFull";

export function AuthHeader() {
    return (
        <header className="border-b border-border bg-white">
            <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3 sm:px-10 md:px-14">
                <Link href="/" className="inline-flex transition-opacity hover:opacity-90">
                    <BrandLogoFull height={32} priority />
                </Link>

                <p className="text-sm text-muted-foreground">
                    Do you already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-semibold text-primary hover:underline"
                    >
                        Log in
                    </Link>
                </p>
            </div>
        </header>
    );
}
