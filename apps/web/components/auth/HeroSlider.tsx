"use client";

import { useState } from "react";

type Slide = {
    title: string;
    description: string;
};

/** Right-column carousel (Figma: panel over hero image, pagination dots). */
const SLIDES: Slide[] = [
    {
        title: "Simple online appointments",
        description: "Book and connect with a doctor in just a few clicks.",
    },
    {
        title: "Healthcare that fits your life",
        description: "Access healthcare anytime, from the comfort of your home.",
    },
    {
        title: "Trusted, verified doctors",
        description: "All specialists are carefully vetted and licensed.",
    },
];

export function HeroSlider() {
    const [index, setIndex] = useState(0);

    const slide = SLIDES[index];

    return (
        <div className="absolute bottom-0 left-0 right-0 rounded-b-2xl bg-surface-panel px-8 pb-3 pt-0">
            <div className="border-t border-white/40 px-0 pb-4 pt-6">
                <h2 className="text-[20px] font-black uppercase leading-7 text-primary">
                    {slide.title}
                </h2>
                <p className="mt-2 text-[13px] font-semibold leading-4 text-secondary">
                    {slide.description}
                </p>
            </div>

            <div className="flex items-center justify-center gap-1.5 pb-3">
                {SLIDES.map((_, i) => {
                    const active = i === index;
                    return (
                        <button
                            key={i}
                            type="button"
                            aria-label={`Slide ${i + 1}`}
                            aria-current={active}
                            onClick={() => setIndex(i)}
                            className={
                                active
                                    ? "h-1.5 w-7 rounded-full bg-secondary transition-all"
                                    : "h-1.5 w-1.5 rounded-full bg-secondary/30 transition-all"
                            }
                        />
                    );
                })}
            </div>
        </div>
    );
}
