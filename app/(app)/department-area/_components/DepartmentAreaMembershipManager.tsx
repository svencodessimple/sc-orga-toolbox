'use client';

import { useState, useTransition } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { TerminalButton } from '@/components/mobiglas/TerminalButton';
import { TerminalInput } from '@/components/mobiglas/TerminalInput';
import { ConfirmationModal } from '@/app/(app)/admin/_components/ConfirmationModal';

import {
    assignDepartmentMember,
    removeDepartmentMember,
    searchDepartmentMembers,
    updateDepartmentMemberRole,
} from '@/app/(app)/admin/departments/actions';

import type { DepartmentMemberViewModel } from '@/lib/departments/departmentTypes';

import { DepartmentAreaMembershipSection } from './DepartmentAreaMembershipSection';

type DepartmentRole = 'MEMBER' | 'MANAGER';

interface AvailableUser {
    id: string;
    sc_handle: string;
}

interface DepartmentAreaMembershipManagerProps {
    departmentId: string;
    members: DepartmentMemberViewModel[];
    canManage: boolean;
}

export function DepartmentAreaMembershipManager({
    departmentId,
    members,
    canManage,
}: DepartmentAreaMembershipManagerProps) {
    const router = useRouter();

    const [isPending, startTransition] = useTransition();
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<AvailableUser[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [assignmentRole, setAssignmentRole] = useState<DepartmentRole>('MEMBER');
    const [memberToRemove, setMemberToRemove] = useState<DepartmentMemberViewModel | null>(null);

    function handleSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const normalizedQuery = query.trim();

        if (normalizedQuery.length < 2) {
            toast.error('Bitte mindestens zwei Zeichen eingeben.');
            return;
        }

        startTransition(async () => {
            const result = await searchDepartmentMembers({
                departmentId,
                query: normalizedQuery,
            });

            if (!result.success) {
                toast.error(result.message);
                setSearchResults([]);
                setHasSearched(true);
                return;
            }

            setSearchResults(result.users);
            setHasSearched(true);
        });
    }

    function handleAssign(user: AvailableUser) {
        startTransition(async () => {
            const result = await assignDepartmentMember({
                departmentId,
                userId: user.id,
                role: assignmentRole,
            });

            if (!result.success) {
                toast.error(result.message);
                return;
            }

            toast.success(result.message);
            setQuery('');
            setSearchResults([]);
            setHasSearched(false);
            router.refresh();
        });
    }

    function handleRoleChange(userId: string, role: DepartmentRole) {
        startTransition(async () => {
            const result = await updateDepartmentMemberRole({
                departmentId,
                userId,
                role,
            });

            if (!result.success) {
                toast.error(result.message);
                return;
            }

            toast.success(result.message);
            router.refresh();
        });
    }

    function handleRemove() {
        if (!memberToRemove) return;

        startTransition(async () => {
            const result = await removeDepartmentMember({
                departmentId,
                userId: memberToRemove.userId,
            });

            if (!result.success) {
                toast.error(result.message);
                return;
            }

            toast.success(result.message);
            setMemberToRemove(null);
            router.refresh();
        });
    }

    return (
        <section>
            {canManage && (
                <div className="mb-5 border border-line bg-panel-alt p-3">
                    <h3 className="font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                        Mitglieder hinzufügen
                    </h3>

                    <form onSubmit={handleSearch} className="mt-3">
                        <TerminalInput
                            id={`member-search-${departmentId}`}
                            label="Aktive User suchen"
                            type="search"
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setSearchResults([]);
                                setHasSearched(false);
                            }}
                            placeholder="SC-Handle eingeben..."
                            minLength={2}
                            maxLength={80}
                            disabled={isPending}
                        />

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="flex-1">
                                <label
                                    htmlFor={`assignment-role-${departmentId}`}
                                    className="label-terminal"
                                >
                                    Abteilungsrolle
                                </label>

                                <select
                                    id={`assignment-role-${departmentId}`}
                                    className="input-terminal"
                                    value={assignmentRole}
                                    onChange={(event) =>
                                        setAssignmentRole(event.target.value as DepartmentRole)
                                    }
                                    disabled={isPending}
                                >
                                    <option value="MEMBER">Mitglied</option>
                                    <option value="MANAGER">Abteilungsmanager</option>
                                </select>
                            </div>

                            <TerminalButton
                                type="submit"
                                disabled={isPending || query.trim().length < 2}
                                className="w-full sm:w-auto"
                            >
                                Suchen
                            </TerminalButton>
                        </div>
                    </form>

                    {hasSearched && (
                        <div className="mt-4 border-t border-line pt-3">
                            {searchResults.length === 0 ? (
                                <p className="text-sm text-text-dim">
                                    Keine passenden aktiven User gefunden.
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {searchResults.map((user) => (
                                        <li
                                            key={user.id}
                                            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <span className="text-sm text-text">
                                                {user.sc_handle}
                                            </span>

                                            <TerminalButton
                                                type="button"
                                                disabled={isPending}
                                                onClick={() => handleAssign(user)}
                                                className="w-full sm:w-auto"
                                            >
                                                Hinzufügen
                                            </TerminalButton>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            )}

            <DepartmentAreaMembershipSection
                members={members}
                canManage={canManage}
                isPending={isPending}
                onRoleChange={handleRoleChange}
                onRemove={setMemberToRemove}
            />

            <ConfirmationModal
                isOpen={memberToRemove !== null}
                title="Mitglied entfernen"
                message={
                    memberToRemove
                        ? `Möchtest du ${memberToRemove.sc_handle} wirklich aus dieser Abteilung entfernen?`
                        : ''
                }
                variant="danger"
                isLoading={isPending}
                onCancel={() => setMemberToRemove(null)}
                onConfirm={handleRemove}
            />
        </section>
    );
}
