export type DoctorExpertiseOption = {
    value: string;
    label: string;
};

export const DOCTOR_EXPERTISE_OPTIONS: DoctorExpertiseOption[] = [
    { value: "general-practice", label: "General Practice" },
    { value: "family-medicine", label: "Family Medicine" },
    { value: "internal-medicine", label: "Internal Medicine" },
    { value: "pediatrics", label: "Pediatrics" },
    { value: "psychiatry", label: "Psychiatry" },
    { value: "dermatology", label: "Dermatology" },
    { value: "cardiology", label: "Cardiology" },
    { value: "endocrinology", label: "Endocrinology" },
    { value: "neurology", label: "Neurology" },
    { value: "orthopedics", label: "Orthopedics" },
];
