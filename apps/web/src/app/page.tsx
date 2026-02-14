import Link from 'next/link';

export default function Home() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-2xl">
                <h1 className="text-5xl font-bold mb-4">🏥 Medico</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                    Medical Platform Administration Dashboard
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                    <div className="card p-6 text-left">
                        <h2 className="text-xl font-semibold mb-2">📊 Dashboard</h2>
                        <p className="text-gray-500">System overview, stats, and analytics</p>
                    </div>
                    <div className="card p-6 text-left">
                        <h2 className="text-xl font-semibold mb-2">👥 Users</h2>
                        <p className="text-gray-500">Manage patients, doctors, clinics</p>
                    </div>
                    <div className="card p-6 text-left">
                        <h2 className="text-xl font-semibold mb-2">✅ Verification</h2>
                        <p className="text-gray-500">Approve or reject providers</p>
                    </div>
                    <div className="card p-6 text-left">
                        <h2 className="text-xl font-semibold mb-2">💰 Financial</h2>
                        <p className="text-gray-500">Transactions and payouts</p>
                    </div>
                </div>

                <Link href="/admin/login" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-colors inline-block">
                    Access Admin Portal
                </Link>
            </div>
        </main>
    );
}
