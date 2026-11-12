import { requireModuleAccess } from '@/lib/auth/require-module-access';
import { getDepartmentsForUser } from '@/lib/departments/departmentService';
import { DepartmentAreaCard } from './_components/DepartmentAreaCard';

export default async function DepartmentAreaPage() {
    const session = await requireModuleAccess('department-area');

    const departments = await getDepartmentsForUser(session.user.id, session.user.role);

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <section className="border-b border-line pb-8">
                <p className="eyebrow">
                    <span className="eyebrow-dot" />
                    Organization
                </p>

                <h1 className="mt-3 font-display text-3xl uppercase tracking-[0.06em] text-text md:text-4xl">
                    Abteilungsbereich
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-text-dim">
                    Deine Abteilungen, Mitglieder und organisatorischen Zuständigkeiten.
                </p>
            </section>

            {departments.length === 0 ? (
                <section className="border border-line bg-panel p-6">
                    <p className="font-display text-xl uppercase tracking-wider text-text">
                        Keine Abteilungen
                    </p>
                    <p className="mt-2 text-sm text-text-dim">
                        Du bist aktuell keiner Abteilung zugeordnet.
                    </p>
                </section>
            ) : (
                <section className="space-y-4">
                    {departments.map((department) => {
                        const ownMembership = department.members.find(
                            (member) => member.userId === session.user.id
                        );

                        const canManage =
                            session.user.role === 'ADMIN' || ownMembership?.role === 'MANAGER';

                        return (
                            <DepartmentAreaCard
                                key={department.id}
                                department={department}
                                ownRole={ownMembership?.role ?? null}
                                canManage={canManage}
                            />
                        );
                    })}
                </section>
            )}
        </div>
    );
}
