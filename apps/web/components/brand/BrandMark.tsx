import Image from "next/image";

const SRC = "/brand/qarevo-symbol.png";

type BrandMarkProps = {
    size?: number;
    className?: string;
    priority?: boolean;
};

export function BrandMark({ size = 32, className, priority = false }: BrandMarkProps) {
    return (
        <Image
            src={SRC}
            alt="Qarevo Health"
            width={size}
            height={size}
            className={className}
            priority={priority}
        />
    );
}

export const QAREVO_ICON_SRC = SRC;
