'use client';
import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/admin.service';
import { Loader2, Download, TrendingUp, TrendingDown } from 'lucide-react';

export default function FinancePage() {
    const [payouts, setPayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await adminService.getPayouts();
            setPayouts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    const totalVolume = payouts.reduce((sum, p) => sum + p.amount, 0);

    return (
        <div>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Global Ledger</h1>
                    <p className="text-slate-500 mt-2">Track revenue flows and provider payouts.</p>
                </div>
                <button className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white">
                    <p className="text-slate-400 text-sm font-medium">Total Volume</p>
                    <h2 className="text-3xl font-bold mt-2">{totalVolume.toLocaleString()} DZD</h2>
                </div>
                {/* Add more stats here */}
            </div>

            {/* Transaction Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-4">Transaction ID</th>
                            <th className="px-6 py-4">Provider</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {payouts.map((payout) => (
                            <tr key={payout.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">
                                    {payout.id.substring(0, 8)}...
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                    {payout.doctor?.firstName || payout.clinic?.name || payout.lab?.name || 'Unknown'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="capitalize text-slate-500">{payout.providerType.toLowerCase()}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${payout.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            payout.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${payout.status === 'PAID' ? 'bg-emerald-500' :
                                                payout.status === 'PENDING' ? 'bg-amber-500' : 'bg-slate-500'
                                            }`} />
                                        {payout.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                                    {payout.amount.toLocaleString()} DZD
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {payouts.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                        No transactions found.
                    </div>
                )}
            </div>
        </div>
    );
}
