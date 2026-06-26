import { useState } from "react";

const FacebookIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
);

const InstagramIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
);

const TikTokIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.83 1.54V6.78a4.85 4.85 0 0 1-1.06-.09z" />
    </svg>
);

const css = `
    .footer-root {
        background-color: #1a1a1a;
        color: #d4d4d4;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 13px;
        padding: 60px 40px 30px;
    }
    .footer-inner {
        max-width: 1400px;
        margin: 0 auto;
    }
    .footer-grid {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1.5fr 1fr;
        gap: 40px;
        margin-bottom: 48px;
        align-items: start;
    }
    .footer-logo {
        display: flex;
        justify-content: flex-end;
        align-items: flex-start;
    }
    .footer-social {
        display: flex;
        gap: 18px;
        margin-bottom: 32px;
        color: #aaaaaa;
    }
    .footer-social a {
        color: #aaaaaa;
        display: flex;
        align-items: center;
        transition: color 0.2s;
    }
    .footer-social a:hover { color: #ffffff; }
    .footer-divider {
        border-top: 1px solid #2e2e2e;
        padding-top: 20px;
    }
    .footer-link {
        color: #aaaaaa;
        text-decoration: none;
        font-size: 13px;
        transition: color 0.2s;
    }
    .footer-link:hover { color: #ffffff; }

    @media (max-width: 768px) {
        .footer-root {
            padding: 40px 24px 24px;
        }
        .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
        }
        /* Newsletter spans full width */
        .footer-newsletter {
            grid-column: 1 / -1;
        }
        /* Logo moves to bottom-right of its natural cell */
        .footer-logo {
            justify-content: flex-start;
            align-items: flex-start;
        }
    }

    @media (max-width: 480px) {
        .footer-grid {
            grid-template-columns: 1fr;
        }
        .footer-logo {
            justify-content: flex-start;
        }
    }
`;

export default function Footer() {
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = () => {
        if (email.trim()) {
            setSubscribed(true);
            setEmail("");
        }
    };

    return (
        <>
            <style>{css}</style>
            <footer className="footer-root">
                <div className="footer-inner">

                    {/* ── MAIN GRID ── */}
                    <div className="footer-grid">

                        {/* Newsletter — full width on mobile */}
                        <div className="footer-newsletter">
                            <p style={{ color: "#ffffff", fontWeight: "700", marginBottom: "12px", letterSpacing: "0.01em" }}>
                                Newsletter
                            </p>
                            <p style={{ color: "#aaaaaa", lineHeight: "1.6", marginBottom: "20px" }}>
                                Access Exclusive Offers and Early Product Releases Today.
                            </p>
                            <input
                                type="email"
                                placeholder="E-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    maxWidth: "220px",
                                    padding: "10px 12px",
                                    backgroundColor: "transparent",
                                    border: "1px solid #444",
                                    color: "#d4d4d4",
                                    fontSize: "13px",
                                    marginBottom: "12px",
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                            />
                            {subscribed ? (
                                <p style={{ color: "#aaaaaa", fontSize: "12px" }}>Thanks for subscribing!</p>
                            ) : (
                                <button
                                    onClick={handleSubscribe}
                                    style={{
                                        padding: "10px 20px",
                                        backgroundColor: "#ffffff",
                                        color: "#1a1a1a",
                                        border: "none",
                                        fontSize: "13px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        letterSpacing: "0.02em",
                                    }}
                                >
                                    Subscribe
                                </button>
                            )}
                        </div>

                        {/* Company */}
                        <div>
                            <p style={{ color: "#ffffff", fontWeight: "700", marginBottom: "16px", letterSpacing: "0.01em" }}>
                                Company
                            </p>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {["Blogs"].map((item) => (
                                    <li key={item} style={{ marginBottom: "10px" }}>
                                        <a href="#" className="footer-link">{item}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Customer Service */}
                        <div>
                            <p style={{ color: "#ffffff", fontWeight: "700", marginBottom: "16px", letterSpacing: "0.01em" }}>
                                Customer Service
                            </p>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {["FAQs", "Contact Us"].map((item) => (
                                    <li key={item} style={{ marginBottom: "10px" }}>
                                        <a href="#" className="footer-link">{item}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Terms and Policy */}
                        <div>
                            <p style={{ color: "#ffffff", fontWeight: "700", marginBottom: "16px", letterSpacing: "0.01em" }}>
                                Terms and Policy
                            </p>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {["Privacy Policy", "Return & Exchange Policy", "Terms of Service"].map((item) => (
                                    <li key={item} style={{ marginBottom: "10px" }}>
                                        <a href="#" className="footer-link">{item}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Logo */}
                        <div className="footer-logo">
                            <span style={{
                                color: "#ffffff",
                                fontSize: "28px",
                                fontWeight: "800",
                                letterSpacing: "-0.02em",
                            }}>
                                WYF?<sup style={{ fontSize: "12px", fontWeight: "400", verticalAlign: "super" }}>®</sup>
                            </span>
                        </div>
                    </div>

                    {/* ── SOCIAL ICONS ── */}
                    <div className="footer-social">
                        {[
                            { icon: <FacebookIcon />, label: "Facebook" },
                            { icon: <InstagramIcon />, label: "Instagram" },
                            { icon: <TikTokIcon />, label: "TikTok" },
                        ].map(({ icon, label }) => (
                            <a key={label} href="#" aria-label={label}>{icon}</a>
                        ))}
                    </div>

                    {/* ── DIVIDER + COPYRIGHT ── */}
                    <div className="footer-divider">
                        <p style={{ color: "#666666", fontSize: "12px", margin: 0 }}>
                            © 2026 – WhereYouFrom? by AdrianVentura
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}