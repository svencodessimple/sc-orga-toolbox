import { requireModuleAccess } from '@/lib/auth/require-module-access';

export default async function MemberAreaPage() {
    const session = await requireModuleAccess('member-area');

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <section className="border-b border-line pb-8">
                <p className="eyebrow">
                    <span className="eyebrow-dot" />
                    Member Access
                </p>

                <h1 className="mt-3 font-display text-3xl uppercase tracking-[0.06em] text-text md:text-4xl">
                    Mitgliederbereich
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-text-dim">
                    Persönliche Übersicht und freigegebene Inhalte deiner Organisation.
                </p>
            </section>

            <section className="border border-line bg-panel p-6">
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-text-dim">
                    Angemeldeter Citizen
                </p>

                <p className="mt-2 font-display text-2xl uppercase tracking-wider text-text">
                    {session.user.name ?? 'Citizen'}
                </p>

                <p className="mt-3 font-mono text-sm text-cyan">Modulzugriff bestätigt</p>
            </section>
        </div>
    );
}
