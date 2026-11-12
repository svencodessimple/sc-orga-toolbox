import type { DepartmentMemberViewModel } from '@/lib/departments/departmentTypes';

interface DepartmentMembershipSectionProps {
    members: DepartmentMemberViewModel[];
}

export function DepartmentMembershipSection({ members }: DepartmentMembershipSectionProps) {
    return (
        <section className="border-t border-line pt-6">
            <h4 className="font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                Abteilungsmitglieder
            </h4>

            {members.length === 0 ? (
                <p className="mt-3 text-sm text-text-dim">
                    Dieser Abteilung sind noch keine Mitglieder zugeordnet.
                </p>
            ) : (
                <ul className="mt-3 space-y-2">
                    {members.map((member) => (
                        <li
                            key={member.userId}
                            className="flex flex-col gap-1 border border-line bg-panel-alt px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <span className="text-sm text-text">{member.sc_handle}</span>

                            <span className="font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                                {member.role === 'MANAGER' ? 'Abteilungsmanager' : 'Mitglied'}
                                {' · '}
                                {member.status}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
