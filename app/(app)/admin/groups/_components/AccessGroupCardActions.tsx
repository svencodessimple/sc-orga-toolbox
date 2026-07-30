import { TerminalButton } from '@/components/mobiglas/TerminalButton';

interface AccessGroupCardActionsProps {
    isArchived: boolean;
    isInUse: boolean;
    isPending: boolean;
    onArchive: () => void;
    onRestore: () => void;
    onDelete: () => void;
}

export function AccessGroupCardActions({
    isArchived,
    isInUse,
    isPending,
    onArchive,
    onRestore,
    onDelete,
}: AccessGroupCardActionsProps) {
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

                <TerminalButton
                    type="button"
                    variant="danger"
                    className="w-auto!"
                    disabled={isPending || isInUse}
                    title={
                        isInUse ? 'Entferne zuerst alle Benutzer- und Modulzuordnungen.' : undefined
                    }
                    onClick={onDelete}
                >
                    Endgültig löschen
                </TerminalButton>
            </div>

            <TerminalButton type="submit" className="w-auto!" disabled={isPending}>
                {isPending ? 'Verarbeitung läuft …' : 'Änderungen speichern'}
            </TerminalButton>
        </div>
    );
}
