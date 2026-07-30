import type { AdminUserAccessGroup } from '../adminTypes';

interface UserAccessGroupBadgesProps {
    groups: readonly AdminUserAccessGroup[];
}

export function UserAccessGroupBadges({ groups }: UserAccessGroupBadgesProps) {
    if (groups.length === 0) {
        return <span className="font-mono text-xs text-text-dim">Keine Gruppen</span>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {groups.map((group) => {
                const isArchived = group.archivedAt !== null;

                return (
                    <span
                        key={group.id}
                        title={group.key}
                        className={
                            isArchived
                                ? 'border border-amber-dim bg-amber/5 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-amber'
                                : 'border border-cyan-dim bg-cyan/5 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-cyan'
                        }
                    >
                        {group.name}
                        {isArchived ? ' · Archiviert' : ''}
                    </span>
                );
            })}
        </div>
    );
}
