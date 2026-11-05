import 'server-only';

import { DepartmentRole } from '@/lib/generated/browser';
import { requireActiveSession } from '@/lib/auth/require-session';
import { prisma } from '@/lib/prisma';

export async function hasDepartmentManagementAccess(departmentId: string): Promise<boolean> {
    const session = await requireActiveSession();

    const department = await prisma.department.findFirst({
        where: {
            id: departmentId,
            archivedAt: null,
        },
        select: {
            id: true,
            memberships: {
                where: {
                    userId: session.user.id,
                    role: DepartmentRole.MANAGER,
                },
                select: {
                    userId: true,
                },
                take: 1,
            },
        },
    });

    if (!department) return false;

    return session.user.role === 'ADMIN' || department.memberships.length > 0;
}
