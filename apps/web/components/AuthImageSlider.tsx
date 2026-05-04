"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Slide = {
    title: string;
    subtitle: string;
};

const slides: Slide[] = [
    {
        title: "SIMPLE ONLINE APPOINTMENTS",
        subtitle: "Book and connect with a doctor in just a few clicks.",
    },
    {
        title: "SECURE VIDEO CARE FROM HOME",
        subtitle: "Meet with licensed clinicians through private, high-quality visits on any device.",
    },
    {
        title: "YOUR HEALTH JOURNEY, SIMPLIFIED",
        subtitle: "Schedule visits, get reminders, and stay on track—all in one place.",
    },
];

const AUTO_ADVANCE_MS = 3000;

type AuthImageSliderProps = { rootClassName?: string };

export function AuthImageSlider({ rootClassName }: AuthImageSliderProps = {}) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [autoCycleKey, setAutoCycleKey] = useState(0);
    const root =
        rootClassName ??
        "relative h-full min-h-[360px] w-full overflow-hidden rounded-2xl";

    useEffect(() => {
        const id = window.setInterval(() => {
            setActiveIndex((i) => (i + 1) % slides.length);
        }, AUTO_ADVANCE_MS);
        return () => window.clearInterval(id);
    }, [autoCycleKey]);

    function goToSlide(index: number) {
        setActiveIndex(index);
        setAutoCycleKey((k) => k + 1);
    }

    return (
        <div className={root}>
            <Image src="/auth-doctor.png" alt="Doctor consultation visual" fill className="object-cover" />

            <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(239,248,255,0.92)_35%,rgba(209,233,255,0.98)_100%)] p-5">
                <div key={activeIndex} className="auth-slider-text">
                    <p className="text-[22px] font-extrabold leading-tight text-q-heading">{slides[activeIndex].title}</p>
                    <p className="mt-1 text-sm font-medium text-q-label">{slides[activeIndex].subtitle}</p>
                </div>

                <div className="mt-3 flex items-center gap-2">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            aria-label={`Go to slide ${index + 1}`}
                            aria-current={activeIndex === index ? "true" : undefined}
                            onClick={() => goToSlide(index)}
                            className={`h-[6px] rounded-full transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-q-accent ${
                                activeIndex === index
                                    ? "w-7 bg-q-accent"
                                    : "w-3 bg-q-border hover:bg-q-border-strong"
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}