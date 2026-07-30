import type { UserStatus } from '@/lib/generated/client';
import type { AccessGroupOption } from '@/lib/access-groups/accessGroupTypes';

import type { AdminUser } from '../adminTypes';
import type { useAdminUserActions } from '../useAdminUserActions';
import { AdminUserActions } from './AdminUserActions';
import { FormatDate } from './FormatDate';
import { UserAccessGroupBadges } from './UserAccessGroupBadges';
import { UserAccessGroupEditor } from './UserAccessGroupEditor';

interface AdminUserTableProps {
    users: AdminUser[];
    type: UserStatus;
    currentUserId: string;
    onAction: ReturnType<typeof useAdminUserActions>['openModal'];
    actions: ReturnType<typeof useAdminUserActions>['actions'];
    availableGroups: readonly AccessGroupOption[];
}

export function AdminUserTable({
    users,
    type,
    currentUserId,
    onAction,
    actions,
    availableGroups,
}: AdminUserTableProps) {
    return (
        <div className="overflow-x-auto bg-panel border border-line rounded">
            <table className="w-full text-left border-collapse text-sm font-mono text-text">
                <thead>
                    <tr className="border-b border-line bg-panel-alt text-text-dim">
                        <th className="p-4">RSI Handle</th>
                        <th className="p-4">Rolle</th>
                        <th className="p-4">Zugriffsgruppen</th>
                        <th className="p-4">Registriert am</th>
                        {type === 'REJECTED' && (
                            <th className="p-4">Fehlversuche / Abgelehnt am</th>
                        )}
                        {type === 'BANNED' && <th className="p-4">Gesperrt am</th>}
                        <th className="p-4 text-right">Aktionen</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-line">
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-panel-alt/50 transition-colors">
                            <td className="p-4 font-medium">
                                {user.sc_handle}
                                {user.id === currentUserId && (
                                    <span className="ml-2 text-xs text-cyan">(Du)</span>
                                )}
                            </td>
                            <td className="p-4">
                                <span className="px-2 py-0.5 text-xs rounded bg-panel-alt border border-line text-text-dim">
                                    {user.role}
                                </span>
                            </td>
                            <td className="min-w-64 p-4">
                                <UserAccessGroupBadges groups={user.accessGroups} />

                                <div className="mt-2">
                                    <UserAccessGroupEditor
                                        userId={user.id}
                                        userHandle={user.sc_handle}
                                        userStatus={user.status}
                                        assignedGroups={user.accessGroups}
                                        availableGroups={availableGroups}
                                    />
                                </div>
                            </td>
                            <td className="p-4 text-text-dim">
                                <FormatDate date={user.createdAt} withTime />
                            </td>
                            {type === 'REJECTED' && (
                                <td className="p-4 text-text-dim">
                                    <span className="text-danger font-semibold">
                                        {user.failed_attempts} Versuche
                                    </span>
                                    {user.rejectedAt && (
                                        <span className="text-text-dim block text-xs">
                                            <FormatDate date={user.rejectedAt} withTime />
                                        </span>
                                    )}
                                </td>
                            )}
                            {type === 'BANNED' && (
                                <td className="p-4 text-danger-deep text-xs">
                                    {user.bannedAt ? (
                                        <FormatDate date={user.bannedAt} withTime />
                                    ) : (
                                        '-'
                                    )}
                                </td>
                            )}
                            <td className="p-4 text-right">
                                <AdminUserActions
                                    user={user}
                                    type={type}
                                    currentUserId={currentUserId}
                                    onAction={onAction}
                                    actions={actions}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
