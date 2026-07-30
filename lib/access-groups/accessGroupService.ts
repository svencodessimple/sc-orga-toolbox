import 'server-only';

import { prisma } from '@/lib/prisma';
import { moduleDefinitions } from '@/lib/modules/moduleCatalog';

import type { AccessGroupOption, AccessGroupViewModel } from './accessGroupTypes';

interface AccessGroupWithCounts {
    id: string;
    key: string;
    name: string;
    description: string | null;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    modules: {
        moduleId: string;
    }[];
    _count: {
        members: number;
        modules: number;
    };
}

function toAccessGroupViewModel(group: AccessGroupWithCounts): AccessGroupViewModel {
    const moduleCount = group.modules.filter(({ moduleId }) =>
        groupConfigurableModuleIds.has(moduleId)
    ).length;

    return {
        id: group.id,
        key: group.key,
        name: group.name,
        description: group.description,
        archivedAt: group.archivedAt,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        memberCount: group._count.members,
        moduleCount,
        invalidModuleAssignmentCount: group._count.modules - moduleCount,
    };
}

export async function getAccessGroups(
    options: {
        includeArchived?: boolean;
    } = {}
): Promise<AccessGroupViewModel[]> {
    const groups = await prisma.accessGroup.findMany({
        where: options.includeArchived
            ? undefined
            : {
                  archivedAt: null,
              },
        include: {
            modules: {
                select: {
                    moduleId: true,
                },
            },
            _count: {
                select: {
                    members: true,
                    modules: true,
                },
            },
        },
        orderBy: {
            name: 'asc',
        },
    });

    return groups.map(toAccessGroupViewModel);
}

export async function getAccessGroupById(groupId: string): Promise<AccessGroupViewModel | null> {
    const group = await prisma.accessGroup.findUnique({
        where: {
            id: groupId,
        },
        include: {
            modules: {
                select: {
                    moduleId: true,
                },
            },
            _count: {
                select: {
                    members: true,
                    modules: true,
                },
            },
        },
    });

    return group ? toAccessGroupViewModel(group) : null;
}

export async function getActiveAccessGroups(): Promise<AccessGroupOption[]> {
    return prisma.accessGroup.findMany({
        where: {
            archivedAt: null,
        },
        select: {
            id: true,
            key: true,
            name: true,
        },
        orderBy: {
            name: 'asc',
        },
    });
}

export async function getActiveGroupIdsForUser(userId: string): Promise<string[]> {
    const assignments = await prisma.userAccessGroup.findMany({
        where: {
            userId,
            group: {
                archivedAt: null,
            },
        },
        select: {
            groupId: true,
        },
    });

    return assignments.map(({ groupId }) => groupId);
}

export async function getActiveGroupIdsByModule(): Promise<Map<string, string[]>> {
    const assignments = await prisma.moduleAccessGroup.findMany({
        where: {
            group: {
                archivedAt: null,
            },
        },
        select: {
            moduleId: true,
            groupId: true,
        },
    });

    const groupIdsByModule = new Map<string, string[]>();

    for (const assignment of assignments) {
        const groupIds = groupIdsByModule.get(assignment.moduleId) ?? [];

        groupIds.push(assignment.groupId);
        groupIdsByModule.set(assignment.moduleId, groupIds);
    }

    return groupIdsByModule;
}

const groupConfigurableModuleIds = new Set(
    moduleDefinitions
        .filter((definition) => definition.configuration.allowedGroups)
        .map((definition) => definition.id)
);
