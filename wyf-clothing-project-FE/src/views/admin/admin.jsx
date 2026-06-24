import { useNavigate } from 'react-router-dom';

export default function Admin() {
    const navigate = useNavigate();

    const navigateTo = (path) => {
        navigate(path);
    };

    return (
        <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-6 font-serif">
            <div className="w-full max-w-lg">
                {/* Minimal header */}
                <div className="mb-12">
                    <h1 className="text-6xl font-light text-black tracking-tight">/</h1>
                    <p className="text-black/30 text-sm tracking-[0.2em] uppercase mt-1">dashboard</p>
                </div>

                {/* Buttons - clean, minimal, black & white */}
                <div className="space-y-2">
                    <button
                        onClick={() => navigateTo('/admin/admin-all-product')}
                        className="w-full text-left px-0 py-4 border-b border-black/10 hover:border-black/40 transition-colors group"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-black/70 group-hover:text-black text-sm tracking-wide transition-colors">
                                Product Manager
                            </span>
                            <span className="text-black/10 group-hover:text-black/30 transition-colors text-xs">⌘1</span>
                        </div>
                    </button>

                    <button
                        onClick={() => navigateTo('/admin/categories')}
                        className="w-full text-left px-0 py-4 border-b border-black/10 hover:border-black/40 transition-colors group"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-black/70 group-hover:text-black text-sm tracking-wide transition-colors">
                                Setup-image per category
                            </span>
                            <span className="text-black/10 group-hover:text-black/30 transition-colors text-xs">⌘2</span>
                        </div>
                    </button>

                    <button
                        onClick={() => navigateTo('/admin/collections')}
                        className="w-full text-left px-0 py-4 border-b border-black/10 hover:border-black/40 transition-colors group"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-black/70 group-hover:text-black text-sm tracking-wide transition-colors">
                                Collection Manager
                            </span>
                            <span className="text-black/10 group-hover:text-black/30 transition-colors text-xs">⌘3</span>
                        </div>
                    </button>

                    <button
                        onClick={() => navigateTo('/admin/blog')}
                        className="w-full text-left px-0 py-4 border-b border-black/10 hover:border-black/40 transition-colors group"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-black/70 group-hover:text-black text-sm tracking-wide transition-colors">
                                Blog
                            </span>
                            <span className="text-black/10 group-hover:text-black/30 transition-colors text-xs">⌘4</span>
                        </div>
                    </button>

                    <button
                        onClick={() => navigateTo('/admin/dashboard-image')}
                        className="w-full text-left px-0 py-4 border-b border-black/10 hover:border-black/40 transition-colors group"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-black/70 group-hover:text-black text-sm tracking-wide transition-colors">
                                Dashboard image
                            </span>
                            <span className="text-black/10 group-hover:text-black/30 transition-colors text-xs">⌘5</span>
                        </div>
                    </button>
                </div>

                {/* Subtle footer */}
                <div className="mt-12 flex justify-between text-black/20 text-[10px] tracking-[0.15em] uppercase">
                    <span>—</span>
                    <span>minimal</span>
                    <span>—</span>
                </div>
            </div>
        </div>
    );
}