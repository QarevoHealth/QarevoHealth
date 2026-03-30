import Image from "next/image";

export function VideoTile({
                              src,
                              name,
                              subtitle,
                              className = "",
                              glow = false,
                          }: {
    src: string;
    name: string;
    subtitle?: string;
    className?: string;
    glow?: boolean;
}) {
    return (
        <div className={["relative h-full w-full overflow-hidden rounded-[26px]", className].join(" ")}>
            {/* optional glow like in the “2 doctors” view */}
            {glow && (
                <div className="pointer-events-none absolute inset-0 shadow-[0_0_0_6px_rgba(61,213,178,0.25)]" />
            )}

            <Image
                src={src}
                alt={name}
                fill
                className="object-cover"
                sizes="(max-width: 1200px) 100vw, 600px"
                priority
            />

            {/* Name label */}
            <div className="absolute bottom-3 left-3 rounded-md bg-white/70 px-3 py-2 text-xs shadow-sm backdrop-blur">
                <div className="font-semibold">{name}</div>
                {subtitle ? <div className="text-[rgba(15,23,42,0.65)]">{subtitle}</div> : null}
            </div>
        </div>
    );
}