'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { ConfirmationModal } from '@/app/(app)/admin/_components/ConfirmationModal';
import { TerminalPanel } from '@/components/mobiglas/TerminalPanel';
import type { DepartmentViewModel } from '@/lib/departments/departmentTypes';

import {
    archiveDepartment,
    deleteDepartment,
    restoreDepartment,
    updateDepartment,
} from '../actions';
import { DepartmentCardActions } from './DepartmentCardActions';
import { DepartmentCardHeader } from './DepartmentCardHeader';
import { DepartmentGeneralFields } from './DepartmentGeneralFields';
import { DepartmentMembershipSection } from './DepartmentMembershipSection';
import type { DepartmentActionResult } from '../departmentActionTypes';

interface DepartmentCardProps {
    department: DepartmentViewModel;
    isArchived: boolean;
}

type ConfirmationAction = 'archive' | 'restore' | 'delete';

interface ConfirmationConfig {
    title: string;
    message: string;
    variant: 'primary' | 'danger';
}

function getConfirmationConfig(
    action: ConfirmationAction,
    departmentName: string
): ConfirmationConfig {
    switch (action) {
        case 'archive':
            return {
                title: 'Abteilung archivieren',
                message:
                    `Möchtest du die Abteilung „${departmentName}“ archivieren? ` +
                    'Die Abteilung und ihre Mitgliedschaften bleiben erhalten und können später wiederhergestellt werden.',
                variant: 'danger',
            };

        case 'restore':
            return {
                title: 'Abteilung wiederherstellen',
                message:
                    `Möchtest du die Abteilung „${departmentName}“ wiederherstellen? ` +
                    'Die bestehenden Mitgliedschaften werden dadurch wieder aktiv.',
                variant: 'primary',
            };

        case 'delete':
            return {
                title: 'Abteilung endgültig löschen',
                message:
                    `Möchtest du die Abteilung „${departmentName}“ wirklich endgültig löschen? ` +
                    'Diese Aktion kann nicht rückgängig gemacht werden.',
                variant: 'danger',
            };
    }
}

export function DepartmentCard({ department, isArchived }: DepartmentCardProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [name, setName] = useState(department.name);
    const [description, setDescription] = useState(department.description ?? '');
    const [confirmationAction, setConfirmationAction] = useState<ConfirmationAction | null>(null);

    const confirmationConfig = confirmationAction
        ? getConfirmationConfig(confirmationAction, department.name)
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
                await updateDepartment({
                    departmentId: department.id,
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
            let result: DepartmentActionResult;

            switch (confirmationAction) {
                case 'archive':
                    result = await archiveDepartment(department.id);
                    break;

                case 'restore':
                    result = await restoreDepartment(department.id);
                    break;

                case 'delete':
                    result = await deleteDepartment(department.id);
                    break;
            }

            if (showResult(result)) {
                setConfirmationAction(null);
            }
        });
    }

    return (
        <>
            <TerminalPanel className="max-w-none">
                <details className="group">
                    <DepartmentCardHeader department={department} />

                    <form
                        onSubmit={handleSubmit}
                        className="mt-5 space-y-6 border-t border-line pt-6"
                    >
                        <DepartmentGeneralFields
                            name={name}
                            description={description}
                            isPending={isPending || isArchived}
                            onNameChange={setName}
                            onDescriptionChange={setDescription}
                        />

                        <DepartmentMembershipSection members={department.members} />

                        <DepartmentCardActions
                            isArchived={isArchived}
                            isPending={isPending}
                            onArchive={() => setConfirmationAction('archive')}
                            onRestore={() => setConfirmationAction('restore')}
                            onDelete={() => setConfirmationAction('delete')}
                            memberCount={department.members.length}
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
