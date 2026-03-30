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

export type MockDoctorDetails = {
    name: string;
    title: string;
    avatarUrl: string;
    specialties: string;
    experience: string;
    languages: string;
    affiliation: string;
    education: Array<{ period: string; degree: string; institution: string }>;
    licensedIn: string;
};

export const mockDoctorJonasSmith: MockDoctorDetails = {
    name: "Dr. Jonas Smith",
    title: "General Practitioner",
    avatarUrl: "/mock/doctor2.png",
    specialties: "Primary care, Family medicine.",
    experience: "15+ years",
    languages: "English, Spanish, German",
    affiliation: "City Health Clinic, Mainz",
    education: [
        {
            period: "2012 - 2018",
            degree: "Doctor of Medicine (MD)",
            institution: "University of Heidelberg, Germany",
        },
        {
            period: "2018 - 2023",
            degree: "Residency in General Practice / Family Medicine",
            institution: "Charité University Hospital, Berlin, Germany",
        },
    ],
    licensedIn: "Licensed in Germany",
};