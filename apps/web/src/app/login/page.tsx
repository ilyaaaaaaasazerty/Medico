'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin/login');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <p className="text-slate-400">Redirecting to Admin Portal...</p>
        </div>
    );
}
