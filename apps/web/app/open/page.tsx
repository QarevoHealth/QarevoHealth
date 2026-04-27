import "./open.css";

export default function EmailVerification() {
    return (
        <main className="verify-wrapper">
            <div className="verify-card">
                <section className="verify-left">
                    <h2>We emailed you a code</h2>
                    <p className="subtext">
                        We sent an email to <strong>email@domain.com</strong>. Enter the code or
                        tap the button in the email to continue.
                    </p>

                    <div className="code-inputs">
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <input key={idx} type="text" maxLength={1} className="code-box" />
                        ))}
                    </div>

                    <p className="hint">
                        If you don&apos;t see the email, check your spam or junk folder.
                    </p>

                    <div className="email-buttons">
                        <button className="btn gmail">Open Gmail</button>
                        <button className="btn outlook">Open Outlook</button>
                    </div>

                    <button className="resend">Resend code</button>
                </section>

                <section className="verify-right">
                    <div className="img-bg" />
                    <img
                        src="/doctor/hero-doctor-19a68b.png"
                        alt="Medical assistant illustration"
                        className="nurse-img"
                    />
                    <div className="info-box">
                        <h3>SIMPLE ONLINE APPOINTMENTS</h3>
                        <p>Book and connect with a doctor in just a few clicks.</p>
                    </div>
                </section>
            </div>
        </main>
    );
}
