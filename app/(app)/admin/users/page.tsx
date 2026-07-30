import { getActiveAccessGroups } from '@/lib/access-groups/accessGroupService';
import { requireAdminSession } from '@/lib/auth/require-session';

import { AdminConsole } from './_components/AdminConsole';
import { getAdminDashboardData } from './actions';
import { parseAdminTab } from './adminNavigation';

interface AdminUsersPageProps {
    searchParams: Promise<{ tab?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
    const session = await requireAdminSession();

    const { tab } = await searchParams;
    const activeTab = parseAdminTab(tab);

    const [data, availableGroups] = await Promise.all([
        getAdminDashboardData(),
        getActiveAccessGroups(),
    ]);

    return (
        <AdminConsole
            data={data}
            activeTab={activeTab}
            currentUserId={session.user.id}
            availableGroups={availableGroups}
        />
    );
}
