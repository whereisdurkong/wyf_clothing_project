
import { FiUser, FiShoppingBag, FiMenu, FiX } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from "axios";
import config from '../config';

const topsSubItems = [
    { label: 'Shirts', href: '/all-product?category=tshirt' },
    { label: 'Hoodies & Jackets', href: '/all-product?category=hoodies_jackets' },
];

const shopItems = [
    { label: 'Tops', href: '/all-product?category=tops', hasArrow: true, subItems: topsSubItems },
    { label: 'Bottoms', href: '/all-product?category=bottoms' },
    { label: 'Footwear', href: '/all-product?category=footwear' },
    { label: 'Accessories', href: '/all-product/category=accessories' },
    { label: 'Size Guide', href: '/size-guide' },
];

function ViewMoreItem({ visible, index, isMobile = false, onClick }) {
    const [hovered, setHovered] = useState(false);

    const styles = isMobile ? {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '14px 20px',
        textDecoration: 'none',
        color: '#111111',
        fontSize: '14px',
        fontWeight: '600',
        background: '#f5f5f5',
        borderTop: '1px solid #eee',
        justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-8px)',
        transition: `opacity 0.22s ease ${0.10 + index * 0.05}s, transform 0.22s ease ${0.10 + index * 0.05}s`,
    } : {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: `11px ${hovered ? '30px' : '24px'}`,
        textDecoration: 'none',
        color: hovered ? '#111111' : '#777777',
        fontSize: '12px',
        fontWeight: '700',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        background: hovered ? '#f5f5f5' : 'transparent',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-8px)',
        transition: `opacity 0.22s ease ${0.10 + index * 0.05}s, transform 0.22s ease ${0.10 + index * 0.05}s, background 0.15s ease, padding 0.2s ease, color 0.2s ease`,
    };

    return (
        <a
            href="/collections"
            onMouseEnter={() => !isMobile && setHovered(true)}
            onMouseLeave={() => !isMobile && setHovered(false)}
            onClick={onClick}
            style={styles}
        >
            View All Collections
            <span style={{
                fontSize: '14px',
                transform: hovered ? 'translateX(3px)' : 'translateX(0)',
                transition: 'transform 0.2s ease',
            }}>→</span>
        </a>
    );
}

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [navHovered, setNavHovered] = useState(false);
    const [shopOpen, setShopOpen] = useState(false);
    const [collectionsOpen, setCollectionsOpen] = useState(false);
    const [collections, setCollections] = useState([]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileShopOpen, setMobileShopOpen] = useState(false);
    const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { pathname } = useLocation();

    const transparentOnTop = pathname === '/' || pathname === '/dashboard';

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/product/get-all-collection`);
                const data = res.data || [];
                setCollections(data);
                // console.log(data);
            } catch (err) {
                console.log('Unable to fetch all collections: ', err);
            }
        };
        fetch();
    }, []);

    const isTransparent = transparentOnTop && !scrolled && !navHovered && !mobileMenuOpen;
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

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
        if (!mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
        document.body.style.overflow = 'unset';
        setMobileShopOpen(false);
        setMobileCollectionsOpen(false);
    };

    return (
        <>
            <nav
                onMouseEnter={() => setNavHovered(true)}
                onMouseLeave={() => setNavHovered(false)}
                style={{
                    width: '100%',
                    backgroundColor: bgColor,
                    transition: 'all 0.3s ease',
                    padding: isMobile ? '20px 20px' : '30px 60px',
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'auto 1fr auto' : '1fr auto 1fr',
                    alignItems: 'center',
                    position: 'fixed',
                    top: 0,
                    zIndex: 999,
                    borderBottom: mobileMenuOpen ? '1px solid #e7e7e7' : 'none',
                    boxShadow: scrolled ? '0 2px 10px rgba(0,0,0,0.08)' : 'none',
                }}
            >
                {/* Mobile Menu Button - Only visible on mobile */}
                {isMobile && (
                    <button
                        onClick={toggleMobileMenu}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: textColor,
                            fontSize: '24px',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.3s ease',
                        }}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                )}

                {/* Desktop Left Navigation - Only visible on desktop */}
                {!isMobile && (
                    <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                        {/* Shop with Dropdown */}
                        <div
                            onMouseEnter={() => setShopOpen(true)}
                            onMouseLeave={() => setShopOpen(false)}
                            style={{ position: 'relative' }}
                        >
                            <a href="/all-product" style={linkStyle}>Shop</a>

                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: '-24px',
                                width: '220px',
                                height: '24px',
                                background: 'transparent',
                                pointerEvents: 'all',
                            }} />

                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 20px)',
                                left: '-24px',
                                width: '220px',
                                background: '#ffffff',
                                pointerEvents: shopOpen ? 'all' : 'none',
                                maxHeight: shopOpen ? '320px' : '0px',
                                opacity: shopOpen ? 1 : 0,
                                transform: shopOpen ? 'translateY(0)' : 'translateY(-6px)',
                                transition: 'max-height 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease, transform 0.28s ease',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                overflow: 'visible',   // ← allows flyout to escape
                                visibility: shopOpen ? 'visible' : 'hidden',  // ← replaces maxHeight clipping
                            }}>
                                <div style={{
                                    height: '3px',
                                    background: '#000000',
                                    width: shopOpen ? '100%' : '0%',
                                    transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1)',
                                    transitionDelay: '0.05s',
                                }} />
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

                        {/* Collections with Dropdown */}
                        <div
                            onMouseEnter={() => setCollectionsOpen(true)}
                            onMouseLeave={() => setCollectionsOpen(false)}
                            style={{ position: 'relative' }}
                        >
                            <a href="/collections" style={linkStyle}>Collections</a>

                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: '-24px',
                                width: '240px',
                                height: '24px',
                                background: 'transparent',
                                pointerEvents: 'all',
                            }} />

                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 20px)',
                                left: '-24px',
                                width: '240px',
                                background: '#ffffff',
                                pointerEvents: collectionsOpen ? 'all' : 'none',
                                maxHeight: collectionsOpen ? '400px' : '0px',
                                opacity: collectionsOpen ? 1 : 0,
                                transform: collectionsOpen ? 'translateY(0)' : 'translateY(-6px)',
                                transition: 'max-height 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease, transform 0.28s ease',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    height: '3px',
                                    background: '#000000',
                                    width: collectionsOpen ? '100%' : '0%',
                                    transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1)',
                                    transitionDelay: '0.05s',
                                }} />
                                <div style={{ padding: '14px 0 18px' }}>
                                    {collections.length === 0 ? (
                                        <div style={{
                                            padding: '11px 24px',
                                            fontSize: '13px',
                                            color: '#999',
                                            fontStyle: 'italic',
                                        }}>
                                            No collections found
                                        </div>
                                    ) : (
                                        <>
                                            {collections.slice(0, 5).map((col, i) => (
                                                <CollectionDropdownItem
                                                    key={col.collection_id}
                                                    collection={col}
                                                    index={i}
                                                    visible={collectionsOpen}
                                                />
                                            ))}

                                            <div style={{
                                                height: '1px',
                                                background: '#eeeeee',
                                                margin: '8px 24px',
                                            }} />

                                            <ViewMoreItem visible={collectionsOpen} index={Math.min(collections.length, 5)} />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <a href="/about" style={linkStyle}>About Us</a>
                    </div>
                )}

                {/* Center Logo */}
                <a href="/" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gridColumn: isMobile ? '2' : 'auto'
                }}>
                    <img src={logoSrc} alt="Logo" style={{ height: isMobile ? '28px' : '30px', width: 'auto', transition: 'opacity 0.3s ease' }} />
                </a>

                {/* Right Icons */}
                <div style={{
                    display: 'flex',
                    gap: isMobile ? '16px' : '24px',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gridColumn: isMobile ? '3' : 'auto'
                }}>
                    <a href="/auth/login" style={{ color: textColor, transition: 'color 0.3s ease', display: 'flex', alignItems: 'center' }}>
                        <FiUser size={18} />
                    </a>
                    <a href="/cart" style={{ color: textColor, transition: 'color 0.3s ease', display: 'flex', alignItems: 'center' }}>
                        <FiShoppingBag size={18} />
                    </a>
                </div>
            </nav>

            {/* Mobile Menu Overlay - Only visible when mobile menu is open */}
            {isMobile && (
                <div style={{
                    position: 'fixed',
                    top: '70px',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: '#ffffff',
                    transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 998,
                    overflowY: 'auto',
                    padding: '20px',
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                    }}>
                        {/* Shop Mobile */}
                        <div>
                            <div
                                onClick={() => setMobileShopOpen(!mobileShopOpen)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '14px 0',
                                    borderBottom: '1px solid #f0f0f0',
                                    cursor: 'pointer',
                                }}
                            >
                                <span style={{
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: '#111',
                                }}>Shop</span>
                                <span style={{
                                    fontSize: '20px',
                                    transform: mobileShopOpen ? 'rotate(90deg)' : 'rotate(0)',
                                    transition: 'transform 0.3s ease',
                                    color: '#666',
                                }}>›</span>
                            </div>
                            <div style={{
                                maxHeight: mobileShopOpen ? '400px' : '0px',
                                overflow: 'hidden',
                                transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}>
                                {shopItems.map((item) => (
                                    <MobileDropdownItem
                                        key={item.href}
                                        item={item}
                                        onNavigate={closeMobileMenu}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Collections Mobile */}
                        <div>
                            <div
                                onClick={() => setMobileCollectionsOpen(!mobileCollectionsOpen)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '14px 0',
                                    borderBottom: '1px solid #f0f0f0',
                                    cursor: 'pointer',
                                }}
                            >
                                <span style={{
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: '#111',
                                }}>Collections</span>
                                <span style={{
                                    fontSize: '20px',
                                    transform: mobileCollectionsOpen ? 'rotate(90deg)' : 'rotate(0)',
                                    transition: 'transform 0.3s ease',
                                    color: '#666',
                                }}>›</span>
                            </div>
                            <div style={{
                                maxHeight: mobileCollectionsOpen ? '400px' : '0px',
                                overflow: 'hidden',
                                transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}>
                                {collections.length === 0 ? (
                                    <div style={{
                                        padding: '12px 0',
                                        fontSize: '14px',
                                        color: '#999',
                                    }}>
                                        No collections found
                                    </div>
                                ) : (
                                    <>
                                        {collections.slice(0, 5).map((col) => (
                                            <a
                                                key={col.collection_id}
                                                href={`/collections/${col.collection_id}`}
                                                onClick={closeMobileMenu}
                                                style={{
                                                    display: 'block',
                                                    padding: '12px 0',
                                                    fontSize: '14px',
                                                    color: '#333',
                                                    textDecoration: 'none',
                                                    borderBottom: '1px solid #f5f5f5',
                                                }}
                                            >
                                                {col.collection_title}
                                            </a>
                                        ))}
                                        <ViewMoreItem
                                            visible={true}
                                            index={0}
                                            isMobile={true}
                                            onClick={closeMobileMenu}
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* About Us Mobile */}
                        <a
                            href="/about"
                            onClick={closeMobileMenu}
                            style={{
                                display: 'block',
                                padding: '14px 0',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#111',
                                textDecoration: 'none',
                                borderBottom: '1px solid #f0f0f0',
                            }}
                        >
                            About Us
                        </a>
                    </div>
                </div>
            )}
        </>
    );
}

function CollectionDropdownItem({ collection, index, visible }) {
    const [hovered, setHovered] = useState(false);

    return (
        <a
            href={`/all-collections?id=${collection.collection_id}`}
            onMouseEnter={() => setHovered(true)}
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
                transition: `opacity 0.22s ease ${0.10 + index * 0.05}s, transform 0.22s ease ${0.10 + index * 0.05}s, background 0.15s ease, padding 0.2s ease`,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}
        >
            {collection.collection_title}
        </a>
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
                        fontSize: '20px',
                        color: hovered ? '#333' : '#999',
                        transform: hovered ? 'translateX(3px)' : 'translateX(0)',
                        transition: 'transform 0.2s ease, color 0.2s ease',
                    }}>›</span>
                )}
            </a>

            {/* 👇 ADD THIS BRIDGE - fills the gap between the item and the submenu */}
            {
                hasSubItems && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '100%',
                        width: '12px',
                        height: '100%',
                        background: 'transparent',
                        pointerEvents: 'all',
                    }} />
                )
            }

            {
                hasSubItems && (
                    <div style={{
                        position: 'absolute',
                        top: '-3px',
                        left: '100%',          // ← keep as-is
                        width: '200px',
                        background: '#ffffff',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                        pointerEvents: subOpen ? 'all' : 'none',
                        opacity: subOpen ? 1 : 0,
                        transform: subOpen ? 'translateX(0)' : 'translateX(-8px)',
                        transition: 'opacity 0.22s ease, transform 0.22s ease',
                        overflow: 'hidden',
                    }}>
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
            onMouseEnter={() => setHovered(true)}
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
        </a>
    );
}

function MobileDropdownItem({ item, onNavigate }) {
    const [isOpen, setIsOpen] = useState(false);
    const hasSubItems = item.subItems && item.subItems.length > 0;

    if (hasSubItems) {
        return (
            <div style={{ marginLeft: '16px' }}>
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: '1px solid #f8f8f8',
                        cursor: 'pointer',
                    }}
                >
                    <span style={{ fontSize: '14px', color: '#333' }}>{item.label}</span>
                    <span style={{
                        fontSize: '16px',
                        transform: isOpen ? 'rotate(90deg)' : 'rotate(0)',
                        transition: 'transform 0.3s ease',
                        color: '#999',
                    }}>›</span>
                </div>
                <div style={{
                    maxHeight: isOpen ? '200px' : '0px',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    marginLeft: '12px',
                }}>
                    {item.subItems.map((sub) => (
                        <a
                            key={sub.href}
                            href={sub.href}
                            onClick={onNavigate}
                            style={{
                                display: 'block',
                                padding: '10px 0',
                                fontSize: '13px',
                                color: '#555',
                                textDecoration: 'none',
                                borderBottom: '1px solid #f8f8f8',
                            }}
                        >
                            {sub.label}
                        </a>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <a
            href={item.href}
            onClick={onNavigate}
            style={{
                display: 'block',
                padding: '12px 16px',
                fontSize: '14px',
                color: '#333',
                textDecoration: 'none',
                borderBottom: '1px solid #f8f8f8',
            }}
        >
            {item.label}
        </a>
    );
}