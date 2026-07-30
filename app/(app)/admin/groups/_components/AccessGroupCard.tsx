'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { TerminalPanel } from '@/components/mobiglas/TerminalPanel';
import type { AccessGroupViewModel } from '@/lib/access-groups/accessGroupTypes';

import { ConfirmationModal } from '../../_components/ConfirmationModal';
import {
    archiveAccessGroup,
    deleteAccessGroup,
    restoreAccessGroup,
    updateAccessGroup,
} from '../actions';
import { AccessGroupAssignmentSummary } from './AccessGroupAssignmentSummary';
import { AccessGroupCardActions } from './AccessGroupCardActions';
import { AccessGroupCardHeader } from './AccessGroupCardHeader';
import { AccessGroupGeneralFields } from './AccessGroupGeneralFields';

interface AccessGroupCardProps {
    group: AccessGroupViewModel;
}

type ConfirmationAction = 'archive' | 'restore' | 'delete';

interface ConfirmationConfig {
    title: string;
    message: string;
    variant: 'primary' | 'danger';
}

function getConfirmationConfig(action: ConfirmationAction, groupName: string): ConfirmationConfig {
    switch (action) {
        case 'archive':
            return {
                title: 'Zugriffsgruppe archivieren',
                message:
                    `Möchtest du die Zugriffsgruppe „${groupName}“ archivieren? ` +
                    'Bestehende Zuordnungen bleiben erhalten, gewähren aber keinen Zugriff mehr.',
                variant: 'danger',
            };

        case 'restore':
            return {
                title: 'Zugriffsgruppe wiederherstellen',
                message:
                    `Möchtest du die Zugriffsgruppe „${groupName}“ wiederherstellen? ` +
                    'Bestehende Benutzer- und Modulzuordnungen werden dadurch wieder wirksam.',
                variant: 'primary',
            };

        case 'delete':
            return {
                title: 'Zugriffsgruppe endgültig löschen',
                message:
                    `Möchtest du die Zugriffsgruppe „${groupName}“ endgültig löschen? ` +
                    'Diese Aktion kann nicht rückgängig gemacht werden.',
                variant: 'danger',
            };
    }
}

export function AccessGroupCard({ group }: AccessGroupCardProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [name, setName] = useState(group.name);
    const [description, setDescription] = useState(group.description ?? '');
    const [confirmationAction, setConfirmationAction] = useState<ConfirmationAction | null>(null);

    const isArchived = group.archivedAt !== null;
    const isInUse =
        group.memberCount > 0 || group.moduleCount > 0 || group.invalidModuleAssignmentCount > 0;

    const confirmationConfig = confirmationAction
        ? getConfirmationConfig(confirmationAction, group.name)
        : null;

    function showResult(result: { success: boolean; message: string }) {
        if (!result.success) {
            toast.error(result.message);
            return false;
        }

        toast.success(result.message);
        router.refresh();

        return true;
    }

    function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        startTransition(async () => {
            showResult(
                await updateAccessGroup({
                    groupId: group.id,
                    name,
                    description,
                })
            );
        });
    }

    function handleConfirm() {
        if (!confirmationAction) {
            return;
        }

        startTransition(async () => {
            const result =
                confirmationAction === 'archive'
                    ? await archiveAccessGroup(group.id)
                    : confirmationAction === 'restore'
                      ? await restoreAccessGroup(group.id)
                      : await deleteAccessGroup(group.id);

            if (showResult(result)) {
                setConfirmationAction(null);
            }
        });
    }

    return (
        <>
            <TerminalPanel className="max-w-none">
                <details className="group">
                    <AccessGroupCardHeader group={group} />

                    <form
                        onSubmit={handleSubmit}
                        className="mt-5 space-y-6 border-t border-line pt-6"
                    >
                        <AccessGroupGeneralFields
                            groupKey={group.key}
                            name={name}
                            description={description}
                            isPending={isPending}
                            onNameChange={setName}
                            onDescriptionChange={setDescription}
                        />

                        <AccessGroupAssignmentSummary
                            memberCount={group.memberCount}
                            moduleCount={group.moduleCount}
                            invalidModuleAssignmentCount={group.invalidModuleAssignmentCount}
                        />

                        <AccessGroupCardActions
                            isArchived={isArchived}
                            isInUse={isInUse}
                            isPending={isPending}
                            onArchive={() => setConfirmationAction('archive')}
                            onRestore={() => setConfirmationAction('restore')}
                            onDelete={() => setConfirmationAction('delete')}
                        />
                    </form>
                </details>
            </TerminalPanel>

            <ConfirmationModal
                isOpen={confirmationAction !== null}
                title={confirmationConfig?.title ?? ''}
                message={confirmationConfig?.message ?? ''}
                variant={confirmationConfig?.variant ?? 'primary'}
                isLoading={isPending}
                onConfirm={handleConfirm}
                onCancel={() => setConfirmationAction(null)}
            />
        </>
    );
}
