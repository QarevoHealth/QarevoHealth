export function GoogleIcon({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
            <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />
            <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
            />
            <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />
            <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.094 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
        </svg>
    );
}

export function AppleIcon({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="currentColor">
            <path d="M16.365 1.43c0 1.14-.46 2.23-1.27 3.02-.79.8-2.08 1.42-3.28 1.33-.14-1.1.42-2.26 1.2-3.03.88-.85 2.32-1.46 3.35-1.32zM20.8 17.06c-.62 1.44-.92 2.08-1.72 3.35-1.11 1.78-2.68 4-4.62 4-1.73.02-2.17-1.13-4.52-1.12-2.35.01-2.83 1.14-4.56 1.12-1.94-.02-3.42-2.03-4.53-3.81C-1.5 16.34-1.8 10.53 1.23 7.47c1.24-1.26 2.89-2 4.44-2 1.62 0 2.64 1.1 4.48 1.1 1.79 0 2.87-1.1 4.85-1.1 1.37 0 2.82.75 3.86 2.04-3.4 1.86-2.85 6.72.97 7.55-.34 1.08-.46 1.44-1.03 2z" />
        </svg>
    );
}

export function MicrosoftIcon({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 23 23" aria-hidden>
            <path fill="#f25022" d="M1 1h10v10H1z" />
            <path fill="#7fba00" d="M12 1h10v10H12z" />
            <path fill="#00a4ef" d="M1 12h10v10H1z" />
            <path fill="#ffb900" d="M12 12h10v10H12z" />
        </svg>
    );
}

export function GmailMailIcon({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
            <rect x="1.5" y="3.5" width="17" height="13" rx="2.5" fill="#fff" />
            <path d="M2.7 5.2L10 10.5l7.3-5.3" fill="none" stroke="#EA4335" strokeWidth="2" />
            <path d="M2.6 15.8V5.4L6.9 8.6v7.2H2.6z" fill="#34A853" />
            <path d="M17.4 15.8V5.4l-4.3 3.2v7.2h4.3z" fill="#4285F4" />
            <path d="M6.9 15.8V8.6l3.1 2.2 3.1-2.2v7.2H6.9z" fill="#FBBC05" />
        </svg>
    );
}

export function OutlookMailIcon({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
            <rect x="7.5" y="4" width="10" height="12" rx="1.6" fill="#0078D4" />
            <path d="M8.5 6.2l4 2.9 4-2.9" fill="none" stroke="#B9DCFF" strokeWidth="1.2" />
            <rect x="2.5" y="6" width="7.8" height="8" rx="1.3" fill="#106EBE" />
            <path
                d="M6.4 8.3c1.2 0 2.2.9 2.2 2.1S7.6 12.5 6.4 12.5s-2.2-.9-2.2-2.1.9-2.1 2.2-2.1zm0 1.1c-.6 0-1 .4-1 1s.5 1 1 1c.6 0 1-.4 1-1s-.4-1-1-1z"
                fill="#fff"
            />
        </svg>
    );
}
