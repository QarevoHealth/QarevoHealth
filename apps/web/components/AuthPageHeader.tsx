import Image from "next/image";

type AuthPageHeaderProps = {
    /** Right side: login menu (patient), plain link (doctor), etc. Omit for logo-only. */
    children?: React.ReactNode;
    className?: string;
};

export function AuthPageHeader({ children, className = "" }: AuthPageHeaderProps) {
    return (
        <header
            className={`relative z-10 flex items-center justify-between border-b border-[#e0e6ef] bg-white/80 px-10 py-4 backdrop-blur ${className}`.trim()}
        >
            <div className="flex items-center gap-2">
                <Image src="/logo-symbol.png" alt="Qarevo logo" width={24} height={24} />
                <span className="text-[20px] font-semibold text-[#16355e]">Qarevo Health</span>
            </div>
            {children}
        </header>
    );
}
