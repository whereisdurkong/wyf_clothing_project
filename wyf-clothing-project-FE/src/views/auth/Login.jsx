import { useState } from 'react';
import axios from 'axios';
import config from '../../config';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleLogin = async () => {
        try {
            const res = await axios.post(`${config.baseApi}/users/login`, form);
            localStorage.setItem('user', JSON.stringify(res.data));
            window.location.replace('/dashboard');
        } catch (err) {
            setMessage(err.response?.data?.msg || 'Something went wrong');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto', fontFamily: 'Arial' }}>
            <h2>Login</h2>
            <input
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
            />
            <input
                name="password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
            />
            <button
                onClick={handleLogin}
                style={{ width: '100%', padding: '10px', backgroundColor: '#1a73e8', color: 'white', border: 'none', cursor: 'pointer' }}
            >
                Login
            </button>
            {message && <p style={{ color: 'red' }}>{message}</p>}
            <p><a href="/auth/register">Don't have an account? Register</a></p>
        </div>
    );
}