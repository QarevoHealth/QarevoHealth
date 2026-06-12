export type PasswordRule = {
    id: string;
    label: string;
    test: (value: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
    {
        id: "length",
        label: "At least 8 characters",
        test: (value) => value.length >= 8,
    },
    {
        id: "uppercase",
        label: "At least one uppercase letter",
        test: (value) => /[A-Z]/.test(value),
    },
    {
        id: "lowercase",
        label: "At least one lowercase letter",
        test: (value) => /[a-z]/.test(value),
    },
    {
        id: "digit",
        label: "At least one number",
        test: (value) => /\d/.test(value),
    },
    {
        id: "special",
        label: "At least one special character",
        test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
    },
];

export function passwordMeetsPolicy(value: string): boolean {
    return PASSWORD_RULES.every((rule) => rule.test(value));
}
