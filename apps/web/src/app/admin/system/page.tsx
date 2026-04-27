'use client';
import React, { useState, useEffect } from 'react';
import { adminService, FeatureFlag } from '@/services/admin.service';
import { Database, RefreshCcw, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

export default function SystemPage() {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);

    const fetchFlags = async () => {
        setLoading(true);
        try {
            const data = await adminService.getFeatureFlags();
            setFlags(data ?? []);
        } catch (err) {
            console.error('Failed to fetch flags', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleFlag = async (key: string, current: boolean) => {
        setToggling(key);
        try {
            await adminService.toggleFeatureFlag(key, !current);
            setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !current } : f));
        } catch (err) {
            console.error('Failed to update flag', err);
        } finally {
            setToggling(null);
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
                <button onClick={fetchFlags} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
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
                                    disabled={toggling === flag.key}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all disabled:opacity-60 ${flag.enabled
                                        ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}
                                >
                                    {toggling === flag.key
                                        ? <Loader2 size={20} className="animate-spin" />
                                        : flag.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
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
