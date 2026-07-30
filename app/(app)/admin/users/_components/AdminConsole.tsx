import { ConsolePanel } from '@/components/mobiglas/ConsolePanel';
import type { UserStatus } from '@/lib/generated/client';
import type { AccessGroupOption } from '@/lib/access-groups/accessGroupTypes';

import { ADMIN_TABS } from '../adminNavigation';
import type { AdminUser } from '../adminTypes';
import { AdminTabBar } from './AdminTabBar';
import { AdminToolbar } from './AdminToolbar';
import { AdminUserList } from './AdminUserList';

interface AdminConsoleProps {
    data: Record<UserStatus, AdminUser[]>;
    activeTab: UserStatus;
    currentUserId: string;
    availableGroups: readonly AccessGroupOption[];
}

export function AdminConsole({
    data,
    activeTab,
    currentUserId,
    availableGroups,
}: AdminConsoleProps) {
    const counts = Object.fromEntries(
        Object.entries(data).map(([status, users]) => [status, users.length])
    ) as Record<UserStatus, number>;

    return (
        <ConsolePanel className="mx-auto max-w-7xl">
            <AdminToolbar />
            <AdminTabBar tabs={ADMIN_TABS} counts={counts} activeTab={activeTab} />
            <AdminUserList
                users={data[activeTab]}
                type={activeTab}
                currentUserId={currentUserId}
                availableGroups={availableGroups}
            />
        </ConsolePanel>
    );
}
