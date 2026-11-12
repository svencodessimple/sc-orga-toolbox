import type { DepartmentViewModel } from '@/lib/departments/departmentTypes';

interface DepartmentAreaCardHeaderProps {
    department: DepartmentViewModel;
    ownRole: 'MEMBER' | 'MANAGER' | null;
    canManage: boolean;
}

export function DepartmentAreaCardHeader({
    department,
    ownRole,
    canManage,
}: DepartmentAreaCardHeaderProps) {
    return (
        <summary className="focus-terminal flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-xl uppercase tracking-wider text-text">
                        {department.name}
                    </h2>

                    {ownRole && (
                        <span className="border border-cyan-dim px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-cyan">
                            {ownRole === 'MANAGER' ? 'Manager' : 'Mitglied'}
                        </span>
                    )}

                    {canManage && (
                        <span className="border border-amber-dim px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-amber">
                            Verwaltung
                        </span>
                    )}
                </div>

                <p className="mt-2 text-sm text-text-dim">
                    {department.description || 'Keine Beschreibung hinterlegt.'}
                </p>
            </div>

            <div className="font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                {department.memberCount} Mitglieder
            </div>
        </summary>
    );
}
