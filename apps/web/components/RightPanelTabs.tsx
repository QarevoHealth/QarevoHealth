"use client";

import { useState } from "react";
import { GlassPanel } from "./GlassPanel";

type Tab = "Chat" | "Note" | "Patient data" | "Files";

export function RightPanelTabs({ initial = "Chat" }: { initial?: Tab }) {
    const [tab, setTab] = useState<Tab>(initial as Tab);

    const tabs: Tab[] = ["Chat", "Note", "Patient data", "Files"];

    return (
        <GlassPanel className="h-full p-6">
            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-white/60 pb-4 text-sm font-semibold">
                {tabs.map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={[
                            "transition",
                            tab === t ? "text-[var(--q-text)]" : "text-[rgba(15,23,42,0.45)] hover:text-[rgba(15,23,42,0.65)]",
                        ].join(" ")}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="pt-6">
                {tab === "Chat" && <ChatMock />}
                {tab === "Files" && <FilesMock />}
                {tab === "Note" && <NoteMock />}
                {tab === "Patient data" && <PatientDataMock />}
            </div>

            {/* Footer link */}
            <div className="mt-8 flex items-center gap-2 text-sm text-[rgba(15,23,42,0.55)]">
                <span className="inline-block h-5 w-5 rounded bg-white/60" />
                <span>Need assistance? Our support team is available</span>
            </div>
        </GlassPanel>
    );
}

/* --- simple mocks to match your screenshots --- */

function ChatMock() {
    return (
        <div className="space-y-5">
            <div className="flex gap-3">
                <div className="h-9 w-9 rounded-full bg-white/70 shadow-sm" />
                <div className="max-w-[320px] rounded-[18px] bg-white/75 p-4 shadow-sm">
                    <p className="text-sm text-[rgba(15,23,42,0.65)]">
                        Good morning Olivia. We will start our consultation right away. First, can you hear me clearly?
                    </p>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <div className="max-w-[320px] rounded-[18px] bg-white/65 p-4 shadow-sm">
                    <p className="text-sm text-[rgba(15,23,42,0.65)]">
                        Good morning Dr. Wesley. Yes, I can hear you.
                    </p>
                </div>
                <div className="h-9 w-9 rounded-full bg-white/70 shadow-sm" />
            </div>

            <div className="mt-10 flex items-center gap-3 rounded-[18px] bg-white/55 px-4 py-3 shadow-sm">
                <span className="text-lg text-[rgba(15,23,42,0.55)]">＋</span>
                <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[rgba(15,23,42,0.35)]"
                    placeholder="Type a message..."
                />
                <span className="text-[rgba(15,23,42,0.55)]">➤</span>
            </div>
        </div>
    );
}

function FilesMock() {
    return (
        <div className="flex items-center justify-center py-16">
            <div className="w-[340px] rounded-[20px] bg-white/70 p-8 text-center shadow-sm">
                <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-white/80" />
                <div className="text-sm text-[rgba(15,23,42,0.55)]">Drag & Drop file here</div>
                <div className="text-sm text-[rgba(15,23,42,0.45)]">or</div>
                <button
                    className="mt-4 rounded-full bg-[var(--q-primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[var(--q-primary-hover)]"
                    type="button"
                >
                    Browse file
                </button>
            </div>
        </div>
    );
}

function NoteMock() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Clinical Notes</div>
                <div className="text-sm text-[rgba(15,23,42,0.45)]">
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    Saved 10:42 AM
                </div>
            </div>

            <div className="rounded-[22px] bg-white/65 p-5 shadow-sm">
                <div className="text-sm font-semibold">Symptoms</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-[rgba(15,23,42,0.55)]">
                    <li>Skin Rash</li>
                    <li>Itching</li>
                    <li>Redness</li>
                </ul>

                <div className="mt-4 text-sm font-semibold">Diagnosis</div>
                <div className="mt-2 inline-flex rounded-full bg-amber-100/70 px-4 py-2 text-sm text-[rgba(15,23,42,0.65)]">
                    Dermatitis (suspected)
                </div>
            </div>

            <div className="rounded-[18px] bg-white/55 px-4 py-3 shadow-sm">
                <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[rgba(15,23,42,0.35)]"
                    placeholder="Add internal note..."
                />
            </div>
        </div>
    );
}

function PatientDataMock() {
    return (
        <div className="space-y-4">
            <div className="rounded-[22px] bg-white/65 p-5 shadow-sm">
                <div className="text-sm font-semibold">Olivia Clark</div>
                <div className="mt-2 text-sm text-[rgba(15,23,42,0.55)]">January 17, 1998 (28 years old)</div>
                <div className="text-sm text-[rgba(15,23,42,0.55)]">Female</div>
            </div>

            <div className="rounded-[22px] bg-white/65 p-5 shadow-sm">
                <div className="text-sm font-semibold">Medical Alerts</div>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-100/70 px-4 py-2 text-sm text-[rgba(15,23,42,0.65)]">
                    ⚠️ Allergy: Penicillin
                </div>
            </div>

            <div className="rounded-[22px] bg-white/65 p-5 shadow-sm">
                <div className="text-sm font-semibold">Current Medication</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-[rgba(15,23,42,0.55)]">
                    <li>Metoformin 500mg 1x daily</li>
                    <li>Ibuprofen 200mg (As needed)</li>
                </ul>
            </div>
        </div>
    );
}