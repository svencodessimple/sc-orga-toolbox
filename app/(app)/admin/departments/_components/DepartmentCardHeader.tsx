import type { DepartmentViewModel } from '@/lib/departments/departmentTypes';

interface DepartmentCardHeaderProps {
    department: DepartmentViewModel;
}

export function DepartmentCardHeader({ department }: DepartmentCardHeaderProps) {
    const isArchived = department.archivedAt !== null;

    return (
        <summary className="focus-terminal flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-xl uppercase tracking-wider text-text">
                        {department.name}
                    </h3>

                    <span
                        className={
                            isArchived
                                ? 'border border-amber-dim px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-amber'
                                : 'border border-cyan-dim px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-cyan'
                        }
                    >
                        {isArchived ? 'Archiviert' : 'Aktiv'}
                    </span>
                </div>

                <p className="mt-2 text-sm text-text-dim">
                    {department.description || 'Keine Beschreibung hinterlegt.'}
                </p>
            </div>

            <div className="font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                <span>{department.memberCount} Mitglieder</span>
            </div>
        </summary>
    );
}
