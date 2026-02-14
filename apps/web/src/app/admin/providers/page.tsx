'use client';
import React, { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service';
import { Loader2, Plus, UserPlus, Building2, FlaskConical, Stethoscope } from 'lucide-react';

export default function ProvidersPage() {
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Form State
    const [type, setType] = useState<'DOCTOR' | 'CLINIC' | 'LAB'>('DOCTOR');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [details, setDetails] = useState({
        firstName: '', lastName: '', name: '',
        phone: '', address: '', city: 'Algiers',
        specialtyId: '',
        licenseNumber: '',
        licenseExpiry: '',
        labType: 'BOTH' as 'LABORATORY' | 'RADIOLOGY' | 'BOTH'
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await adminService.createProvider({
                type,
                email,
                password,
                details
            });
            setSuccess(`Successfully created ${type} account for ${email}`);
            setTimeout(() => {
                setIsCreating(false);
                resetForm();
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create provider');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setDetails({
            firstName: '', lastName: '', name: '', phone: '', address: '', city: 'Algiers',
            specialtyId: '', licenseNumber: '', licenseExpiry: '', labType: 'BOTH'
        });
        setSuccess('');
        setError('');
    };

    interface Doctor {
        id: string;
        firstName: string;
        lastName: string;
        verificationStatus: string;
        user: { status: string, email: string, lastLoginAt?: string };
        specialties?: { specialty: { name: string } }[];
    }

    interface Clinic {
        id: string;
        name: string;
        city: string;
        verificationStatus: string;
        admins: { user: { email: string, status: string } }[];
    }

    interface Lab {
        id: string;
        name: string;
        city: string;
        type: string;
        verificationStatus: string;
        admins: { user: { email: string, status: string } }[];
    }

    const [activeTab, setActiveTab] = useState<'DOCTOR' | 'CLINIC' | 'LAB'>('DOCTOR');
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [labs, setLabs] = useState<Lab[]>([]);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (!isCreating) loadData();
    }, [isCreating, activeTab]);

    const loadData = async () => {
        setFetching(true);
        try {
            if (activeTab === 'DOCTOR') {
                const data = await adminService.getDoctors();
                setDoctors(data);
            } else if (activeTab === 'CLINIC') {
                const data = await adminService.getClinics();
                setClinics(data);
            } else if (activeTab === 'LAB') {
                const data = await adminService.getLabs();
                setLabs(data);
            }
        } catch (err) {
            console.error('Failed to load data', err);
        } finally {
            setFetching(false);
        }
    };

    if (!isCreating) {
        return (
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Provider Network</h1>
                        <p className="text-slate-500 mt-2">Oversee and manage all healthcare partners.</p>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={20} /> Onboard Provider
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl w-fit border border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('DOCTOR')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'DOCTOR' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Doctors
                    </button>
                    <button
                        onClick={() => setActiveTab('CLINIC')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'CLINIC' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Clinics
                    </button>
                    <button
                        onClick={() => setActiveTab('LAB')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'LAB' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Labs
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 uppercase tracking-widest text-[10px] font-bold">
                                <tr>
                                    <th className="px-6 py-5">Name / Location</th>
                                    <th className="px-6 py-5">Type / Specialty</th>
                                    <th className="px-6 py-5 text-center">Verification</th>
                                    <th className="px-6 py-5 text-center">System Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {fetching ? (
                                    <tr><td colSpan={4} className="px-6 py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></td></tr>
                                ) : (activeTab === 'DOCTOR' ? doctors : activeTab === 'CLINIC' ? clinics : labs).length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-500 font-medium">No results found in this category.</td></tr>
                                ) : (activeTab === 'DOCTOR' ? doctors : activeTab === 'CLINIC' ? clinics : labs).map((item: any) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                {activeTab === 'DOCTOR' ? `Dr. ${item.firstName} ${item.lastName}` : item.name}
                                            </div>
                                            <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1.5 uppercase tracking-tighter">
                                                <Building2 size={10} /> {item.city || 'Algiers'}
                                                <span className="opacity-30">•</span>
                                                {activeTab === 'DOCTOR' ? item.user.email : item.admins?.[0]?.user?.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-600 dark:text-slate-400 font-medium">
                                                {activeTab === 'DOCTOR' ? (item.specialties?.[0]?.specialty?.name || 'Generalist') : activeTab === 'LAB' ? item.type : 'Medical Facility'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${item.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                }`}>
                                                {item.verificationStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${(activeTab === 'DOCTOR' ? item.user.status : item.admins?.[0]?.user?.status) === 'ACTIVE' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                                                <span className={`text-[11px] font-bold ${(activeTab === 'DOCTOR' ? item.user.status : item.admins?.[0]?.user?.status) === 'ACTIVE' ? 'text-green-600' : 'text-red-500'}`}>
                                                    {activeTab === 'DOCTOR' ? item.user.status : item.admins?.[0]?.user?.status}
                                                </span>
                                            </div>
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

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Onboard New Provider</h2>
                <button onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-slate-700">Cancel</button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">

                {/* Type Selection */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <button
                        onClick={() => setType('DOCTOR')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${type === 'DOCTOR'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                    >
                        <Stethoscope size={24} />
                        <span className="font-semibold text-sm">Doctor</span>
                    </button>
                    <button
                        onClick={() => setType('CLINIC')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${type === 'CLINIC'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                            : 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                    >
                        <Building2 size={24} />
                        <span className="font-semibold text-sm">Clinic</span>
                    </button>
                    <button
                        onClick={() => setType('LAB')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${type === 'LAB'
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                            : 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                    >
                        <FlaskConical size={24} />
                        <span className="font-semibold text-sm">Lab</span>
                    </button>
                </div>

                {success && (
                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 text-sm font-medium text-center">
                        {success}
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Account Access</label>
                        </div>
                        <div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Email Address"
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Initial Password"
                            />
                        </div>
                    </div>

                    <div className="pt-4 grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Profile Details</label>
                        </div>

                        {type === 'DOCTOR' && (
                            <>
                                <input
                                    type="text" required
                                    value={details.firstName}
                                    onChange={(e) => setDetails({ ...details, firstName: e.target.value })}
                                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    placeholder="First Name"
                                />
                                <input
                                    type="text" required
                                    value={details.lastName}
                                    onChange={(e) => setDetails({ ...details, lastName: e.target.value })}
                                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    placeholder="Last Name"
                                />
                                <input
                                    type="text" required
                                    value={details.licenseNumber}
                                    onChange={(e) => setDetails({ ...details, licenseNumber: e.target.value })}
                                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    placeholder="License Number (e.g. DOC123)"
                                />
                                <div className="space-y-1">
                                    <input
                                        type="date" required
                                        value={details.licenseExpiry}
                                        onChange={(e) => setDetails({ ...details, licenseExpiry: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                    <p className="text-[10px] text-slate-400 px-1 uppercase font-semibold">License Expiry</p>
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="text"
                                        value={details.specialtyId}
                                        onChange={(e) => setDetails({ ...details, specialtyId: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="Specialty ID (Optional)"
                                    />
                                </div>
                            </>
                        )}

                        {type !== 'DOCTOR' && (
                            <div className="col-span-2">
                                <input
                                    type="text" required
                                    value={details.name}
                                    onChange={(e) => setDetails({ ...details, name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    placeholder={type === 'CLINIC' ? "Clinic Name" : "Lab Name"}
                                />
                            </div>
                        )}

                        {type === 'LAB' && (
                            <div className="col-span-2">
                                <select
                                    value={details.labType}
                                    onChange={(e) => setDetails({ ...details, labType: e.target.value as any })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                >
                                    <option value="LABORATORY">Clinical Laboratory</option>
                                    <option value="RADIOLOGY">Radiology Center</option>
                                    <option value="BOTH">Full Diagnostic Center (Both)</option>
                                </select>
                            </div>
                        )}

                        <div className="col-span-2 grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                value={details.city}
                                onChange={(e) => setDetails({ ...details, city: e.target.value })}
                                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="City"
                            />
                            <input
                                type="text"
                                value={details.phone}
                                onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="Phone Number"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        {loading && <Loader2 className="animate-spin" size={20} />}
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}
