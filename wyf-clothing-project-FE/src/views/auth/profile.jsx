import { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../../config'; // adjust path to wherever your config lives

export default function Profile() {
    const [form, setForm] = useState({ name: '', email: '', role: 'user' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', msg }

    const token = localStorage.getItem('access_token');

    useEffect(() => {
        async function fetchMe() {
            try {
                const res = await axios.get(`${config.baseApi}/users/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setForm({
                    name: res.data.user.user_metadata?.name ?? '',
                    email: res.data.user.email ?? '',
                    role: res.data.user.user_metadata?.role ?? 'user'
                });
            } catch (err) {
                setStatus({ type: 'error', msg: err.response?.data?.msg || 'Failed to load profile' });
            } finally {
                setLoading(false);
            }
        }
        fetchMe();
    }, [token]);

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setStatus(null);

        try {
            const res = await axios.put(
                `${config.baseApi}/users/update-profile`,
                form,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setStatus({ type: 'success', msg: res.data.message || 'Profile updated successfully.' });
        } catch (err) {
            setStatus({ type: 'error', msg: err.response?.data?.msg || 'Update failed' });
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="p-6 text-sm text-gray-500">Loading profile...</div>;

    return (
        <div className="max-w-md mx-auto p-6" style={{ paddingTop: 100 }}>
            <h1 className="text-xl font-semibold mb-4">Edit Profile</h1>

            {status && (
                <div
                    className={`mb-4 rounded px-3 py-2 text-sm ${status.type === 'success'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                        }`}
                >
                    {status.msg}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2 text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Changing your email will require reconfirmation via a new link.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2 text-sm"
                    >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
}