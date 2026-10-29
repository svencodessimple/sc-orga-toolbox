import 'server-only';

import { UserStatus } from '@/lib/generated/browser';
import { prisma } from '@/lib/prisma';

export async function getDepartmentMemberships(departmentId: string) {
    const memberships = await prisma.departmentMembership.findMany({
        where: { departmentId },
        include: {
            user: {
                select: {
                    id: true,
                    sc_handle: true,
                    status: true,
                },
            },
        },
    });

    return memberships
        .map(({ user, ...membership }) => ({
            ...membership,
            user,
        }))
        .sort((a, b) => a.user.sc_handle.localeCompare(b.user.sc_handle, 'de'));
}

export async function searchAvailableDepartmentMembers(departmentId: string, query: string) {
    return prisma.user.findMany({
        where: {
            status: UserStatus.ACTIVE,
            sc_handle: {
                contains: query,
            },
            departmentMemberships: {
                none: { departmentId },
            },
        },
        select: {
            id: true,
            sc_handle: true,
        },
        orderBy: {
            sc_handle: 'asc',
        },
        take: 10,
    });
}
