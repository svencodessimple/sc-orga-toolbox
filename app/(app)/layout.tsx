import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { requireAppSession } from '@/lib/auth/require-session';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const session = await requireAppSession();

    return (
        <div className="min-h-screen flex flex-col">
            <Header user={session.user} />
            <main className="flex-1 p-6 md:p-8">{children}</main>
            <Footer />
        </div>
    );
}
