'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { ConfirmationModal } from '@/app/(app)/admin/_components/ConfirmationModal';
import { TerminalButton } from '@/components/mobiglas/TerminalButton';

import { archiveDepartment, restoreDepartment, updateDepartment } from '../actions';

interface DepartmentCardProps {
    department: {
        id: string;
        name: string;
        description: string | null;
        memberCount: number;
    };
    isArchived: boolean;
}

export function DepartmentCard({ department, isArchived }: DepartmentCardProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [name, setName] = useState(department.name);
    const [description, setDescription] = useState(department.description ?? '');

    function handleSave(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        startTransition(async () => {
            const result = await updateDepartment({
                departmentId: department.id,
                name,
                description,
            });

            if (!result.success) {
                toast.error(result.message);
                return;
            }

            setIsEditing(false);
            toast.success(result.message);
            router.refresh();
        });
    }

    function handleArchive() {
        startTransition(async () => {
            const result = await archiveDepartment(department.id);

            setIsArchiveModalOpen(false);

            if (!result.success) {
                toast.error(result.message);
                return;
            }

            toast.success(result.message);
            router.refresh();
        });
    }

    function handleRestore() {
        startTransition(async () => {
            const result = await restoreDepartment(department.id);

            if (!result.success) {
                toast.error(result.message);
                return;
            }

            toast.success(result.message);
            router.refresh();
        });
    }

    function handleCancelEdit() {
        setName(department.name);
        setDescription(department.description ?? '');
        setIsEditing(false);
    }

    return (
        <>
            <article className={`terminal-panel max-w-none ${isArchived ? 'opacity-75' : ''}`}>
                {isEditing ? (
                    <form onSubmit={handleSave} className="space-y-4">
                        <label className="block">
                            <span className="mb-2 block font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                                Name
                            </span>
                            <input
                                type="text"
                                required
                                maxLength={80}
                                value={name}
                                disabled={isPending}
                                onChange={(event) => setName(event.target.value)}
                                className="w-full border border-line bg-panel-alt px-3 py-2 text-sm text-text outline-none transition focus:border-cyan disabled:opacity-50"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                                Beschreibung
                            </span>
                            <textarea
                                rows={3}
                                maxLength={300}
                                value={description}
                                disabled={isPending}
                                onChange={(event) => setDescription(event.target.value)}
                                className="w-full resize-y border border-line bg-panel-alt px-3 py-2 text-sm leading-6 text-text outline-none transition focus:border-cyan disabled:opacity-50"
                            />
                        </label>

                        <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:justify-end">
                            <TerminalButton
                                type="button"
                                variant="secondary"
                                className="w-auto!"
                                disabled={isPending}
                                onClick={handleCancelEdit}
                            >
                                Abbrechen
                            </TerminalButton>
                            <TerminalButton type="submit" className="w-auto!" disabled={isPending}>
                                {isPending ? 'Speichern …' : 'Änderungen speichern'}
                            </TerminalButton>
                        </div>
                    </form>
                ) : (
                    <>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <h3 className="font-display text-lg uppercase tracking-wider text-text">
                                    {department.name}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-text-dim">
                                    {department.description || 'Keine Beschreibung hinterlegt.'}
                                </p>
                                <p className="mt-4 font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                                    Mitglieder: {department.memberCount}
                                </p>
                            </div>

                            {isArchived && (
                                <span className="font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                                    Archiviert
                                </span>
                            )}
                        </div>

                        <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
                            {isArchived ? (
                                <TerminalButton
                                    type="button"
                                    variant="secondary"
                                    className="w-auto!"
                                    disabled={isPending}
                                    onClick={handleRestore}
                                >
                                    {isPending ? 'Wird wiederhergestellt …' : 'Wiederherstellen'}
                                </TerminalButton>
                            ) : (
                                <>
                                    <TerminalButton
                                        type="button"
                                        variant="secondary"
                                        className="w-auto!"
                                        disabled={isPending}
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Bearbeiten
                                    </TerminalButton>
                                    <TerminalButton
                                        type="button"
                                        variant="danger"
                                        className="w-auto!"
                                        disabled={isPending}
                                        onClick={() => setIsArchiveModalOpen(true)}
                                    >
                                        Archivieren
                                    </TerminalButton>
                                </>
                            )}
                        </div>
                    </>
                )}
            </article>

            <ConfirmationModal
                isOpen={isArchiveModalOpen}
                title="Abteilung archivieren?"
                message={`„${department.name}“ wird archiviert. Die Abteilung und ihre Mitgliedschaften bleiben erhalten. Du kannst sie später wiederherstellen.`}
                onConfirm={handleArchive}
                onCancel={() => setIsArchiveModalOpen(false)}
                isLoading={isPending}
                variant="danger"
            />
        </>
    );
}
