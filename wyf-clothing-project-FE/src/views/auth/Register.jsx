import { useState } from 'react';
import axios from 'axios';
import config from '../../config';

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRegister = async () => {
        try {
            const res = await axios.post(`${config.baseApi}/users/register`, form);
            setMessage(res.data.message);
        } catch (err) {
            setMessage(err.response?.data?.msg || 'Something went wrong');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto', fontFamily: 'Arial' }}>
            <h2>Register</h2>
            <input
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
            />
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
                onClick={handleRegister}
                style={{ width: '100%', padding: '10px', backgroundColor: '#1a73e8', color: 'white', border: 'none', cursor: 'pointer' }}
            >
                Register
            </button>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            <p><a href="/auth/login">Already have an account? Login</a></p>
        </div>
    );
}