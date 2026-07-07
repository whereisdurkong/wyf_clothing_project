import { useState } from 'react';
import axios from 'axios';
import config from '../../config';

export default function AdminRegister() {
    const [form, setForm] = useState({ name: '', email: '', role: 'user' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleRegister = async () => {
        setError('');
        setMessage('');

        if (!form.name || !form.email || !form.role) {
            return setError('Please fill in all fields');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            return setError('Please enter a valid email address');
        }

        setLoading(true);
        try {
            const res = await axios.post(`${config.baseApi}/users/register-admin`, form);
            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.msg || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

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
                    align-items: center;
                    justify-content: center;
                    font-family: 'Archivo', Arial, sans-serif;
                    color: #fff;
                    padding: 24px;
                }

                .wyf-form-inner {
                    width: 100%;
                    max-width: 380px;
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
                    background: #fff;
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
                    color: #999;
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
                    color: #fff;
                    margin-bottom: 8px;
                }

                .wyf-field input {
                    width: 100%;
                    padding: 14px 4px;
                    font-size: 15px;
                    font-family: 'Archivo', Arial, sans-serif;
                    border: none;
                    border-bottom: 2px solid #333;
                    background: transparent;
                    color: #fff;
                    outline: none;
                    transition: border-color 0.25s ease;
                }

                .wyf-field input::placeholder { color: #555; }
                .wyf-field input:focus { border-bottom-color: #fff; }
                .wyf-field input:disabled { opacity: 0.5; cursor: not-allowed; }
                .wyf-field input.wyf-error-input { border-bottom-color: #e35b5b; }

                .wyf-select-wrap {
                    position: relative;
                }

                .wyf-select-wrap::after {
                    content: '▾';
                    position: absolute;
                    right: 6px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #777;
                    font-size: 13px;
                    pointer-events: none;
                }

                .wyf-field select {
                    width: 100%;
                    padding: 14px 24px 14px 4px;
                    font-size: 15px;
                    font-family: 'Archivo', Arial, sans-serif;
                    border: none;
                    border-bottom: 2px solid #333;
                    background: transparent;
                    color: #fff;
                    outline: none;
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    cursor: pointer;
                    transition: border-color 0.25s ease;
                }

                .wyf-field select:focus { border-bottom-color: #fff; }
                .wyf-field select:disabled { opacity: 0.5; cursor: not-allowed; }

                .wyf-field select option {
                    background: #0a0a0a;
                    color: #fff;
                }

                .wyf-submit {
                    width: 100%;
                    padding: 15px;
                    margin-top: 8px;
                    background: #fff;
                    color: #0a0a0a;
                    border: none;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: opacity 0.2s ease, transform 0.15s ease;
                }

                .wyf-submit:hover { opacity: 0.85; }
                .wyf-submit:active { transform: scale(0.98); }
                .wyf-submit:disabled { opacity: 0.5; cursor: not-allowed; }

                .wyf-message {
                    margin-top: 16px;
                    padding: 12px 14px;
                    border-radius: 2px;
                    font-size: 13.5px;
                }

                .wyf-message.wyf-error {
                    background: rgba(227, 91, 91, 0.1);
                    border-left: 3px solid #e35b5b;
                    color: #e88a8a;
                }

                .wyf-message.wyf-success {
                    background: rgba(255, 255, 255, 0.06);
                    border-left: 3px solid #fff;
                    color: #ddd;
                }

                .wyf-footer-link {
                    margin-top: 28px;
                    font-size: 13.5px;
                    color: #999;
                    text-align: center;
                }

                .wyf-footer-link a {
                    color: #fff;
                    font-weight: 700;
                    text-decoration: none;
                    border-bottom: 1px solid #fff;
                    padding-bottom: 1px;
                }

                .wyf-footer-link a:hover { color: #ccc; border-color: #ccc; }

                .wyf-spinner {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(10,10,10,0.3);
                    border-top: 2px solid #0a0a0a;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin-right: 8px;
                    vertical-align: middle;
                }

                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div className="wyf-form-inner">
                <div className="wyf-brand-mark">
                    <span className="wyf-mark">WYF?</span>
                    <span className="wyf-mark-dot" />
                </div>
                <h2>Create account</h2>
                <p className="wyf-intro">
                    {message
                        ? "You're all set. You can now sign in."
                        : "Join up to shop the drop and track your orders."}
                </p>

                <div className="wyf-field">
                    <label htmlFor="wyf-name">Name</label>
                    <input
                        id="wyf-name"
                        name="name"
                        placeholder="Full name"
                        value={form.name}
                        onChange={handleChange}
                        onKeyDown={e => e.key === 'Enter' && handleRegister()}
                        autoComplete="name"
                        disabled={loading}
                        className={error && error.toLowerCase().includes('field') ? 'wyf-error-input' : ''}
                    />
                </div>

                <div className="wyf-field">
                    <label htmlFor="wyf-email">Email</label>
                    <input
                        id="wyf-email"
                        name="email"
                        type="email"
                        placeholder="you@email.com"
                        value={form.email}
                        onChange={handleChange}
                        onKeyDown={e => e.key === 'Enter' && handleRegister()}
                        autoComplete="email"
                        disabled={loading}
                        className={error && error.toLowerCase().includes('email') ? 'wyf-error-input' : ''}
                    />
                </div>

                <div className="wyf-field">
                    <label htmlFor="wyf-role">Role</label>
                    <div className="wyf-select-wrap">
                        <select
                            id="wyf-role"
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            disabled={loading}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>

                <button
                    className="wyf-submit"
                    onClick={handleRegister}
                    disabled={loading}
                >
                    {loading
                        ? <><span className="wyf-spinner" />Creating account…</>
                        : 'Create account'}
                </button>

                {message && <div className="wyf-message wyf-success">{message}</div>}
                {error && <div className="wyf-message wyf-error">{error}</div>}

                <p className="wyf-footer-link">
                    Already have an account? <a href="/auth/login">Sign in</a>
                </p>
            </div>
        </div>
    );
}