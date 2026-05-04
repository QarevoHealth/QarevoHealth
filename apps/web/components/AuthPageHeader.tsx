import Image from "next/image";

type AuthPageHeaderProps = {
    /** Right side: login menu (patient), plain link (doctor), etc. Omit for logo-only. */
    children?: React.ReactNode;
    className?: string;
};

export function AuthPageHeader({ children, className = "" }: AuthPageHeaderProps) {
    return (
        <header
            className={`relative z-10 flex items-center justify-between border-b border-q-border bg-q-azure-50/90 px-10 py-4 backdrop-blur ${className}`.trim()}
        >
            <div className="flex items-center gap-2">
                <Image src="/logo-symbol.png" alt="Qarevo logo" width={24} height={24} />
                <span className="text-[30px] font-semibold text-q-heading">Qarevo Health</span>
            </div>
            {children}
        </header>
    );
}
