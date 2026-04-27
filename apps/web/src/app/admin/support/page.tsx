'use client';
import React, { useState, useEffect } from 'react';
import { adminService, SupportTicket } from '@/services/admin.service';
import { LifeBuoy, Clock, AlertCircle, MessageSquare, Send, Loader2 } from 'lucide-react';

export default function SupportPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const data = await adminService.getTickets();
            setTickets(data ?? []);
        } catch (err) {
            console.error('Failed to fetch tickets', err);
        } finally {
            setLoading(false);
        }
    };

    const sendReply = async () => {
        if (!reply.trim() || !selectedTicket) return;
        setSending(true);
        try {
            await adminService.replyToTicket(selectedTicket.id, reply);
            const updated = await adminService.getTicket(selectedTicket.id);
            setSelectedTicket(updated);
            setReply('');
            fetchTickets();
        } catch (err) {
            console.error('Failed to reply', err);
        } finally {
            setSending(false);
        }
    };

    useEffect(() => { fetchTickets(); }, []);

    return (
        <div className="h-full flex flex-col space-y-8">
            <header>
                <h1 className="text-3xl font-bold">Support Center</h1>
                <p className="text-slate-500 mt-1">Resolve patient inquiries and platform issues.</p>
            </header>

            <div className="flex-1 flex gap-6 overflow-hidden">
                <div className="w-1/3 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 font-bold flex items-center gap-2">
                        <Clock size={18} /> Recent Tickets
                    </div>
                    <div className="flex-1 overflow-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {loading && tickets.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">Loading tickets...</div>
                        ) : tickets.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No tickets found.</div>
                        ) : tickets.map(ticket => (
                            <button
                                key={ticket.id}
                                onClick={() => setSelectedTicket(ticket)}
                                className={`w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="font-semibold text-sm truncate flex-1 pr-2">{ticket.subject}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${ticket.status === 'OPEN' ? 'bg-red-50 text-red-600' :
                                        ticket.status === 'RESOLVED' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1 flex justify-between">
                                    <span>{ticket.patient.firstName} {ticket.patient.lastName}</span>
                                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    {selectedTicket ? (
                        <>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                                <h3 className="text-xl font-bold">{selectedTicket.subject}</h3>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-widest font-bold">
                                        <AlertCircle size={14} className="text-orange-500" />
                                        {selectedTicket.priority} PRIORITY
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-widest font-bold">
                                        <LifeBuoy size={14} className="text-blue-500" />
                                        ID: {selectedTicket.id.split('-')[0]}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto p-6 space-y-6">
                                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{selectedTicket.content}</p>
                                </div>
                                {selectedTicket.replies?.map(r => (
                                    <div key={r.id} className={`flex ${r.isStaff ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-2xl ${r.isStaff
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none'}`}>
                                            <p className="text-sm leading-relaxed">{r.content}</p>
                                            <div className={`text-[10px] mt-2 opacity-60 ${r.isStaff ? 'text-right' : 'text-left'}`}>
                                                {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
                                <div className="flex gap-4">
                                    <textarea
                                        className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                                        placeholder="Type your response to the patient..."
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                    />
                                    <button
                                        onClick={sendReply}
                                        disabled={!reply.trim() || sending}
                                        className="self-end p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-400 transition-all font-bold shadow-lg shadow-blue-500/20"
                                    >
                                        {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <MessageSquare size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">No Ticket Selected</h3>
                            <p className="max-w-xs mt-2">Select a ticket from the left sidebar to view details and respond.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
