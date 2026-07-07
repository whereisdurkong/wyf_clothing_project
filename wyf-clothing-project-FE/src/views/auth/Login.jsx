import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../config';

export default function Login() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [checking, setChecking] = useState(true);
    const [pollStatus, setPollStatus] = useState(''); // 'waiting' | 'success'
    const pollRef = useRef(null);
    const navigate = useNavigate();

    // Check if user is already logged in on mount
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setChecking(false);
            return;
        }

        axios.get(`${config.baseApi}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(() => {
                window.dispatchEvent(new Event('auth-changed'));
                navigate('/');
            })
            .catch(() => {
                localStorage.removeItem('access_token');
                setChecking(false);
            });
    }, []);

    // Start polling once magic link is sent
    useEffect(() => {
        if (!sent) return;

        setPollStatus('waiting');

        pollRef.current = setInterval(() => {
            const token = localStorage.getItem('access_token');

            if (token) {
                // Token appeared — user clicked the magic link in another tab
                clearInterval(pollRef.current);
                setPollStatus('success');
                window.dispatchEvent(new Event('auth-changed'));
                setTimeout(() => navigate('/'), 1000);
                return;
            }

            // Also check with backend in case token was set elsewhere
            axios.get(`${config.baseApi}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(() => {
                    clearInterval(pollRef.current);
                    setPollStatus('success');
                    window.dispatchEvent(new Event('auth-changed'));
                    setTimeout(() => navigate('/'), 1000);
                })
                .catch(() => {
                    // Not logged in yet, keep polling
                });
        }, 2000);

        // Stop polling after 10 minutes (magic links expire)
        const timeout = setTimeout(() => {
            clearInterval(pollRef.current);
            setPollStatus('');
        }, 10 * 60 * 1000);

        return () => {
            clearInterval(pollRef.current);
            clearTimeout(timeout);
        };
    }, [sent]);

    const handleLogin = async () => {
        setError('');
        setMessage('');

        if (!email) return setError('Please enter your email');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return setError('Please enter a valid email address');

        setLoading(true);
        try {
            await axios.post(`${config.baseApi}/users/login`, { email });
            setSent(true);
            setMessage('Magic link sent! Check your inbox.');
        } catch (err) {
            setError(err.response?.data?.msg || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#0a0a0a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    width: 32, height: 32,
                    border: '3px solid rgba(255,255,255,0.2)',
                    borderTop: '3px solid #fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="wyf-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600;700&display=swap');

                * { box-sizing: border-box; }

                .wyf-page {
                    min-height: 100vh;
                    width: 100%;
                    background: #0a0a0a;
                    display: flex;
                    font-family: 'Archivo', Arial, sans-serif;
                    color: #fff;
                    overflow: hidden;
                }

                .wyf-stamp-panel {
                    position: relative;
                    flex: 1.1;
                    background: #0a0a0a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    border-right: 1px solid #232323;
                }

                .wyf-grid-bg {
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(#1a1a1a 1px, transparent 1px),
                        linear-gradient(90deg, #1a1a1a 1px, transparent 1px);
                    background-size: 48px 48px;
                    opacity: 0.5;
                    mask-image: radial-gradient(circle at center, black 10%, transparent 75%);
                }

                .wyf-stamp-wrap {
                    position: relative;
                    width: 320px;
                    height: 320px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: stampDown 0.7s cubic-bezier(.2,1.4,.4,1) both;
                    animation-delay: 0.15s;
                }

                @keyframes stampDown {
                    0%   { transform: scale(2.4) rotate(-14deg); opacity: 0; }
                    60%  { transform: scale(0.94) rotate(-8deg); opacity: 1; }
                    80%  { transform: scale(1.04) rotate(-9deg); }
                    100% { transform: scale(1) rotate(-9deg); opacity: 1; }
                }

                .wyf-stamp-ring {
                    position: absolute;
                    inset: 0;
                    border: 3px solid #fff;
                    border-radius: 50%;
                }

                .wyf-stamp-ring::before {
                    content: '';
                    position: absolute;
                    inset: 14px;
                    border: 1px solid #fff;
                    border-radius: 50%;
                    opacity: 0.5;
                }

                .wyf-orbit-text {
                    position: absolute;
                    inset: 0;
                    animation: spin 40s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }

                .wyf-orbit-text svg { width: 100%; height: 100%; }
                .wyf-orbit-text text {
                    fill: #fff;
                    font-size: 11px;
                    letter-spacing: 4px;
                    font-weight: 700;
                    text-transform: uppercase;
                    opacity: 0.75;
                }

                .wyf-stamp-core {
                    position: relative;
                    text-align: center;
                    line-height: 0.85;
                }

                .wyf-stamp-core .wyf-q {
                    font-family: 'Archivo Black', Arial, sans-serif;
                    font-size: 86px;
                    letter-spacing: -2px;
                    display: block;
                }

                .wyf-stamp-core .wyf-sub {
                    display: block;
                    margin-top: 14px;
                    font-size: 10px;
                    letter-spacing: 3px;
                    font-weight: 600;
                    color: #888;
                    text-transform: uppercase;
                }

                .wyf-tagline {
                    position: absolute;
                    bottom: 56px;
                    left: 56px;
                    right: 56px;
                }

                .wyf-tagline .wyf-eyebrow {
                    font-size: 11px;
                    letter-spacing: 3px;
                    color: #666;
                    text-transform: uppercase;
                    font-weight: 700;
                    margin-bottom: 10px;
                    display: block;
                }

                .wyf-tagline h1 {
                    font-family: 'Archivo Black', Arial, sans-serif;
                    font-size: 28px;
                    line-height: 1.15;
                    margin: 0;
                    letter-spacing: -0.5px;
                }

                .wyf-form-panel {
                    flex: 1;
                    background: #fff;
                    color: #0a0a0a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    position: relative;
                }

                .wyf-form-inner {
                    width: 100%;
                    max-width: 360px;
                    animation: riseIn 0.6s ease both;
                    animation-delay: 0.35s;
                    opacity: 0;
                }

                @keyframes riseIn {
                    from { transform: translateY(16px); opacity: 0; }
                    to   { transform: translateY(0); opacity: 1; }
                }

                .wyf-brand-mark {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    margin-bottom: 4px;
                }

                .wyf-brand-mark .wyf-mark {
                    font-family: 'Archivo Black', Arial, sans-serif;
                    font-size: 22px;
                    letter-spacing: -0.5px;
                }

                .wyf-brand-mark .wyf-mark-dot {
                    width: 7px;
                    height: 7px;
                    background: #0a0a0a;
                    border-radius: 50%;
                    transform: translateY(-2px);
                }

                .wyf-form-inner h2 {
                    font-family: 'Archivo Black', Arial, sans-serif;
                    font-size: 32px;
                    margin: 18px 0 6px;
                    letter-spacing: -0.5px;
                }

                .wyf-form-inner .wyf-intro {
                    color: #6b6b6b;
                    font-size: 14.5px;
                    margin: 0 0 32px;
                    line-height: 1.5;
                }

                .wyf-field { margin-bottom: 18px; }

                .wyf-field label {
                    display: block;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    color: #0a0a0a;
                    margin-bottom: 8px;
                }

                .wyf-field input {
                    width: 100%;
                    padding: 14px 4px;
                    font-size: 15px;
                    font-family: 'Archivo', Arial, sans-serif;
                    border: none;
                    border-bottom: 2px solid #d8d8d8;
                    background: transparent;
                    color: #0a0a0a;
                    outline: none;
                    transition: border-color 0.25s ease;
                }

                .wyf-field input::placeholder { color: #b3b3b3; }
                .wyf-field input:focus { border-bottom-color: #0a0a0a; }
                .wyf-field input:disabled { opacity: 0.5; cursor: not-allowed; }
                .wyf-field input.wyf-error-input { border-bottom-color: #c92a2a; }

                .wyf-submit {
                    width: 100%;
                    padding: 15px;
                    margin-top: 8px;
                    background: #0a0a0a;
                    color: #fff;
                    border: none;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.15s ease, box-shadow 0.25s ease;
                }

                .wyf-submit::after {
                    content: '';
                    position: absolute;
                    top: 0; left: -100%;
                    width: 100%; height: 100%;
                    background: rgba(255,255,255,0.12);
                    transform: skewX(-20deg);
                    transition: left 0.45s ease;
                }

                .wyf-submit:hover::after { left: 100%; }
                .wyf-submit:hover { box-shadow: 0 6px 18px rgba(0,0,0,0.25); }
                .wyf-submit:active { transform: scale(0.98); }
                .wyf-submit:disabled { opacity: 0.6; cursor: not-allowed; }
                .wyf-submit.wyf-sent { background: #2a8c4a; cursor: default; }
                .wyf-submit.wyf-detected { background: #1a6e39; cursor: default; }

                .wyf-message {
                    margin-top: 16px;
                    padding: 12px 14px;
                    border-radius: 2px;
                    font-size: 13.5px;
                    animation: slideDown 0.3s ease;
                }

                @keyframes slideDown {
                    from { transform: translateY(-8px); opacity: 0; }
                    to   { transform: translateY(0); opacity: 1; }
                }

                .wyf-message.wyf-success {
                    background: #eaf6ec;
                    border-left: 3px solid #2a8c4a;
                    color: #1f6b37;
                }

                .wyf-message.wyf-error {
                    background: #fdeaea;
                    border-left: 3px solid #c92a2a;
                    color: #8c1f1f;
                }

                .wyf-poll-status {
                    margin-top: 16px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 13px;
                    color: #6b6b6b;
                }

                .wyf-poll-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #2a8c4a;
                    animation: pulse 1.5s ease-in-out infinite;
                    flex-shrink: 0;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(0.75); }
                }

                .wyf-resend {
                    margin-top: 12px;
                    text-align: center;
                    font-size: 13px;
                    color: #6b6b6b;
                }

                .wyf-resend button {
                    background: none;
                    border: none;
                    color: #0a0a0a;
                    font-weight: 700;
                    cursor: pointer;
                    border-bottom: 1px solid #0a0a0a;
                    padding-bottom: 1px;
                    font-size: 13px;
                    font-family: 'Archivo', Arial, sans-serif;
                }

                .wyf-resend button:hover { color: #444; border-color: #444; }

                .wyf-spinner {
                    display: inline-block;
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top: 2px solid #fff;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin-right: 8px;
                    vertical-align: middle;
                }

                .wyf-footer-link {
                    margin-top: 28px;
                    font-size: 13.5px;
                    color: #6b6b6b;
                    text-align: center;
                }

                .wyf-footer-link a {
                    color: #0a0a0a;
                    font-weight: 700;
                    text-decoration: none;
                    border-bottom: 1px solid #0a0a0a;
                    padding-bottom: 1px;
                }

                .wyf-footer-link a:hover { color: #444; border-color: #444; }

                @media (max-width: 860px) {
                    .wyf-page { flex-direction: column; }
                    .wyf-stamp-panel {
                        flex: none;
                        height: 38vh;
                        border-right: none;
                        border-bottom: 1px solid #232323;
                    }
                    .wyf-stamp-wrap { width: 200px; height: 200px; }
                    .wyf-stamp-core .wyf-q { font-size: 52px; }
                    .wyf-tagline { display: none; }
                    .wyf-form-panel { flex: none; padding: 32px 24px; }
                }

                @media (prefers-reduced-motion: reduce) {
                    .wyf-stamp-wrap, .wyf-form-inner, .wyf-orbit-text {
                        animation: none !important;
                        opacity: 1 !important;
                    }
                }
            `}</style>

            {/* LEFT: STAMP PANEL */}
            <div className="wyf-stamp-panel">
                <div className="wyf-grid-bg" />
                <div className="wyf-stamp-wrap">
                    <div className="wyf-stamp-ring" />
                    <div className="wyf-orbit-text" aria-hidden="true">
                        <svg viewBox="0 0 320 320">
                            <defs>
                                <path id="wyfCircle" d="M160,160 m-128,0 a128,128 0 1,1 256,0 a128,128 0 1,1 -256,0" />
                            </defs>
                            <text>
                                <textPath href="#wyfCircle">
                                    EST. ON THE BLOCK · REP YOUR CITY · EST. ON THE BLOCK · REP YOUR CITY ·
                                </textPath>
                            </text>
                        </svg>
                    </div>
                    <div className="wyf-stamp-core">
                        <span className="wyf-q">WYF?</span>
                        <span className="wyf-sub">Where You From</span>
                    </div>
                </div>
                <div className="wyf-tagline">
                    <span className="wyf-eyebrow">No address, no access</span>
                    <h1>Sign in to claim your block.</h1>
                </div>
            </div>

            {/* RIGHT: FORM PANEL */}
            <div className="wyf-form-panel">
                <div className="wyf-form-inner">
                    <div className="wyf-brand-mark">
                        <span className="wyf-mark">WYF?</span>
                        <span className="wyf-mark-dot" />
                    </div>
                    <h2>Welcome back.</h2>
                    <p className="wyf-intro">
                        {pollStatus === 'success'
                            ? 'Logged in! Taking you home…'
                            : sent
                                ? "We've sent a magic link to your inbox. Click it to sign in."
                                : "Enter your email and we'll send you a magic link to sign in."}
                    </p>

                    <div className="wyf-field">
                        <label htmlFor="wyf-email">Email</label>
                        <input
                            id="wyf-email"
                            name="email"
                            type="email"
                            placeholder="you@email.com"
                            value={email}
                            onChange={e => { setEmail(e.target.value); setError(''); }}
                            onKeyDown={e => e.key === 'Enter' && !sent && handleLogin()}
                            autoComplete="email"
                            disabled={loading || sent}
                            className={error ? 'wyf-error-input' : ''}
                        />
                    </div>

                    <button
                        className={`wyf-submit${pollStatus === 'success' ? ' wyf-detected' : sent ? ' wyf-sent' : ''}`}
                        onClick={handleLogin}
                        disabled={loading || sent}
                    >
                        {loading
                            ? <><span className="wyf-spinner" />Sending…</>
                            : pollStatus === 'success'
                                ? '✓ Logged in! Redirecting…'
                                : sent
                                    ? '✓ Check your inbox'
                                    : 'Send magic link'}
                    </button>

                    {/* Polling indicator */}
                    {sent && pollStatus === 'waiting' && (
                        <div className="wyf-poll-status">
                            <span className="wyf-poll-dot" />
                            Waiting for you to click the link…
                        </div>
                    )}

                    {/* Resend option */}
                    {sent && pollStatus === 'waiting' && (
                        <div className="wyf-resend">
                            Didn't get it?{' '}
                            <button onClick={() => {
                                clearInterval(pollRef.current);
                                setSent(false);
                                setPollStatus('');
                                setMessage('');
                                setError('');
                            }}>
                                Resend
                            </button>
                        </div>
                    )}

                    {message && <div className="wyf-message wyf-success">{message}</div>}
                    {error && <div className="wyf-message wyf-error">{error}</div>}

                    <p className="wyf-footer-link">
                        New to WYF? <a href="/auth/register">Create an account</a>
                    </p>
                </div>
            </div>
        </div>
    );
}