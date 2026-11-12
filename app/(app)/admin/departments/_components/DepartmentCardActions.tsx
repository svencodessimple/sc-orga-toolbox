import { TerminalButton } from '@/components/mobiglas/TerminalButton';

interface DepartmentCardActionsProps {
    isArchived: boolean;
    memberCount: number;
    isPending: boolean;
    onArchive: () => void;
    onRestore: () => void;
    onDelete: () => void;
}

export function DepartmentCardActions({
    isArchived,
    memberCount,
    isPending,
    onArchive,
    onRestore,
    onDelete,
}: DepartmentCardActionsProps) {
    return (
        <div className="flex flex-col gap-3 border-t border-line pt-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row">
                {isArchived ? (
                    <TerminalButton
                        type="button"
                        variant="secondary"
                        className="w-auto!"
                        disabled={isPending}
                        onClick={onRestore}
                    >
                        Wiederherstellen
                    </TerminalButton>
                ) : (
                    <TerminalButton
                        type="button"
                        variant="secondary"
                        className="w-auto!"
                        disabled={isPending}
                        onClick={onArchive}
                    >
                        Archivieren
                    </TerminalButton>
                )}

                {memberCount === 0 && (
                    <TerminalButton
                        type="button"
                        variant="danger"
                        className="w-auto!"
                        disabled={isPending}
                        onClick={onDelete}
                    >
                        Endgültig löschen
                    </TerminalButton>
                )}
            </div>

            {!isArchived && (
                <TerminalButton type="submit" className="w-auto!" disabled={isPending}>
                    {isPending ? 'Verarbeitung läuft …' : 'Änderungen speichern'}
                </TerminalButton>
            )}
        </div>
    );
}
