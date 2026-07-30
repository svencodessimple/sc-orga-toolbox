import type { AccessGroupOption } from '@/lib/access-groups/accessGroupTypes';

import type { ModuleConfigurationViewModel, ModuleFormState } from '../moduleManagementTypes';

interface ModuleGroupAccessFieldsProps {
    module: ModuleConfigurationViewModel;
    formState: ModuleFormState;
    availableGroups: readonly AccessGroupOption[];
    isPending: boolean;
    onChange: (changes: Partial<ModuleFormState>) => void;
}

export function ModuleGroupAccessFields({
    module,
    formState,
    availableGroups,
    isPending,
    onChange,
}: ModuleGroupAccessFieldsProps) {
    const isLocked = !module.configuration.allowedGroups;

    const archivedAssignments = module.assignedGroups.filter((group) => group.archivedAt !== null);

    function toggleGroup(groupId: string) {
        if (isLocked) {
            return;
        }

        const allowedGroupIds = formState.allowedGroupIds.includes(groupId)
            ? formState.allowedGroupIds.filter((allowedGroupId) => allowedGroupId !== groupId)
            : [...formState.allowedGroupIds, groupId];

        onChange({ allowedGroupIds });
    }

    return (
        <fieldset className="space-y-3">
            <legend className="font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                Gruppenfreigaben
            </legend>

            {isLocked ? (
                <div className="border border-amber-dim bg-amber/5 px-4 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-amber">
                        Technisch gesperrt
                    </p>

                    <p className="mt-2 text-xs leading-5 text-text-dim">
                        Dieses administrative Kernmodul kann nicht über Zugriffsgruppen freigegeben
                        werden.
                    </p>

                    {module.hasPersistentGroupAssignments && (
                        <p className="mt-2 text-xs leading-5 text-danger">
                            Persistierte Gruppenzuordnungen wurden erkannt, werden aber ignoriert.
                            Über „Standard wiederherstellen“ können sie entfernt werden.
                        </p>
                    )}
                </div>
            ) : (
                <>
                    {availableGroups.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-2">
                            {availableGroups.map((group) => (
                                <label
                                    key={group.id}
                                    className="flex cursor-pointer items-start gap-3 border border-line bg-panel-alt px-4 py-3 transition hover:border-cyan-dim"
                                >
                                    <input
                                        type="checkbox"
                                        checked={formState.allowedGroupIds.includes(group.id)}
                                        disabled={isPending}
                                        onChange={() => toggleGroup(group.id)}
                                        className="mt-1 size-4 accent-cyan"
                                    />

                                    <span>
                                        <span className="block text-sm text-text">
                                            {group.name}
                                        </span>

                                        <span className="mt-1 block font-mono text-[10px] text-text-dim">
                                            {group.key}
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <p className="border border-dashed border-line px-4 py-5 font-mono text-xs text-text-dim">
                            Keine aktiven Zugriffsgruppen vorhanden.
                        </p>
                    )}

                    {archivedAssignments.length > 0 && (
                        <div className="border-t border-line pt-4">
                            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-amber">
                                Archivierte Zuordnungen
                            </p>

                            <p className="mt-2 text-xs leading-5 text-text-dim">
                                Diese Zuordnungen bleiben gespeichert, gewähren aber keinen Zugriff
                                und können hier nicht verändert werden.
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {archivedAssignments.map((group) => (
                                    <span
                                        key={group.id}
                                        title={group.key}
                                        className="border border-amber-dim bg-amber/5 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-amber"
                                    >
                                        {group.name} · Archiviert
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </fieldset>
    );
}
