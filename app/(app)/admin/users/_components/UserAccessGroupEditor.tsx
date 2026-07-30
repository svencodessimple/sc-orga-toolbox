'use client';

import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { TerminalButton } from '@/components/mobiglas/TerminalButton';
import { TerminalPanel } from '@/components/mobiglas/TerminalPanel';
import type { AccessGroupOption } from '@/lib/access-groups/accessGroupTypes';

import { updateUserAccessGroups } from '../actions';
import type { AdminUser, AdminUserAccessGroup } from '../adminTypes';

interface UserAccessGroupEditorProps {
    userId: string;
    userHandle: string;
    userStatus: AdminUser['status'];
    assignedGroups: readonly AdminUserAccessGroup[];
    availableGroups: readonly AccessGroupOption[];
}

export function UserAccessGroupEditor({
    userId,
    userHandle,
    userStatus,
    assignedGroups,
    availableGroups,
}: UserAccessGroupEditorProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

    const activeAssignments = assignedGroups.filter((group) => group.archivedAt === null);

    const archivedAssignments = assignedGroups.filter((group) => group.archivedAt !== null);

    const isRemovalOnly = userStatus !== 'ACTIVE';

    const editableGroups = isRemovalOnly ? activeAssignments : availableGroups;

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape' && !isPending) {
                setIsOpen(false);
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, isPending]);

    function openEditor() {
        setSelectedGroupIds(activeAssignments.map((group) => group.id));

        setIsOpen(true);
    }

    function toggleGroup(groupId: string) {
        setSelectedGroupIds((current) =>
            current.includes(groupId)
                ? current.filter((id) => id !== groupId)
                : [...current, groupId]
        );
    }

    function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        startTransition(async () => {
            const result = await updateUserAccessGroups({
                userId,
                activeGroupIds: selectedGroupIds,
            });

            if (!result.success) {
                toast.error(result.message);
                return;
            }

            toast.success('Gruppenzuweisungen gespeichert.');
            setIsOpen(false);
            router.refresh();
        });
    }

    if (isRemovalOnly && activeAssignments.length === 0) {
        return null;
    }

    return (
        <>
            <TerminalButton
                type="button"
                variant="secondary"
                className="w-auto! px-3 py-1"
                onClick={openEditor}
            >
                {isRemovalOnly ? 'Gruppen bereinigen' : 'Gruppen bearbeiten'}
            </TerminalButton>

            {isOpen &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        className="fixed inset-0 z-100 flex items-center justify-center p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={`group-editor-title-${userId}`}
                    >
                        <div
                            className="fixed inset-0 bg-bg/80 backdrop-blur-sm"
                            aria-hidden="true"
                            onClick={isPending ? undefined : () => setIsOpen(false)}
                        />

                        <TerminalPanel
                            className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto"
                            showCorners={false}
                        >
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <p className="eyebrow">
                                        <span className="eyebrow-dot" />
                                        Access Assignment
                                    </p>

                                    <h2
                                        id={`group-editor-title-${userId}`}
                                        className="mt-2 font-display text-xl uppercase tracking-wider text-text"
                                    >
                                        Gruppen für {userHandle}
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-text-dim">
                                        {isRemovalOnly
                                            ? 'Bei inaktiven Benutzern können bestehende Gruppen nur entfernt werden.'
                                            : 'Aktive Gruppen können hinzugefügt oder entfernt werden.'}
                                    </p>
                                </div>

                                <fieldset disabled={isPending} className="space-y-3">
                                    <legend className="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                                        Aktive Gruppen
                                    </legend>

                                    {editableGroups.length > 0 ? (
                                        editableGroups.map((group) => (
                                            <label
                                                key={group.id}
                                                className="flex cursor-pointer items-start gap-3 border border-line bg-panel-alt p-3 transition hover:border-cyan-dim"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedGroupIds.includes(group.id)}
                                                    onChange={() => toggleGroup(group.id)}
                                                    className="mt-1 accent-cyan"
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
                                        ))
                                    ) : (
                                        <p className="border border-dashed border-line p-4 font-mono text-xs text-text-dim">
                                            Keine aktiven Zugriffsgruppen vorhanden.
                                        </p>
                                    )}
                                </fieldset>

                                {archivedAssignments.length > 0 && (
                                    <section className="space-y-3 border-t border-line pt-5">
                                        <div>
                                            <p className="font-mono text-xs uppercase tracking-[0.08em] text-amber">
                                                Archivierte Zuordnungen
                                            </p>

                                            <p className="mt-2 text-xs leading-5 text-text-dim">
                                                Diese Zuordnungen bleiben erhalten und können hier
                                                nicht verändert werden.
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {archivedAssignments.map((group) => (
                                                <span
                                                    key={group.id}
                                                    className="border border-amber-dim px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-amber"
                                                >
                                                    {group.name}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
                                    <TerminalButton
                                        autoFocus
                                        type="button"
                                        variant="secondary"
                                        className="w-full! sm:w-auto!"
                                        disabled={isPending}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Abbrechen
                                    </TerminalButton>

                                    <TerminalButton
                                        type="submit"
                                        className="w-full! sm:w-auto!"
                                        disabled={isPending}
                                    >
                                        {isPending ? 'Speichern läuft …' : 'Gruppen speichern'}
                                    </TerminalButton>
                                </div>
                            </form>
                        </TerminalPanel>
                    </div>,
                    document.body
                )}
        </>
    );
}
