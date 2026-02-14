'use client';
import React, { useEffect, useState } from 'react';
import { adminService, DashboardStats } from '@/services/admin.service';
import { Loader2, Users, Activity, Building2, FlaskConical, DollarSign, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await adminService.getStats();
            setStats(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center text-slate-500">
                <Loader2 className="animate-spin mr-2" /> Loading command center...
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Command Center</h1>
                <p className="text-slate-500 mt-2">Live overview of the Medico Ecosystem.</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Patients"
                    value={stats?.users.patients || 0}
                    icon={Users}
                    color="text-blue-500"
                    trend="+12% this week"
                />
                <StatCard
                    title="Doctors Onboarded"
                    value={stats?.users.doctors || 0}
                    icon={Activity}
                    color="text-emerald-500"
                />
                <StatCard
                    title="Active Clinics"
                    value={stats?.users.clinics || 0}
                    icon={Building2}
                    color="text-purple-500"
                />
                <StatCard
                    title="Partner Labs"
                    value={stats?.users.labs || 0}
                    icon={FlaskConical}
                    color="text-amber-500"
                />
            </div>

            {/* Urgent Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Revenue Overview</h2>
                        <select className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm px-3 py-1">
                            <option>This Month</option>
                            <option>Last Month</option>
                        </select>
                    </div>
                    <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                        <div className="text-center">
                            <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                            <p className="text-slate-500">Revenue Chart Placeholder</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                                {stats?.finance.totalPayouts.toLocaleString()} DZD
                            </p>
                            <p className="text-xs text-slate-400">Total Payouts Processed</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Urgent Attention</h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/20">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h3 className="font-medium text-amber-900 dark:text-amber-100">Pending Verifications</h3>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                    {stats?.tasks.pendingVerifications} providers are waiting for approval.
                                </p>
                                <button className="mt-3 text-sm font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300">
                                    Review Now →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{value}</h3>
                    {trend && <p className="text-xs text-emerald-500 font-medium mt-1">{trend}</p>}
                </div>
                <div className={`p-3 rounded-lg bg-slate-50 dark:bg-slate-800 ${color}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
}
