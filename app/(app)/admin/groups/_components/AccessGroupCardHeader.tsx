import type { AccessGroupViewModel } from '@/lib/access-groups/accessGroupTypes';

interface AccessGroupCardHeaderProps {
    group: AccessGroupViewModel;
}

export function AccessGroupCardHeader({ group }: AccessGroupCardHeaderProps) {
    const isArchived = group.archivedAt !== null;

    return (
        <summary className="focus-terminal flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-xl uppercase tracking-wider text-text">
                        {group.name}
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

                <p className="mt-2 font-mono text-xs text-text-dim">{group.key}</p>
            </div>

            <div className="flex gap-5 font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                <span>{group.memberCount} Benutzer</span>
                <span>{group.moduleCount} Module</span>
            </div>
        </summary>
    );
}
