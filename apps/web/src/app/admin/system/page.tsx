'use client';
import React, { useState, useEffect } from 'react';
import { Database, Save, RefreshCcw, ToggleLeft, ToggleRight } from 'lucide-react';

interface FeatureFlag {
    id: string;
    key: string;
    enabled: boolean;
    description?: string;
}

export default function SystemPage() {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFlags = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('http://192.168.1.7:3001/api/v1/admin/feature-flags', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) setFlags(json.data);
        } catch (err) {
            console.error('Failed to fetch flags', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleFlag = async (key: string, current: boolean) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`http://192.168.1.7:3001/api/v1/admin/feature-flags/${key}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ enabled: !current })
            });
            if (res.ok) fetchFlags();
        } catch (err) {
            console.error('Failed to update flag', err);
        }
    };

    useEffect(() => { fetchFlags(); }, []);

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">System Management</h1>
                    <p className="text-slate-500 mt-1">Configure global platform settings and feature rollouts.</p>
                </div>
                <button
                    onClick={fetchFlags}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            <div className="grid gap-6">
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                            <Database size={20} />
                        </div>
                        <h2 className="text-xl font-bold">Feature Flags</h2>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading && flags.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">Loading platform flags...</div>
                        ) : flags.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">No feature flags configured yet.</div>
                        ) : flags.map(flag => (
                            <div key={flag.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-sm">{flag.key}</h3>
                                    <p className="text-slate-500 text-sm mt-1">{flag.description || 'No description provided.'}</p>
                                </div>
                                <button
                                    onClick={() => toggleFlag(flag.key, flag.enabled)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${flag.enabled
                                        ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                        }`}
                                >
                                    {flag.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                    {flag.enabled ? 'Enabled' : 'Disabled'}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
