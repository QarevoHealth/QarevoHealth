export type MockProvider = {
    id: string;
    name: string;
    specialty: string;
    avatarUrl?: string;
};

export type MockConsultation = {
    id: string;
    patientName: string;
    status: "scheduled" | "waiting" | "live" | "ended";
};

export const mockConsultation: MockConsultation = {
    id: "123",
    patientName: "Olivia Clark",
    status: "live",
};

export const mockProvidersTwo: MockProvider[] = [
    { id: "p1", name: "Dr. A. Wesley", specialty: "Dermatologist" },
    { id: "p2", name: "Dr. J. Smith", specialty: "General Practitioner" },
];

export const mockProvidersOne: MockProvider[] = [
    { id: "p1", name: "Dr. A. Wesley", specialty: "Dermatologist" },
];