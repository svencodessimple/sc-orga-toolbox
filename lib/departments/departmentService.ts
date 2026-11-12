import 'server-only';

import { prisma } from '@/lib/prisma';

import type { DepartmentViewModel } from './departmentTypes';
import { Role } from '@/lib/generated/browser';

export async function getDepartments(
    options: {
        includeArchived?: boolean;
    } = {}
): Promise<DepartmentViewModel[]> {
    const departments = await prisma.department.findMany({
        where: options.includeArchived ? undefined : { archivedAt: null },
        include: {
            memberships: {
                select: {
                    userId: true,
                    role: true,
                    user: {
                        select: {
                            sc_handle: true,
                            status: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    memberships: true,
                    events: true,
                },
            },
        },
        orderBy: { name: 'asc' },
    });

    return departments.map((department) => ({
        id: department.id,
        name: department.name,
        description: department.description,
        archivedAt: department.archivedAt,
        createdAt: department.createdAt,
        updatedAt: department.updatedAt,
        memberCount: department._count.memberships,
        color: department.color,
        eventCount: department._count.events,
        members: department.memberships
            .map((membership) => ({
                userId: membership.userId,
                sc_handle: membership.user.sc_handle,
                status: membership.user.status,
                role: membership.role,
            }))
            .sort((a, b) => a.sc_handle.localeCompare(b.sc_handle, 'de')),
    }));
}

export async function getDepartmentById(departmentId: string): Promise<DepartmentViewModel | null> {
    const departments = await getDepartments({ includeArchived: true });

    return departments.find((department) => department.id === departmentId) ?? null;
}

export async function getDepartmentsForUser(
    userId: string,
    role: Role
): Promise<DepartmentViewModel[]> {
    const departments = await prisma.department.findMany({
        where: {
            archivedAt: null,
            ...(role === Role.ADMIN
                ? {}
                : {
                      memberships: {
                          some: { userId },
                      },
                  }),
        },
        include: {
            memberships: {
                select: {
                    userId: true,
                    role: true,
                    user: {
                        select: {
                            sc_handle: true,
                            status: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    memberships: true,
                    events: true,
                },
            },
        },
        orderBy: { name: 'asc' },
    });

    return departments.map((department) => ({
        id: department.id,
        name: department.name,
        description: department.description,
        archivedAt: department.archivedAt,
        createdAt: department.createdAt,
        updatedAt: department.updatedAt,
        memberCount: department._count.memberships,
        color: department.color,
        eventCount: department._count.events,
        members: department.memberships
            .map((membership) => ({
                userId: membership.userId,
                sc_handle: membership.user.sc_handle,
                status: membership.user.status,
                role: membership.role,
            }))
            .sort((a, b) => a.sc_handle.localeCompare(b.sc_handle, 'de')),
    }));
}
