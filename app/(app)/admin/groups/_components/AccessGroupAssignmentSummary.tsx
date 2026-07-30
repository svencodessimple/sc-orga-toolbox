interface AccessGroupAssignmentSummaryProps {
    memberCount: number;
    moduleCount: number;
    invalidModuleAssignmentCount: number;
}

export function AccessGroupAssignmentSummary({
    memberCount,
    moduleCount,
    invalidModuleAssignmentCount,
}: AccessGroupAssignmentSummaryProps) {
    return (
        <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
            <div className="bg-panel-alt p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-dim">
                    Benutzerzuordnungen
                </p>

                <p className="mt-1 font-display text-xl text-text">{memberCount}</p>
            </div>

            <div className="bg-panel-alt p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-dim">
                    Gültige Modulzuordnungen
                </p>

                <p className="mt-1 font-display text-xl text-text">{moduleCount}</p>
            </div>

            {invalidModuleAssignmentCount > 0 && (
                <div className="flex flex-col gap-2 bg-panel px-4 py-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-amber">
                            Unbekannte Modulzuordnungen
                        </p>

                        <p className="mt-1 text-xs leading-5 text-text-dim">
                            Diese Einträge werden ignoriert und gewähren keinen Zugriff.
                        </p>
                    </div>

                    <span className="inline-flex min-w-10 items-center justify-center self-start border border-amber px-3 py-1 font-display text-sm text-amber sm:self-auto">
                        {invalidModuleAssignmentCount}
                    </span>
                </div>
            )}
        </div>
    );
}
