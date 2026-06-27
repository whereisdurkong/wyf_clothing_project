import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const menuItems = [
    { label: 'Product Manager', path: '/admin/admin-all-product', index: '01' },
    { label: 'Category Images', path: '/admin-add-setup', index: '02' },
    { label: 'Collection Manager', path: '/admin/admin-collection', index: '03' },
    { label: 'Blog', path: '/admin/admin-blog', index: '04' },
    { label: 'Dashboard Image', path: '/admin/admin-dashboard', index: '05' },
];

export default function Admin() {
    const navigate = useNavigate();
    const [hovered, setHovered] = useState(null);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}>
            <div style={{ width: '100%', maxWidth: '480px' }}>

                {/* Header */}
                <div style={{ marginBottom: '56px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '14px',
                        marginBottom: '8px',
                    }}>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            color: '#bbb',
                        }}>Admin</span>
                        <span style={{ color: '#e0e0e0', fontSize: '11px' }}>·</span>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: '400',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: '#ccc',
                        }}>Control Panel</span>
                    </div>
                    <h1 style={{
                        fontSize: '42px',
                        fontWeight: '800',
                        color: '#0a0a0a',
                        letterSpacing: '-1.5px',
                        lineHeight: 1,
                        margin: 0,
                        textTransform: 'uppercase',
                    }}>Dashboard</h1>
                </div>

                {/* Menu */}
                <nav>
                    {menuItems.map((item) => {
                        const isHovered = hovered === item.index;
                        return (
                            <button
                                key={item.index}
                                onClick={() => navigate(item.path)}
                                onMouseEnter={() => setHovered(item.index)}
                                onMouseLeave={() => setHovered(null)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    background: isHovered ? '#0a0a0a' : 'transparent',
                                    border: 'none',
                                    borderBottom: '1px solid #e8e8e8',
                                    padding: '18px 20px 18px 0',
                                    paddingLeft: isHovered ? '20px' : '0',
                                    cursor: 'pointer',
                                    transition: 'all 0.18s ease',
                                    textAlign: 'left',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <span style={{
                                        fontFamily: "'SF Mono', 'Fira Code', monospace",
                                        fontSize: '10px',
                                        fontWeight: '500',
                                        color: isHovered ? 'rgba(255,255,255,0.35)' : '#ccc',
                                        letterSpacing: '0.05em',
                                        transition: 'color 0.18s ease',
                                        minWidth: '20px',
                                    }}>{item.index}</span>
                                    <span style={{
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: isHovered ? '#fff' : '#1a1a1a',
                                        letterSpacing: '-0.1px',
                                        transition: 'color 0.18s ease',
                                    }}>{item.label}</span>
                                </div>
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                    style={{
                                        opacity: isHovered ? 1 : 0,
                                        transform: isHovered ? 'translateX(0)' : 'translateX(-6px)',
                                        transition: 'all 0.18s ease',
                                    }}
                                >
                                    <path d="M1 7h12M8 2l5 5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div style={{
                    marginTop: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <span style={{
                        fontSize: '10px',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: '#d0d0d0',
                    }}>{menuItems.length} modules</span>
                    <div style={{
                        width: '32px',
                        height: '1px',
                        background: '#0a0a0a',
                    }} />
                </div>
            </div>
        </div>
    );
}