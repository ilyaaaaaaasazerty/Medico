'use client';
import React, { useEffect, useState } from 'react';
import { adminService, VerificationRequest } from '@/services/admin.service';
import { Loader2, CheckCircle, XCircle, FileText, Building2, User } from 'lucide-react';

export default function VerificationsPage() {
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const data = await adminService.getVerifications();
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        setProcessing(id);
        try {
            await adminService.verifyProvider(id, status);
            // Optimistic update
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('Action failed', error);
            alert('Failed to update status');
        } finally {
            setProcessing(null);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Verification Portal</h1>
                <p className="text-slate-500 mt-2">Review pending applications from Doctors, Clinics, and Labs.</p>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">All Caught Up!</h3>
                    <p className="text-slate-500 mt-2">No pending verifications at this time.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${req.type === 'DOCTOR' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            req.type === 'CLINIC' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        }`}>
                                        {req.type}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        Submitted {new Date(req.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                        {req.type === 'DOCTOR' ? <User size={24} /> : <Building2 size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            Provider ID: {req.targetId.substring(0, 8)}...
                                        </h3>
                                        <div className="flex gap-4 mt-3">
                                            {req.documents && JSON.parse(req.documents as any).map((doc: string, idx: number) => (
                                                <a
                                                    key={idx}
                                                    href={doc}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                                >
                                                    <FileText size={16} /> Document {idx + 1}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
                                <button
                                    onClick={() => handleVerify(req.id, 'APPROVED')}
                                    disabled={processing === req.id}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {processing === req.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleVerify(req.id, 'REJECTED')}
                                    disabled={processing === req.id}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    <XCircle size={18} />
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
