import { TerminalButton } from '@/components/mobiglas/TerminalButton';
import type { DepartmentMemberViewModel } from '@/lib/departments/departmentTypes';

type DepartmentRole = 'MEMBER' | 'MANAGER';

interface DepartmentAreaMembershipSectionProps {
    members: DepartmentMemberViewModel[];
    canManage: boolean;
    isPending: boolean;
    onRoleChange: (userId: string, role: DepartmentRole) => void;
    onRemove: (member: DepartmentMemberViewModel) => void;
}

export function DepartmentAreaMembershipSection({
    members,
    canManage,
    isPending,
    onRoleChange,
    onRemove,
}: DepartmentAreaMembershipSectionProps) {
    return (
        <section>
            <h3 className="font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                Abteilungsmitglieder
            </h3>

            {members.length === 0 ? (
                <p className="mt-3 text-sm text-text-dim">
                    Dieser Abteilung sind noch keine Mitglieder zugeordnet.
                </p>
            ) : (
                <ul className="mt-3 space-y-2">
                    {members.map((member) => (
                        <li
                            key={member.userId}
                            className="flex flex-col gap-2 border border-line bg-panel-alt px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div>
                                <span className="text-sm text-text">{member.sc_handle}</span>

                                <p className="font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                                    {member.status}
                                </p>
                            </div>

                            {canManage ? (
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <select
                                        aria-label={`Rolle von ${member.sc_handle}`}
                                        className="input-terminal"
                                        value={member.role}
                                        disabled={isPending}
                                        onChange={(event) =>
                                            onRoleChange(
                                                member.userId,
                                                event.target.value as DepartmentRole
                                            )
                                        }
                                    >
                                        <option value="MEMBER">Mitglied</option>
                                        <option value="MANAGER">Abteilungsmanager</option>
                                    </select>

                                    <TerminalButton
                                        type="button"
                                        variant="danger"
                                        disabled={isPending}
                                        onClick={() => onRemove(member)}
                                    >
                                        Entfernen
                                    </TerminalButton>
                                </div>
                            ) : (
                                <span className="font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                                    {member.role === 'MANAGER' ? 'Abteilungsmanager' : 'Mitglied'}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
