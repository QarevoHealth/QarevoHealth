"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { MessageCircle, Send, ChevronDown, Plus, Trash2, FileText, Upload, X } from "lucide-react";
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
                <MessageCircle className="h-5 w-5 shrink-0" />
                <span>Need assistance? Our support team is available</span>
            </div>
        </GlassPanel>
    );
}

/* --- Chat with doctor avatar, welcome message, and send as doctor/patient --- */

const WELCOME_MESSAGE = "Good morning Olivia. We will start our consultation right away. First, can you hear me clearly?";

type ChatMessage = { text: string; sender: "doctor" | "patient" };

function ChatMock() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [sendAs, setSendAs] = useState<"doctor" | "patient">("patient");
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        setMessages((prev) => [...prev, { text: trimmed, sender: sendAs }]);
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const allMessages: ChatMessage[] = [
        { text: WELCOME_MESSAGE, sender: "doctor" },
        ...messages,
    ];

    return (
        <div className="flex flex-col">
            <div className="max-h-[280px] space-y-5 overflow-y-auto pr-1">
                {allMessages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex gap-3 ${msg.sender === "patient" ? "flex-row-reverse" : ""}`}
                    >
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/70 shadow-sm">
                            <Image
                                src={msg.sender === "doctor" ? "/mock/doctor2.png" : "/mock/doctor3.png"}
                                alt={msg.sender === "doctor" ? "Doctor" : "Patient"}
                                fill
                                className="object-cover"
                                sizes="36px"
                            />
                        </div>
                        <div
                            className={`max-w-[320px] rounded-[18px] p-4 shadow-sm ${
                                msg.sender === "doctor" ? "bg-white/75" : "bg-white/65"
                            }`}
                        >
                            <p className="text-sm text-[rgba(15,23,42,0.65)]">{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[rgba(15,23,42,0.5)]">Send as:</span>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                            className="flex items-center gap-1 rounded-full bg-white/55 px-3 py-1.5 text-xs font-medium text-[rgba(15,23,42,0.7)] shadow-sm hover:bg-white/70"
                        >
                            {sendAs === "doctor" ? "Doctor" : "Patient"}
                            <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        {showRoleDropdown && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowRoleDropdown(false)}
                                    aria-hidden
                                />
                                <div className="absolute left-0 top-full z-20 mt-1 min-w-[100px] rounded-lg bg-white/95 py-1 shadow-lg backdrop-blur">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSendAs("doctor");
                                            setShowRoleDropdown(false);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-white/70"
                                    >
                                        Doctor
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSendAs("patient");
                                            setShowRoleDropdown(false);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-white/70"
                                    >
                                        Patient
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded-[18px] bg-white/55 px-4 py-3 shadow-sm">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-transparent text-sm outline-none placeholder:text-[rgba(15,23,42,0.35)]"
                        placeholder="Type a message..."
                    />
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="shrink-0 rounded-full p-1.5 text-[rgba(15,23,42,0.55)] transition hover:bg-white/60 hover:text-[var(--q-text)] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[rgba(15,23,42,0.55)]"
                        aria-label="Send"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

type UploadedFile = { file: File; id: string };

function FilesMock() {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const addFiles = (newFiles: FileList | File[]) => {
        const list = Array.from(newFiles);
        const items: UploadedFile[] = list.map((file) => ({
            file,
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        }));
        setFiles((prev) => [...prev, ...items]);
    };

    const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

    const handleBrowse = () => inputRef.current?.click();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files;
        if (selected?.length) {
            addFiles(selected);
            e.target.value = "";
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleUpload = async () => {
        if (files.length === 0) return;
        setUploading(true);
        // Simulate upload delay; replace with actual API call when backend is ready
        await new Promise((r) => setTimeout(r, 800));
        setUploading(false);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-4">
            <input
                ref={inputRef}
                type="file"
                multiple
                onChange={handleInputChange}
                className="hidden"
                aria-hidden
            />

            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`rounded-[20px] border-2 border-dashed p-8 text-center transition ${
                    isDragging ? "border-[var(--q-primary)] bg-emerald-50/50" : "border-white/60 bg-white/70"
                }`}
            >
                <Upload className="mx-auto mb-3 h-10 w-10 text-[rgba(15,23,42,0.5)]" />
                <div className="text-sm text-[rgba(15,23,42,0.55)]">Drag & Drop file here</div>
                <div className="text-sm text-[rgba(15,23,42,0.45)]">or</div>
                <button
                    type="button"
                    onClick={handleBrowse}
                    className="mt-4 rounded-full bg-[var(--q-primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[var(--q-primary-hover)]"
                >
                    Browse file
                </button>
            </div>

            {files.length > 0 && (
                <div className="space-y-2">
                    <div className="text-sm font-semibold">Selected files ({files.length})</div>
                    <ul className="max-h-[180px] space-y-2 overflow-y-auto">
                        {files.map(({ file, id }) => (
                            <li
                                key={id}
                                className="flex items-center gap-3 rounded-lg bg-white/65 px-3 py-2 shadow-sm"
                            >
                                <FileText size={18} className="shrink-0 text-[rgba(15,23,42,0.5)]" />
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium">{file.name}</div>
                                    <div className="text-xs text-[rgba(15,23,42,0.5)]">{formatSize(file.size)}</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFile(id)}
                                    className="rounded p-1 text-[rgba(15,23,42,0.45)] hover:bg-rose-100/50 hover:text-rose-600"
                                    aria-label="Remove file"
                                >
                                    <X size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={uploading}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--q-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--q-primary-hover)] disabled:opacity-70"
                    >
                        {uploading ? (
                            "Uploading..."
                        ) : (
                            <>
                                <Upload size={16} />
                                Upload {files.length} file{files.length > 1 ? "s" : ""}
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

function NoteMock() {
    const [symptoms, setSymptoms] = useState(["Skin Rash", "Itching", "Redness"]);
    const [diagnosis, setDiagnosis] = useState("Dermatitis (suspected)");
    const [internalNote, setInternalNote] = useState("");
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const addSymptom = () => setSymptoms((prev) => [...prev, ""]);
    const removeSymptom = (i: number) => setSymptoms((prev) => prev.filter((_, idx) => idx !== i));
    const updateSymptom = (i: number, value: string) =>
        setSymptoms((prev) => prev.map((s, idx) => (idx === i ? value : s)));

    const handleSave = () => setLastSaved(new Date());

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Clinical Notes</div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-[rgba(15,23,42,0.45)]">
                        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                        {lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Unsaved"}
                    </span>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="rounded-full bg-[var(--q-primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[var(--q-primary-hover)]"
                    >
                        Save
                    </button>
                </div>
            </div>

            <div className="rounded-[22px] bg-white/65 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Symptoms</div>
                    <button
                        type="button"
                        onClick={addSymptom}
                        className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-[rgba(15,23,42,0.7)] shadow-sm hover:bg-white/90"
                    >
                        <Plus size={14} /> Add
                    </button>
                </div>
                <ul className="mt-2 space-y-2">
                    {symptoms.map((s, i) => (
                        <li key={i} className="flex items-center gap-2">
                            <span className="text-[rgba(15,23,42,0.45)]">•</span>
                            <input
                                value={s}
                                onChange={(e) => updateSymptom(i, e.target.value)}
                                placeholder="Enter symptom..."
                                className="flex-1 rounded-md bg-white/50 px-2 py-1.5 text-sm outline-none placeholder:text-[rgba(15,23,42,0.35)] focus:ring-1 focus:ring-white/60"
                            />
                            <button
                                type="button"
                                onClick={() => removeSymptom(i)}
                                className="rounded p-1 text-[rgba(15,23,42,0.45)] hover:bg-rose-100/50 hover:text-rose-600"
                                aria-label="Remove symptom"
                            >
                                <Trash2 size={14} />
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="mt-4 text-sm font-semibold">Diagnosis</div>
                <input
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Enter diagnosis..."
                    className="mt-2 w-full rounded-lg bg-amber-100/70 px-4 py-2 text-sm text-[rgba(15,23,42,0.65)] outline-none placeholder:text-[rgba(15,23,42,0.45)] focus:ring-1 focus:ring-amber-200/70"
                />
            </div>

            <div className="rounded-[18px] bg-white/55 px-4 py-3 shadow-sm">
                <input
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
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
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Olivia Clark</div>
                    <span className="text-[rgba(15,23,42,0.45)]">▾</span>
                </div>
                <div className="mt-2 text-sm text-[rgba(15,23,42,0.55)]">January 17, 1998 (28 years old)</div>
                <div className="text-sm text-[rgba(15,23,42,0.55)]">Female</div>
                <div className="mt-2 text-sm text-[rgba(15,23,42,0.55)]">Patient ID: FI798</div>
                <div className="text-sm text-[rgba(15,23,42,0.55)]">Insurance: Techniker Krankenkasse</div>
            </div>

            <div className="rounded-[22px] bg-white/65 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Medical Alerts</div>
                    <span className="text-[rgba(15,23,42,0.45)]">▾</span>
                </div>
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-100/70 px-4 py-2 text-sm text-[rgba(15,23,42,0.65)]">
                    <span className="text-amber-600">⚠</span> Allergy: Penicillin
                </div>
            </div>

            <div className="rounded-[22px] bg-white/65 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Current Medication</div>
                    <span className="text-[rgba(15,23,42,0.45)]">▾</span>
                </div>
                <ul className="mt-2 list-disc pl-5 text-sm text-[rgba(15,23,42,0.55)]">
                    <li>Metformin 500mg 1x daily</li>
                    <li>Ibuprofen 200mg (As needed)</li>
                </ul>
            </div>

            <div className="rounded-[22px] bg-white/65 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Recent Activity</div>
                    <span className="text-[rgba(15,23,42,0.45)]">▾</span>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-[rgba(15,23,42,0.55)]">
                    <li className="flex items-center gap-2">
                        <span className="inline-block h-4 w-4 text-[rgba(15,23,42,0.45)]">📅</span>
                        12 Feb  – Dermatology consultation
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="inline-block h-4 w-4 text-[rgba(15,23,42,0.45)]">📅</span>
                        20 Jan – Prescribed Vitamin D
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="inline-block h-4 w-4 text-[rgba(15,23,42,0.45)]">📅</span>
                        18 Jan – Blood Test (Elevated cholesterol)
                    </li>
                </ul>
            </div>
        </div>
    );
}