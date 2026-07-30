import { requireActiveSession } from '@/lib/auth/require-session';
import { getVisibleModulesForUser } from '@/lib/modules/moduleConfigurationService';

import { ModuleSection } from './_components/ModuleSection';

export default async function DashboardPage() {
    const session = await requireActiveSession();
    const visibleModules = await getVisibleModulesForUser({
        userId: session.user.id,
        role: session.user.role,
    });

    const modules = visibleModules.filter((module) => module.category === 'module');
    const administrationModules = visibleModules.filter(
        (module) => module.category === 'administration'
    );

    const userName = session.user.name ?? 'Citizen';

    return (
        <div className="mx-auto max-w-7xl space-y-10">
            <section className="border-b border-line pb-8">
                <p className="eyebrow">
                    <span className="eyebrow-dot" />
                    Systemzugriff bestätigt
                </p>

                <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="font-display text-3xl uppercase tracking-[0.06em] text-text md:text-4xl">
                            Willkommen, {userName}
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-dim">
                            Wähle ein verfügbares System aus. Neue Werkzeuge werden automatisch in
                            dieser Übersicht ergänzt.
                        </p>
                    </div>

                    <div className="w-fit border border-line bg-panel px-4 py-3">
                        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-dim">
                            Zugriffslevel
                        </p>
                        <p className="mt-1 font-mono text-sm text-cyan">{session.user.role}</p>
                    </div>
                </div>
            </section>

            <ModuleSection
                eyebrow="Toolbox"
                title="Module"
                description="Alle für deinen Account freigeschalteten Werkzeuge."
                modules={modules}
                emptyMessage="Noch keine Module verfügbar. Neue Werkzeuge werden hier automatisch angezeigt."
            />

            {administrationModules.length > 0 && (
                <ModuleSection
                    eyebrow="Restricted Access"
                    title="Verwaltung"
                    description="Administrative Systeme für Mitglieder-, Modul- und Zugriffsverwaltung."
                    modules={administrationModules}
                />
            )}
        </div>
    );
}
