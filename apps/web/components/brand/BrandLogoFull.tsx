import Image from "next/image";

const SRC = "/brand/qarevo-logo-full.png";

type BrandLogoFullProps = {
    className?: string;
    priority?: boolean;
    height?: number;
};

export function BrandLogoFull({
    className = "",
    priority = false,
    height = 32,
}: BrandLogoFullProps) {
    const w = Math.min(220, Math.round(height * 4.4));
    return (
        <span
            className={`relative inline-block max-w-[min(220px,55vw)] shrink-0 ${className}`.trim()}
            style={{ height, width: w }}
        >
            <Image
                src={SRC}
                alt="Qarevo Health"
                fill
                priority={priority}
                sizes="220px"
                className="object-contain object-left"
            />
        </span>
    );
}

export const QAREVO_LOGO_FULL_SRC = SRC;
