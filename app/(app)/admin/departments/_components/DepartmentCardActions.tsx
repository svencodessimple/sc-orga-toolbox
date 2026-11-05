import { TerminalButton } from '@/components/mobiglas/TerminalButton';

interface DepartmentCardActionsProps {
    isArchived: boolean;
    isPending: boolean;
    onArchive: () => void;
    onRestore: () => void;
}

export function DepartmentCardActions({
    isArchived,
    isPending,
    onArchive,
    onRestore,
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
            </div>

            {!isArchived && (
                <TerminalButton type="submit" className="w-auto!" disabled={isPending}>
                    {isPending ? 'Verarbeitung läuft …' : 'Änderungen speichern'}
                </TerminalButton>
            )}
        </div>
    );
}
