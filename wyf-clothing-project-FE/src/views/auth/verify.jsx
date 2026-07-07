import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../config';

export default function Verify() {
    const [status, setStatus] = useState('verifying');
    const navigate = useNavigate();

    useEffect(() => {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');

        if (!accessToken) {
            setStatus('error');
            return;
        }

        localStorage.setItem('access_token', accessToken);

        axios.post(`${config.baseApi}/users/save-user`, {}, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
            .then(res => {
                localStorage.setItem('user', JSON.stringify(res.data)); // .user, not .data directly
                setStatus('success');
                setTimeout(() => navigate('/'), 1500);
            })
            .catch(() => setStatus('error'));
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            color: '#fff',
            fontFamily: 'Archivo, sans-serif',
            flexDirection: 'column',
            gap: 16,
            fontSize: 16
        }}>
            {status === 'verifying' && (
                <>
                    <div style={{
                        width: 32, height: 32,
                        border: '3px solid rgba(255,255,255,0.2)',
                        borderTop: '3px solid #fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p style={{ margin: 0, color: '#888' }}>Verifying your link…</p>
                </>
            )}
            {status === 'success' && (
                <>
                    <div style={{ fontSize: 40 }}>✓</div>
                    <p style={{ margin: 0 }}>Signed in! Redirecting…</p>
                </>
            )}
            {status === 'error' && (
                <>
                    <div style={{ fontSize: 40 }}>✗</div>
                    <p style={{ margin: 0, color: '#888' }}>Link is invalid or expired.</p>
                    <a href="/auth/login" style={{
                        color: '#fff',
                        borderBottom: '1px solid #fff',
                        textDecoration: 'none',
                        fontSize: 14
                    }}>Back to login</a>
                </>
            )}
        </div>
    );
}