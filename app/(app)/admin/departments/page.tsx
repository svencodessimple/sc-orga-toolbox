import { DepartmentCreateForm } from './_components/DepartmentCreateForm';

import { getDepartments } from '@/lib/departments/departmentService';
import { requireAdminSession } from '@/lib/auth/require-session';
import { DepartmentCard } from './_components/DepartmentCard';

export default async function DepartmentManagementPage() {
    await requireAdminSession();

    const departments = await getDepartments({ includeArchived: true });

    const activeDepartments = departments.filter((department) => !department.archivedAt);
    const archivedDepartments = departments.filter((department) => department.archivedAt);

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <section className="border-b border-line pb-8">
                <p className="eyebrow">
                    <span className="eyebrow-dot" />
                    Organization Management
                </p>

                <h1 className="mt-3 font-display text-3xl uppercase tracking-[0.06em] text-text md:text-4xl">
                    Abteilungen
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-text-dim">
                    Abteilungen verwalten und ihre Mitglieder organisieren. Archivierte Abteilungen
                    behalten ihre Mitgliedschaften, können aber nicht für neue Zuordnungen verwendet
                    werden.
                </p>
            </section>

            <DepartmentCreateForm />

            <section className="space-y-5">
                <div>
                    <p className="eyebrow">
                        <span className="eyebrow-dot" />
                        Active Departments
                    </p>
                    <h2 className="font-display text-2xl uppercase tracking-wider text-text">
                        Aktive Abteilungen
                    </h2>
                </div>

                {activeDepartments.map((department) => (
                    <DepartmentCard
                        key={department.id}
                        department={department}
                        isArchived={false}
                    />
                ))}
            </section>

            {archivedDepartments.map((department) => (
                <DepartmentCard key={department.id} department={department} isArchived={true} />
            ))}
        </div>
    );
}
