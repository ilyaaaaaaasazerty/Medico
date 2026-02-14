'use client';
import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, MoreVertical, ShieldAlert, ShieldCheck } from 'lucide-react';

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    user: {
        id: string;
        email: string;
        status: 'ACTIVE' | 'SUSPENDED';
        lastLogin?: string;
    }
}

export default function PatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`http://192.168.1.7:3001/api/v1/admin/patients?search=${search}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) setPatients(json.data);
        } catch (err) {
            console.error('Failed to fetch patients', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string, current: string) => {
        const newStatus = current === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`http://192.168.1.7:3001/api/v1/admin/users/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) fetchPatients();
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    useEffect(() => { fetchPatients(); }, [search]);

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold">Patient Management</h1>
                    <p className="text-slate-500 mt-1">Manage and monitor all registered patients across the platform.</p>
                </div>
            </header>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors">
                        <Filter size={16} />
                        Filter
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Patient</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Last Login</th>
                                <th className="px-6 py-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Loading patients...</td></tr>
                            ) : patients.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No patients found.</td></tr>
                            ) : patients.map(patient => (
                                <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold">
                                                {patient.firstName[0]}{patient.lastName[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900 dark:text-white">{patient.firstName} {patient.lastName}</div>
                                                <div className="text-slate-500 text-xs">{patient.user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${patient.user.status === 'ACTIVE'
                                            ? 'bg-green-50 text-green-600 dark:bg-green-900/20'
                                            : 'bg-red-50 text-red-600 dark:bg-red-900/20'
                                            }`}>
                                            {patient.user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {patient.user.lastLogin ? new Date(patient.user.lastLogin).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleStatus(patient.user.id, patient.user.status)}
                                            className={`p-2 rounded-lg transition-colors ${patient.user.status === 'ACTIVE'
                                                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'
                                                : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/10'
                                                }`}
                                            title={patient.user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                        >
                                            {patient.user.status === 'ACTIVE' ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
