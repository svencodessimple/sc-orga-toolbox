import { TerminalButton } from '@/components/mobiglas/TerminalButton';
import type { Role, UserStatus } from '@/lib/generated/client';

import type { AdminAction } from '../adminActionTypes';

interface AdminUserActionsProps {
    user: {
        id: string;
        sc_handle: string;
        role: Role;
    };
    type: UserStatus;
    currentUserId: string;
    onAction: (
        action: AdminAction,
        id: string,
        title: string,
        message: string,
        variant?: 'primary' | 'danger'
    ) => void;
    actions: ReturnType<typeof import('../useAdminUserActions').useAdminUserActions>['actions'];
}

export function AdminUserActions({
    user,
    type,
    currentUserId,
    onAction,
    actions,
}: AdminUserActionsProps) {
    const isCurrentUser = user.id === currentUserId;

    if (isCurrentUser) {
        return <p className="mt-1 font-mono text-xs text-text-dim">Eigener Account</p>;
    }

    const canChangeRole = type === 'ACTIVE';

    return (
        <div className="flex gap-2 flex-wrap justify-end">
            {type === 'VERIFIED' && (
                <TerminalButton
                    variant="secondary"
                    className="w-auto! px-3 py-1"
                    onClick={() =>
                        onAction(
                            actions.activateUser,
                            user.id,
                            'Mitglied aktivieren',
                            `Möchtest du den User ${user.sc_handle} wirklich als ACTIVE freischalten?`,
                            'primary'
                        )
                    }
                >
                    Aktivieren
                </TerminalButton>
            )}

            {canChangeRole && user.role === 'MEMBER' && (
                <TerminalButton
                    variant="secondary"
                    className="w-auto! px-3 py-1"
                    onClick={() =>
                        onAction(
                            actions.promoteUser,
                            user.id,
                            'Zum Admin machen',
                            `Möchtest du ${user.sc_handle} wirklich die Rolle ADMIN geben?`,
                            'primary'
                        )
                    }
                >
                    Zum Admin machen
                </TerminalButton>
            )}

            {canChangeRole && user.role === 'ADMIN' && (
                <TerminalButton
                    variant="secondary"
                    className="w-auto! px-3 py-1"
                    onClick={() =>
                        onAction(
                            actions.demoteUser,
                            user.id,
                            'Zum Mitglied machen',
                            `Möchtest du ${user.sc_handle} wirklich auf die Rolle MEMBER herabstufen?`,
                            'primary'
                        )
                    }
                >
                    Zum Mitglied machen
                </TerminalButton>
            )}

            {type === 'ACTIVE' && (
                <TerminalButton
                    variant="secondary"
                    className="w-auto! px-3 py-1"
                    onClick={() =>
                        onAction(
                            actions.banUser,
                            user.id,
                            'Mitglied bannen',
                            `Möchtest du den User ${user.sc_handle} wirklich bannen?`,
                            'danger'
                        )
                    }
                >
                    Bannen
                </TerminalButton>
            )}

            {type === 'REJECTED' && (
                <TerminalButton
                    variant="secondary"
                    className="w-auto! px-3 py-1"
                    onClick={() =>
                        onAction(
                            actions.resetUserAttempts,
                            user.id,
                            'Fehlversuche zurücksetzen',
                            `Möchtest du die Fehlversuche des User ${user.sc_handle} wirklich zurücksetzen?`,
                            'primary'
                        )
                    }
                >
                    Retry (Loop)
                </TerminalButton>
            )}

            {type === 'BANNED' && (
                <TerminalButton
                    variant="secondary"
                    className="w-auto! px-3 py-1"
                    onClick={() =>
                        onAction(
                            actions.unbanUser,
                            user.id,
                            'Mitglied entsperren',
                            `Möchtest du den User ${user.sc_handle} wirklich entsperren? Rolle und Gruppenzuweisungen bleiben erhalten.`,
                            'primary'
                        )
                    }
                >
                    Entsperren
                </TerminalButton>
            )}

            {type !== 'ACTIVE' && (
                <TerminalButton
                    variant="secondary"
                    className="w-auto! px-3 py-1"
                    onClick={() =>
                        onAction(
                            actions.deleteUser,
                            user.id,
                            'Mitglied löschen',
                            `Möchtest du den User ${user.sc_handle} wirklich löschen?`,
                            'danger'
                        )
                    }
                >
                    Löschen
                </TerminalButton>
            )}
        </div>
    );
}
