import { AccessGroupCreateForm } from './_components/AccessGroupCreateForm';
import { AccessGroupCard } from './_components/AccessGroupCard';

import { getAccessGroups } from '@/lib/access-groups/accessGroupService';
import { requireAdminSession } from '@/lib/auth/require-session';

export default async function AccessGroupManagementPage() {
    await requireAdminSession();

    const groups = await getAccessGroups({
        includeArchived: true,
    });

    const activeGroups = groups.filter((group) => !group.archivedAt);
    const archivedGroups = groups.filter((group) => group.archivedAt);

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <section className="border-b border-line pb-8">
                <p className="eyebrow">
                    <span className="eyebrow-dot" />
                    Restricted Access
                </p>

                <h1 className="mt-3 font-display text-3xl uppercase tracking-[0.06em] text-text md:text-4xl">
                    Zugriffsgruppen
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-text-dim">
                    Gruppen erstellen und Benutzer sowie Module zuordnen. Archivierte Gruppen
                    behalten ihre Zuordnungen, gewähren aber keinen Zugriff.
                </p>
            </section>

            <AccessGroupCreateForm />

            <section className="space-y-5">
                <div>
                    <p className="eyebrow">
                        <span className="eyebrow-dot" />
                        Active Groups
                    </p>

                    <h2 className="font-display text-2xl uppercase tracking-wider text-text">
                        Aktive Gruppen
                    </h2>
                </div>

                {activeGroups.length > 0 ? (
                    <div className="space-y-4">
                        {activeGroups.map((group) => (
                            <AccessGroupCard key={group.id} group={group} />
                        ))}
                    </div>
                ) : (
                    <div className="border border-dashed border-line bg-panel/50 px-6 py-10 text-center">
                        <p className="font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                            Noch keine aktiven Zugriffsgruppen vorhanden.
                        </p>
                    </div>
                )}
            </section>

            {archivedGroups.length > 0 && (
                <section className="space-y-5">
                    <div>
                        <p className="eyebrow">
                            <span className="eyebrow-dot" />
                            Archived Groups
                        </p>

                        <h2 className="font-display text-2xl uppercase tracking-wider text-text">
                            Archivierte Gruppen
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {archivedGroups.map((group) => (
                            <AccessGroupCard key={group.id} group={group} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
