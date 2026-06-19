import { FiUser, FiShoppingBag } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const topsSubItems = [
    { label: 'Shirts', href: '/shop/tops/shirts' },
    { label: 'Hoodies & Jackets', href: '/shop/tops/hoodies-jackets' },
];

const shopItems = [
    { label: 'Tops', href: '/shop/tops', hasArrow: true, subItems: topsSubItems },
    { label: 'Bottoms', href: '/shop/bottoms' },
    { label: 'Footwear', href: '/shop/footwear' },
    { label: 'Accessories', href: '/shop/accessories' },
    { label: 'Size Guide', href: '/size-guide' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [navHovered, setNavHovered] = useState(false);
    const [shopOpen, setShopOpen] = useState(false);
    const { pathname } = useLocation();

    const transparentOnTop = pathname === '/' || pathname === '/dashboard';

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isTransparent = transparentOnTop && !scrolled && !navHovered;
    const textColor = isTransparent ? '#ffffff' : '#000000';
    const logoSrc = isTransparent ? '/11.png' : '/1.png';
    const bgColor = isTransparent ? 'transparent' : '#ffffff';

    const linkStyle = {
        textDecoration: 'none',
        color: textColor,
        fontWeight: '700',
        fontSize: '12px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        transition: 'color 0.3s ease',
        position: 'relative',
    };

    return (
        <nav
            onMouseEnter={() => setNavHovered(true)}
            onMouseLeave={() => setNavHovered(false)}
            style={{
                width: '100%',
                backgroundColor: bgColor,
                transition: 'all 0.3s ease',
                padding: '30px 60px',
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                position: 'fixed',
                top: 0,
                zIndex: 999,
            }}
        >
            {/* Left */}
            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                {/* Shop with Dropdown */}
                <div
                    onMouseEnter={() => setShopOpen(true)}
                    onMouseLeave={() => setShopOpen(false)}
                    style={{ position: 'relative' }}
                >
                    <a href="/shop" style={linkStyle}>Shop</a>

                    {/* Bridge gap */}
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '-24px',
                        width: '220px',
                        height: '24px',
                        background: 'transparent',
                        pointerEvents: 'all',
                    }} />

                    {/* Dropdown panel */}
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 20px)',
                        left: '-24px',
                        width: '220px',
                        background: '#ffffff',
                        // overflow: 'hidden',
                        pointerEvents: shopOpen ? 'all' : 'none',
                        maxHeight: shopOpen ? '320px' : '0px',
                        opacity: shopOpen ? 1 : 0,
                        transform: shopOpen ? 'translateY(0)' : 'translateY(-6px)',
                        transition: 'max-height 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease, transform 0.28s ease',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    }}>
                        {/* Animated black strip */}
                        <div style={{
                            height: '3px',
                            background: '#000000',
                            width: shopOpen ? '100%' : '0%',
                            transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1)',
                            transitionDelay: '0.05s',
                        }} />

                        {/* Items */}
                        <div style={{ padding: '14px 0 18px' }}>
                            {shopItems.map((item, i) => (
                                <DropdownItem
                                    key={item.href}
                                    item={item}
                                    index={i}
                                    visible={shopOpen}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <a href="/collections" style={linkStyle}>Collections</a>
                <a href="/about" style={linkStyle}>About Us</a>
            </div>

            {/* Center */}
            <a href="/" style={{ display: 'flex', justifyContent: 'center' }}>
                <img src={logoSrc} alt="Logo" style={{ height: '30px', width: 'auto', transition: 'opacity 0.3s ease' }} />
            </a>

            {/* Right */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', justifyContent: 'flex-end' }}>
                <a href="/auth/login" style={{ color: textColor, transition: 'color 0.3s ease', display: 'flex', alignItems: 'center' }}>
                    <FiUser size={18} />
                </a>
                <a href="/cart" style={{ color: textColor, transition: 'color 0.3s ease', display: 'flex', alignItems: 'center' }}>
                    <FiShoppingBag size={18} />
                </a>
            </div>
        </nav>
    );
}

function DropdownItem({ item, index, visible }) {
    const [hovered, setHovered] = useState(false);
    const [subOpen, setSubOpen] = useState(false);
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
        <div
            style={{ position: 'relative' }}
            onMouseEnter={() => { setHovered(true); if (hasSubItems) setSubOpen(true); }}
            onMouseLeave={() => { setHovered(false); if (hasSubItems) setSubOpen(false); }}
        >
            <a
                href={item.href}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: `11px ${hovered ? '30px' : '24px'}`,
                    textDecoration: 'none',
                    color: '#111111',
                    fontSize: '13px',
                    fontWeight: '500',
                    letterSpacing: '0.5px',
                    background: hovered ? '#f5f5f5' : 'transparent',
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateX(0)' : 'translateX(-8px)',
                    transition: `opacity 0.22s ease ${0.10 + index * 0.05}s, transform 0.22s ease ${0.10 + index * 0.05}s, background 0.15s ease, padding 0.2s ease`,
                }}
            >
                {item.label}
                {item.hasArrow && (
                    <span style={{
                        fontSize: '10px',
                        color: hovered ? '#333' : '#999',
                        transform: hovered ? 'translateX(3px)' : 'translateX(0)',
                        transition: 'transform 0.2s ease, color 0.2s ease',
                    }}>›</span>
                )}
            </a>

            {/* Flyout submenu */}
            {
                hasSubItems && (
                    <div style={{
                        position: 'absolute',
                        top: '-3px', // align with top strip
                        left: '100%',
                        width: '200px',
                        background: '#ffffff',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                        pointerEvents: subOpen ? 'all' : 'none',
                        opacity: subOpen ? 1 : 0,
                        transform: subOpen ? 'translateX(0)' : 'translateX(-8px)',
                        transition: 'opacity 0.22s ease, transform 0.22s ease',
                        overflow: 'hidden',
                    }}>
                        {/* Top black strip matching parent */}
                        <div style={{
                            height: '3px',
                            background: '#000000',
                            width: subOpen ? '100%' : '0%',
                            transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)',
                            transitionDelay: '0.05s',
                        }} />

                        <div style={{ padding: '14px 0 18px' }}>
                            {item.subItems.map((sub, si) => (
                                <SubItem key={sub.href} sub={sub} index={si} visible={subOpen} />
                            ))}
                        </div>
                    </div>
                )
            }
        </div >
    );
}

function SubItem({ sub, index, visible }) {
    const [hovered, setHovered] = useState(false);

    return (
        <a
            href={sub.href}
            onMouseEnter={() => setHovered(true)
            }
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'block',
                padding: `11px ${hovered ? '30px' : '24px'}`,
                textDecoration: 'none',
                color: '#111111',
                fontSize: '13px',
                fontWeight: '500',
                letterSpacing: '0.5px',
                background: hovered ? '#f5f5f5' : 'transparent',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0)' : 'translateX(-8px)',
                transition: `opacity 0.22s ease ${0.08 + index * 0.05}s, transform 0.22s ease ${0.08 + index * 0.05}s, background 0.15s ease, padding 0.2s ease`,
            }}
        >
            {sub.label}
        </a >
    );
}