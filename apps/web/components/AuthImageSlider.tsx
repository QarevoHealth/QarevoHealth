"use client";

import Image from "next/image";
import { useState } from "react";

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
        title: "SIMPLE ONLINE APPOINTMENTS",
        subtitle: "Book and connect with a doctor in just a few clicks.",
    },
    {
        title: "SIMPLE ONLINE APPOINTMENTS",
        subtitle: "Book and connect with a doctor in just a few clicks.",
    },
];

export function AuthImageSlider() {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="relative h-full min-h-[360px] w-full overflow-hidden rounded-2xl">
            <Image src="/auth-doctor.png" alt="Doctor consultation visual" fill className="object-cover" />

            <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(235,243,252,0.92)_35%,rgba(230,240,250,0.98)_100%)] p-5">
                <p className="text-[22px] font-extrabold leading-tight text-[#1f3556]">{slides[activeIndex].title}</p>
                <p className="mt-1 text-sm font-medium text-[#3d5f88]">{slides[activeIndex].subtitle}</p>

                <div className="mt-3 flex items-center gap-2">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            aria-label={`Go to slide ${index + 1}`}
                            onClick={() => setActiveIndex(index)}
                            className={`h-[6px] rounded-full transition-all ${
                                activeIndex === index ? "w-7 bg-[#2f7dbd]" : "w-3 bg-[#c8d9eb]"
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
