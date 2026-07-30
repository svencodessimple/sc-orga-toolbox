import { getActiveAccessGroups } from '@/lib/access-groups/accessGroupService';
import { requireAdminSession } from '@/lib/auth/require-session';
import { getModuleManagementConfigurations } from '@/lib/modules/moduleConfigurationService';

import { ModuleConfigurationCard } from './_components/ModuleConfigurationCard';

export default async function ModuleManagementPage() {
    await requireAdminSession();

    const [modules, availableGroups] = await Promise.all([
        getModuleManagementConfigurations(),
        getActiveAccessGroups(),
    ]);

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <section className="border-b border-line pb-8">
                <p className="eyebrow">
                    <span className="eyebrow-dot" />
                    Restricted Access
                </p>

                <h1 className="mt-3 font-display text-3xl uppercase tracking-[0.06em] text-text md:text-4xl">
                    Modulverwaltung
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-text-dim">
                    Dashboard-Module konfigurieren und ihre sichtbare Reihenfolge festlegen.
                    Technisch geschützte Eigenschaften können nicht überschrieben werden.
                </p>
            </section>

            <div className="space-y-6">
                {modules.map((module) => (
                    <ModuleConfigurationCard
                        key={module.id}
                        module={module}
                        availableGroups={availableGroups}
                    />
                ))}
            </div>
        </div>
    );
}
