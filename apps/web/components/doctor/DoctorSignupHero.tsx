"use client";

import Image from "next/image";

const DEFAULT_HERO = "/doctor-portal-hero.png";

type DoctorSignupHeroProps = {
    imageSrc?: string;
};

export function DoctorSignupHero({ imageSrc = DEFAULT_HERO }: DoctorSignupHeroProps) {
    return (
        <div className="relative min-h-[420px] w-full overflow-hidden rounded-2xl border border-q-azure-200 shadow-sm sm:min-h-[520px] lg:min-h-[620px]">
            <Image
                src={imageSrc}
                alt="Doctor using Qarevo Health on a tablet"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
            />
        </div>
    );
}
