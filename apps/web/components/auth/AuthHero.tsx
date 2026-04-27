import Image from "next/image";
import { HeroSlider } from "./HeroSlider";

export function AuthHero() {
    return (
        <div className="relative mx-auto h-full min-h-[400px] w-full overflow-hidden rounded-2xl bg-slate-900 lg:min-h-[543px]">
            <Image
                src="/brand/auth-hero.png"
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 480px"
                className="object-cover object-center"
            />
            <div
                className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/15 via-slate-900/35 to-black/80"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(120%_80%_at_80%_20%,rgba(96,153,200,0.2),transparent_55%)]"
                aria-hidden
            />
            <HeroSlider />
        </div>
    );
}