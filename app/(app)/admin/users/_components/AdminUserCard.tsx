import { TerminalPanel } from '@/components/mobiglas/TerminalPanel';
import type { UserStatus } from '@/lib/generated/client';
import type { AccessGroupOption } from '@/lib/access-groups/accessGroupTypes';

import { UserAccessGroupBadges } from './UserAccessGroupBadges';
import { UserAccessGroupEditor } from './UserAccessGroupEditor';
import type { AdminUser } from '../adminTypes';
import type { useAdminUserActions } from '../useAdminUserActions';
import { AdminUserActions } from './AdminUserActions';
import { FormatDate } from './FormatDate';

interface AdminUserCardProps {
    user: AdminUser;
    type: UserStatus;
    currentUserId: string;
    onAction: ReturnType<typeof useAdminUserActions>['openModal'];
    actions: ReturnType<typeof useAdminUserActions>['actions'];
    availableGroups: readonly AccessGroupOption[];
}

export function AdminUserCard({
    user,
    type,
    currentUserId,
    onAction,
    actions,
    availableGroups,
}: AdminUserCardProps) {
    return (
        <TerminalPanel showCorners={false} className="max-w-none">
            <div className="flex justify-between items-start mb-3">
                <span className="font-mono font-medium">
                    {user.sc_handle}
                    {user.id === currentUserId && (
                        <span className="ml-2 text-xs text-cyan">(Du)</span>
                    )}
                </span>
                <span className="px-2 py-0.5 text-xs rounded bg-panel-alt border border-line text-text-dim">
                    {user.role}
                </span>
            </div>
            <p className="font-mono text-xs text-text-dim mb-1">
                Registriert: <FormatDate date={user.createdAt} withTime />
            </p>
            {type === 'REJECTED' && (
                <p className="font-mono text-xs text-danger mb-1">
                    {user.failed_attempts} Versuche
                    {user.rejectedAt && (
                        <>
                            {' '}
                            — <FormatDate date={user.rejectedAt} withTime />
                        </>
                    )}
                </p>
            )}
            {type === 'BANNED' && user.bannedAt && (
                <p className="font-mono text-xs text-danger-deep mb-1">
                    Gesperrt: <FormatDate date={user.bannedAt} withTime />
                </p>
            )}

            <div className="mt-4 border-t border-line pt-3">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.08em] text-text-dim">
                    Zugriffsgruppen
                </p>

                <UserAccessGroupBadges groups={user.accessGroups} />

                <div className="mt-3">
                    <UserAccessGroupEditor
                        userId={user.id}
                        userHandle={user.sc_handle}
                        userStatus={user.status}
                        assignedGroups={user.accessGroups}
                        availableGroups={availableGroups}
                    />
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-line">
                <AdminUserActions
                    user={user}
                    type={type}
                    currentUserId={currentUserId}
                    onAction={onAction}
                    actions={actions}
                />
            </div>
        </TerminalPanel>
    );
}
