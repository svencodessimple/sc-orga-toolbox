import 'server-only';

import { prisma } from '@/lib/prisma';

import type { DepartmentViewModel } from './departmentTypes';

interface DepartmentWithMembershipCount {
    id: string;
    name: string;
    description: string | null;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    _count: {
        memberships: number;
    };
}

function toDepartmentViewModel(department: DepartmentWithMembershipCount): DepartmentViewModel {
    return {
        id: department.id,
        name: department.name,
        description: department.description,
        archivedAt: department.archivedAt,
        createdAt: department.createdAt,
        updatedAt: department.updatedAt,
        memberCount: department._count.memberships,
    };
}

export async function getDepartments(
    options: {
        includeArchived?: boolean;
    } = {}
): Promise<DepartmentViewModel[]> {
    const departments = await prisma.department.findMany({
        where: options.includeArchived
            ? undefined
            : {
                  archivedAt: null,
              },
        include: {
            _count: {
                select: {
                    memberships: true,
                },
            },
        },
        orderBy: {
            name: 'asc',
        },
    });

    return departments.map(toDepartmentViewModel);
}

export async function getDepartmentById(departmentId: string): Promise<DepartmentViewModel | null> {
    const department = await prisma.department.findUnique({
        where: {
            id: departmentId,
        },
        include: {
            _count: {
                select: {
                    memberships: true,
                },
            },
        },
    });

    return department ? toDepartmentViewModel(department) : null;
}
