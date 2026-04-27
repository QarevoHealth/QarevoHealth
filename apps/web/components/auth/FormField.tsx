"use client";

type FormFieldProps = {
    id: string;
    label: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
    autoComplete?: string;
};

export function FormField({
    id,
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    required,
    error,
    autoComplete,
}: FormFieldProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label
                htmlFor={id}
                className="text-xs font-semibold text-primary"
            >
                {label}
                {required && <span className="text-red-500"> *</span>}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoComplete={autoComplete}
                aria-invalid={!!error}
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-slate-400 focus:ring-2 ${
                    error
                        ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                        : "border-slate-200 focus:border-secondary focus:ring-secondary/25"
                }`}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
